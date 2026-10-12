import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function load(path, replacements = {}) {
  let source = await readFile(new URL(path, import.meta.url), 'utf8');
  for (const [from, to] of Object.entries(replacements)) source = source.replaceAll(from, to);
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  const url = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
  return { module: await import(url), url };
}

globalThis.window = { location: { origin: 'https://frontend.example' } };
const values = new Map();
globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
const api = await load('../src/lib/api.ts', { 'import.meta.env.VITE_API_BASE_URL': "'https://api.example/api/v1'" });
const replacements = { "'../lib/api'": JSON.stringify(api.url), "'zustand'": JSON.stringify(import.meta.resolve('zustand')) };
const journal = (await load('../src/store/jurnalStore.ts', replacements)).module.useJurnalStore;
const legal = (await load('../src/store/dokumenLegalStore.ts', replacements)).module.useDokumenLegalStore;
const ok = (data) => Response.json({ data });

test('attachment API path is normalized and carries authentication', async () => {
  values.set('si_access_token', 'test-token');
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.example/api/v1/lampiran/file/unduh');
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
    assert.equal(options.credentials, 'omit');
    return ok({});
  };
  await api.module.fetchApi('/api/v1/lampiran/file/unduh');
});

test('journal creates draft, uploads evidence, then posts', async () => {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push([url, options.method || 'GET']);
    if (url.startsWith('data:')) return new Response('evidence');
    if (url.endsWith('/jurnal') && options.method === 'POST') {
      assert.equal(JSON.parse(options.body).status, 'draft');
      return ok({ id: 'journal-1' });
    }
    if (url.endsWith('/jurnal')) return ok([]);
    return ok({});
  };
  await journal.getState().add({ status: 'diposting', rows: [], lampiran: [{ nama: 'bukti.pdf', dataUrl: 'data:application/pdf,test' }] });
  const upload = calls.findIndex(([url]) => url.includes('/lampiran?'));
  const posting = calls.findIndex(([url]) => url.endsWith('/posting'));
  assert.ok(upload > 0 && posting > upload);
});

test('failed evidence upload never posts the journal', async () => {
  let posted = false;
  globalThis.fetch = async (url, options = {}) => {
    if (url.startsWith('data:')) return new Response('evidence');
    if (url.includes('/lampiran?')) return Response.json({ message: 'Berkas ditolak' }, { status: 422 });
    if (url.endsWith('/posting')) posted = true;
    return ok(options.method === 'POST' ? { id: 'journal-2' } : []);
  };
  await assert.rejects(journal.getState().add({ status: 'diposting', lampiran: [{ nama: 'bukti.pdf', dataUrl: 'data:application/pdf,test' }] }), /Berkas ditolak/);
  assert.equal(posted, false);
});

test('legal mutations surface server rejection and preserve existing data', async () => {
  legal.setState({ items: [{ id: 'doc-1', hargaAwal: 100 }] });
  globalThis.fetch = async () => Response.json({ message: 'Dokumen terkunci' }, { status: 409 });
  await assert.rejects(legal.getState().updateDataUtama('doc-1', { hargaAwal: 200 }), /Dokumen terkunci/);
  assert.equal(legal.getState().items[0].hargaAwal, 100);
});

const piutang = (await load('../src/store/piutangStore.ts', replacements)).module.usePiutangStore;
test('receivable uses authoritative totals and schedule UUIDs, excluding cancellations', async () => {
  globalThis.fetch = async () => ok([
    { id: 'active', nilaiSppr: 1000, totalDibayar: 700, sisa: 300, periodeAngsuran: [{ jadwalId: 'schedule-uuid', periode: '2026-10', dibayar: 100 }], pembayaranLainnya: [] },
    { id: 'cancelled', status: 'batal', nilaiSppr: 900, totalDibayar: 200, sisa: 0, periodeAngsuran: [], pembayaranLainnya: [] },
  ]);
  await piutang.getState().fetchItems();
  assert.equal(piutang.getState().getById('active').periodeAngsuran[0].id, 'schedule-uuid');
  assert.equal(piutang.getState().getTotalDibayar(), 700);
  assert.equal(piutang.getState().getTotalSisa(), 300);
  assert.equal(piutang.getState().getTotalNilaiKontrak(), 1000);
});
test('journal loads beyond backend default pagination', async () => {
  const visited = [];
  globalThis.fetch = async (url) => {
    const page = Number(new URL(url).searchParams.get('page')); visited.push(page);
    return ok(page === 1 ? Array.from({length: 200}, (_, i) => ({ id: String(i) })) : [{ id: 'last' }]);
  };
  await journal.getState().fetch();
  assert.deepEqual(visited, [1, 2]);
  assert.equal(journal.getState().items.length, 201);
});
