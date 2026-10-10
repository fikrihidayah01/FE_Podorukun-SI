const fs = require('fs');
let content = fs.readFileSync('src/store/jurnalStore.ts', 'utf8');

const statusUpdate = `  updateStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      let endpoint = '';
      if (status === 'diposting') endpoint = \`/jurnal/\${id}/posting\`;
      else if (status === 'dikoreksi') endpoint = \`/jurnal/\${id}/balik\`;
      
      if (endpoint) {
        const res = await fetchApi(endpoint, { method: 'POST' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.message || 'Gagal mengubah status jurnal');
        }
      } else {
        const res = await fetchApi(\`/jurnal/\${id}\`, {
          method: 'PUT',
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Gagal mengubah status jurnal');
      }
      
      // refetch to get updated data
      await get().fetch();
    } catch (err: any) {
      set({ error: err.message || 'Terjadi kesalahan', isLoading: false });
      throw err;
    }
  },`;

content = content.replace(/updateStatus:\s*async\s*\(id,\s*status\)\s*=>\s*\{[\s\S]*?catch\s*\(err:\s*any\)\s*\{\s*set\(\{ error: err\.message \|\| 'Terjadi kesalahan', isLoading: false \}\);\s*throw err;\s*\}\s*\},/, statusUpdate);

fs.writeFileSync('src/store/jurnalStore.ts', content);
console.log("jurnalStore.ts updatedStatus patched");
