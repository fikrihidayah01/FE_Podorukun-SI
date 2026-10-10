const fs = require('fs');
let content = fs.readFileSync('src/lib/api.ts', 'utf8');

content = content.replace(
  "export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';",
  "export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\\/$/, '');"
);

content = content.replace(
  "const url = `${API_BASE_URL}${endpoint}`;",
  "const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;\n  const url = `${API_BASE_URL}${cleanEndpoint}`;"
);

fs.writeFileSync('src/lib/api.ts', content);
console.log("api.ts URL generation patched");
