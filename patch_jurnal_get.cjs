const fs = require('fs');
let content = fs.readFileSync('src/store/jurnalStore.ts', 'utf8');
content = content.replace('create<JurnalState>((set) => ({', 'create<JurnalState>((set, get) => ({');
fs.writeFileSync('src/store/jurnalStore.ts', content);
console.log("jurnalStore.ts get added");
