const fs = require('fs');
let content = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

const importReplacement = `import { useMemo, useEffect } from 'react';`;
content = content.replace(`import { useMemo } from 'react';`, importReplacement);

const hookInsertion = `function KeuanganDashboard() {
  const proyeks = useProyekStore((s) => s.items);
  const fetchProyeks = useProyekStore((s) => s.fetch);
  const jurnalItems = useJurnalStore((s) => s.items);
  const fetchJurnals = useJurnalStore((s) => s.fetch);
  const hutangSaldos = useHutangStore((s) => s.saldos);
  const fetchHutangs = useHutangStore((s) => s.fetchSaldo);
  const piutangItems = usePiutangStore((s) => s.items);
  const fetchPiutangs = usePiutangStore((s) => s.fetch);

  useEffect(() => {
    fetchProyeks();
    fetchJurnals();
    fetchHutangs();
    fetchPiutangs();
  }, [fetchProyeks, fetchJurnals, fetchHutangs, fetchPiutangs]);`;

content = content.replace(`function KeuanganDashboard() {
  const proyeks = useProyekStore((s) => s.items);
  const jurnalItems = useJurnalStore((s) => s.items);
  const hutangSaldos = useHutangStore((s) => s.saldos);
  const piutangItems = usePiutangStore((s) => s.items);`, hookInsertion);

fs.writeFileSync('src/pages/DashboardPage.tsx', content);
console.log("DashboardPage.tsx patched");
