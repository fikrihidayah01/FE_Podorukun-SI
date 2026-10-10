const fs = require('fs');
let content = fs.readFileSync('src/store/jurnalStore.ts', 'utf8');

const addUpdate = `  add: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { lampiran, ...jurnalData } = data;
      const res = await fetchApi('/jurnal', {
        method: 'POST',
        body: JSON.stringify(jurnalData),
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j.message || 'Gagal menyimpan jurnal');
      }
      
      const resData = await res.json();
      const newItem = resData.data || resData;

      if (lampiran && lampiran.length > 0) {
        for (const l of lampiran) {
          if (l.dataUrl) {
            const blobRes = await fetch(l.dataUrl);
            const blob = await blobRes.blob();
            const formData = new FormData();
            formData.append('file', blob, l.nama);
            
            await fetchApi(\`/lampiran?entityType=jurnal&entityId=\${newItem.id}\`, {
              method: 'POST',
              body: formData,
            });
          }
        }
      }

      await get().fetch();
    } catch (err: any) {
      set({ error: err.message || 'Terjadi kesalahan', isLoading: false });
      throw err;
    }
  },`;

content = content.replace(/add:\s*async\s*\(data\)\s*=>\s*\{[\s\S]*?catch\s*\(err:\s*any\)\s*\{\s*set\(\{ error: err\.message \|\| 'Terjadi kesalahan', isLoading: false \}\);\s*throw err;\s*\}\s*\},/, addUpdate);

fs.writeFileSync('src/store/jurnalStore.ts', content);
console.log("jurnalStore.ts add patched");
