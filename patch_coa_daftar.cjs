const fs = require('fs');
let content = fs.readFileSync('src/pages/keuangan/CoaTabDaftar.tsx', 'utf8');

const hookInsertion = `  const { items, riwayat, add, update, remove, isLoading, error, fetchRiwayat } = useCoaStore();
  
  useEffect(() => {
    if (riwayatId) {
      fetchRiwayat(riwayatId);
    }
  }, [riwayatId, fetchRiwayat]);`;

content = content.replace("  const { items, riwayat, add, update, remove, isLoading, error } = useCoaStore();", hookInsertion);

fs.writeFileSync('src/pages/keuangan/CoaTabDaftar.tsx', content);
console.log("CoaTabDaftar.tsx patched");
