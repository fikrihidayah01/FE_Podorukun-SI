/** Rincian galat per kolom/aturan dari backend. */
export interface ApiErrorDetail {
  field?: string;
  message: string;
}

/** Bentuk body galat standar backend SI. */
export interface ApiErrorBody {
  success?: false;
  message?: string;
  code?: string;
  errors?: Array<ApiErrorDetail | string>;
  requestId?: string;
}

/**
 * Galat API yang sudah dinormalisasi.
 * `message` sudah memuat rincian kolom, jadi aman dipakai langsung di `setError(err.message)`.
 * `summary` hanya kalimat utama, `details` daftar rinciannya (untuk toast/daftar).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly summary: string;
  readonly details: ApiErrorDetail[];
  readonly requestId?: string;
  /** true bila galat ini sudah ditampilkan sebagai toast (mis. oleh fetchApi), supaya tidak dobel. */
  notified = false;

  constructor(opts: { status: number; code?: string; summary: string; details?: ApiErrorDetail[]; requestId?: string }) {
    const details = opts.details ?? [];
    super(composeMessage(opts.summary, details));
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code ?? defaultCode(opts.status);
    this.summary = opts.summary;
    this.details = details;
    this.requestId = opts.requestId;
  }

  /** Galat sistem (bukan kesalahan isian pengguna): jaringan, server, sesi, izin, rate limit. */
  get isSystem(): boolean {
    return this.status === 0 || this.status >= 500 || this.status === 401 || this.status === 403 || this.status === 429;
  }
}

function defaultCode(status: number): string {
  if (status === 0) return 'NETWORK_ERROR';
  if (status >= 500) return 'INTERNAL_ERROR';
  return 'ERROR';
}

/** Gabungkan kalimat utama + rincian yang belum tercakup, mis. "Data tidak valid (2 kesalahan). Kolom 'a': ...; Kolom 'b': ..." */
function composeMessage(summary: string, details: ApiErrorDetail[]): string {
  const extra = details.map((d) => d.message).filter((m) => m && m !== summary && !summary.includes(m));
  if (!extra.length) return summary;
  return `${summary.replace(/[.\s]+$/, '')}. ${extra.join('; ')}`;
}

/** Pesan default per status HTTP bila server tidak memberi pesan (mis. halaman HTML dari proxy). */
export function statusMessage(status: number): string {
  if (status === 0) return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.';
  if (status === 400) return 'Permintaan tidak valid. Periksa kembali isian Anda.';
  if (status === 401) return 'Sesi Anda telah berakhir. Silakan login kembali.';
  if (status === 403) return 'Anda tidak memiliki akses untuk tindakan ini.';
  if (status === 404) return 'Data atau halaman yang diminta tidak ditemukan. Mungkin sudah dihapus.';
  if (status === 408) return 'Permintaan terlalu lama. Coba lagi.';
  if (status === 409) return 'Data bentrok dengan perubahan lain. Muat ulang halaman lalu coba lagi.';
  if (status === 413) return 'Ukuran data atau berkas terlalu besar.';
  if (status === 422) return 'Data belum memenuhi aturan yang berlaku.';
  if (status === 429) return 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.';
  if (status === 502 || status === 503) return 'Server sedang tidak tersedia atau dalam pemeliharaan. Coba lagi beberapa saat lagi.';
  if (status === 504) return 'Server terlalu lama merespons. Coba lagi beberapa saat lagi.';
  if (status >= 500) return 'Terjadi kesalahan pada server. Coba lagi; bila masih gagal, hubungi admin.';
  return `Permintaan gagal (HTTP ${status}).`;
}

function normalizeDetails(errors: ApiErrorBody['errors']): ApiErrorDetail[] {
  if (!Array.isArray(errors)) return [];
  return errors
    .map((e) => (typeof e === 'string' ? { message: e } : e && typeof e.message === 'string' ? e : null))
    .filter((e): e is ApiErrorDetail => e !== null);
}

/** Bangun ApiError dari status + body (body boleh bukan JSON / kosong). */
export function apiErrorFromBody(status: number, body: unknown, requestId?: string): ApiError {
  const b = body && typeof body === 'object' ? (body as ApiErrorBody) : {};
  const serverMessage = typeof b.message === 'string' && b.message.trim() ? b.message.trim() : '';
  return new ApiError({
    status,
    code: b.code,
    summary: serverMessage || statusMessage(status),
    details: normalizeDetails(b.errors),
    requestId: b.requestId ?? requestId,
  });
}

// fetchApi menyimpan galat yang sudah diparse per Response supaya bisa diambil tanpa membaca body lagi.
const parsedErrors = new WeakMap<Response, ApiError>();

export function rememberApiError(res: Response, error: ApiError) {
  parsedErrors.set(res, error);
}

/**
 * Ambil ApiError dari Response gagal (sinkron; body tetap bisa dibaca pemanggil).
 * `context` ditambahkan di depan bila diberikan, mis. "Gagal menghapus akun: Data ini masih dipakai ...".
 *
 *   if (!res.ok) throw apiError(res, 'Gagal menghapus akun');
 */
export function apiError(res: Response, context?: string): ApiError {
  const base = parsedErrors.get(res) ?? apiErrorFromBody(res.status, null, res.headers.get('x-request-id') ?? undefined);
  if (!context) return base;
  const withContext = new ApiError({
    status: base.status,
    code: base.code,
    summary: `${context}: ${base.summary}`,
    details: base.details,
    requestId: base.requestId,
  });
  withContext.notified = base.notified;
  return withContext;
}

/** Teks galat apa pun (ApiError, Error, string) untuk ditampilkan inline. */
export function errorMessage(err: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}

// ── Notifikasi ────────────────────────────────────────────────────────────────
// Modul ini tidak bergantung pada UI. Notifikasi dipancarkan ke "bus" dan ditampilkan
// oleh <NotificationHost/> sebagai toast (lewat sebentar) atau popup (harus dikonfirmasi).

export type NoticeTone = 'error' | 'warning' | 'success' | 'info';

export interface Notice {
  /** Notifikasi dengan id sama tidak ditampilkan dobel. */
  id: string;
  kind: 'toast' | 'popup';
  tone: NoticeTone;
  title: string;
  lines: string[];
  /** Kode referensi log server, ditampilkan agar bisa dilaporkan ke admin. */
  reference?: string;
  /** Label tombol konfirmasi popup. */
  confirmLabel?: string;
  /** Lama toast tampil (ms). */
  duration?: number;
  /** Dipanggil saat popup dikonfirmasi/ditutup. */
  onClose?: () => void;
}

type NoticeListener = (notice: Notice) => void;
const listeners = new Set<NoticeListener>();
// Notifikasi sebelum host terpasang (mis. galat saat aplikasi baru dimuat) ditahan dulu.
const backlog: Notice[] = [];

export function subscribeNotices(listener: NoticeListener): () => void {
  listeners.add(listener);
  backlog.splice(0).forEach(listener);
  return () => { listeners.delete(listener); };
}

function emit(notice: Notice) {
  if (listeners.size === 0) backlog.push(notice);
  else listeners.forEach((listener) => listener(notice));
}

let seq = 0;

/**
 * Popup yang menutupi layar dan harus dikonfirmasi pengguna.
 * Promise selesai saat pengguna menekan tombol konfirmasi.
 */
export function showPopup(opts: Omit<Notice, 'id' | 'kind' | 'lines'> & { id?: string; lines?: string[] }): Promise<void> {
  return new Promise((resolve) => {
    emit({
      ...opts,
      id: opts.id ?? `popup-${++seq}`,
      kind: 'popup',
      lines: opts.lines ?? [],
      onClose: () => { opts.onClose?.(); resolve(); },
    });
  });
}

/** Toast yang lewat sebentar di tengah atas layar. */
export function showToast(opts: Omit<Notice, 'id' | 'kind' | 'lines'> & { id?: string; lines?: string[] }) {
  emit({ ...opts, id: opts.id ?? `toast-${++seq}`, kind: 'toast', lines: opts.lines ?? [] });
}

const MAX_DETAILS = 4;

/**
 * Galat yang perlu perhatian pengguna (server/jaringan mati, sesi berakhir) tampil sebagai popup;
 * galat lain sebagai toast. `mode` memaksa salah satunya.
 */
export function notifyError(err: unknown, opts: { fallback?: string; mode?: 'toast' | 'popup' } = {}) {
  const fallback = opts.fallback ?? 'Terjadi kesalahan. Coba lagi.';
  if (err instanceof ApiError) {
    if (err.notified) return;
    err.notified = true;
    const lines = err.details.map((d) => d.message).filter((m) => m !== err.summary && !err.summary.includes(m));
    const shown = lines.slice(0, MAX_DETAILS);
    if (lines.length > shown.length) shown.push(`…dan ${lines.length - shown.length} kesalahan lain.`);
    const serious = err.status === 0 || err.status >= 500 || err.code === 'SESSION_EXPIRED';
    const kind = opts.mode ?? (serious ? 'popup' : 'toast');
    const notice = {
      // id sama = tidak ditumpuk, mis. banyak request gagal sekaligus karena jaringan putus
      id: `${err.status}:${err.summary}`,
      tone: err.status === 429 || err.status === 403 ? 'warning' as const : 'error' as const,
      title: err.summary,
      lines: shown,
      reference: err.status >= 500 ? err.requestId : undefined,
    };
    if (kind === 'popup') {
      void showPopup({ ...notice, confirmLabel: err.code === 'SESSION_EXPIRED' ? 'Login ulang' : 'Mengerti' });
    } else {
      showToast({ ...notice, duration: 7000 });
    }
    return;
  }
  const message = errorMessage(err, fallback);
  const notice = { id: message, tone: 'error' as const, title: message };
  if (opts.mode === 'popup') void showPopup(notice);
  else showToast(notice);
}

export function notifySuccess(title: string, description?: string) {
  showToast({ tone: 'success', title, lines: description ? [description] : [], duration: 4000 });
}
