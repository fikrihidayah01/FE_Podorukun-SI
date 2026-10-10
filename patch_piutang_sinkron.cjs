const fs = require('fs');
let content = fs.readFileSync('src/pages/keuangan/PiutangPage.tsx', 'utf8');

const importApi = `import { fetchApi } from '../../lib/api';\nimport { PiArrowsClockwise, PiMagnifyingGlass } from 'react-icons/pi';`;
content = content.replace("import { PiArrowsClockwise, PiMagnifyingGlass } from 'react-icons/pi';", importApi);

const sinkronUpdate = `  const handleSinkron = async () => {
    setSyncLoading(true);
    setApiError(false);
    try {
      const res = await fetchApi('/sinkron/jalankan', { method: 'POST' });
      if (!res.ok) throw new Error('Gagal sinkronisasi');
      
      await fetch();
      setSyncedAt(new Date());
    } catch {
      setApiError(true);
    } finally {
      setSyncLoading(false);
    }
  };`;

content = content.replace(/const handleSinkron = \(\) => \{[\s\S]*?\}, 800\);\s*\};/, sinkronUpdate);

fs.writeFileSync('src/pages/keuangan/PiutangPage.tsx', content);
console.log("PiutangPage.tsx sinkron patched");
