const fs = require('fs');
let content = fs.readFileSync('src/store/coaStore.ts', 'utf8');

const fetchRiwayatUpdate = `  fetchRiwayat: async (id: string) => {
    try {
      const res = await fetchApi(\`/akun/\${id}/riwayat\`);
      if (res.ok) {
        const json = await res.json();
        set({ riwayat: json.data || json });
      }
    } catch {
      set({ riwayat: [] });
    }
  },`;

content = content.replace(/fetchRiwayat:\s*async\s*\(_id:\s*string\)\s*=>\s*\{[\s\S]*?set\(\{ riwayat: \[\] \}\);\s*\},/, fetchRiwayatUpdate);

fs.writeFileSync('src/store/coaStore.ts', content);
console.log("coaStore.ts fetchRiwayat patched");
