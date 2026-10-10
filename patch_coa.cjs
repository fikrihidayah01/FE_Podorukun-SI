const fs = require('fs');
let content = fs.readFileSync('src/store/coaStore.ts', 'utf8');
content = content.replace("method: 'PUT',", "method: 'PATCH',");
fs.writeFileSync('src/store/coaStore.ts', content);
console.log("coaStore.ts PATCH updated");
