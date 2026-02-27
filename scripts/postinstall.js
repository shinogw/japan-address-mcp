#!/usr/bin/env node

/**
 * postinstall script
 * npm install後に郵便番号データのダウンロードを促す
 */

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                     japan-address-mcp                            ║
╠══════════════════════════════════════════════════════════════════╣
║  郵便番号データをダウンロードしてください:                       ║
║                                                                  ║
║    npx ts-node node_modules/japan-address-mcp/scripts/download-postal-data.ts
║                                                                  ║
║  または:                                                         ║
║                                                                  ║
║    cd node_modules/japan-address-mcp && npx ts-node scripts/download-postal-data.ts
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`);
