const { spawn } = require('child_process');
const os = require('os');

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const lanIp = getLanIp();
const PORT = process.env.PORT || 3000;

console.log('');
console.log('  ╔══════════════════════════════════════════════════════╗');
console.log('  ║         DDBMS v1.1.4 — Development Server          ║');
console.log('  ╠══════════════════════════════════════════════════════╣');
console.log(`  ║  Local:    http://localhost:${PORT}                   ║`);
console.log(`  ║  Network:  http://${lanIp}:${PORT}              ║`);
console.log(`  ║  API:      http://${lanIp}:3001/api            ║`);
console.log('  ╠══════════════════════════════════════════════════════╣');
console.log('  ║  Access from any device on your Wi-Fi/LAN using     ║');
console.log('  ║  the Network URL above.                             ║');
console.log('  ╚══════════════════════════════════════════════════════╝');
console.log('');

// Bind to the actual LAN IP so Next.js displays the real address
const next = spawn('npx', ['next', 'dev', '-H', '0.0.0.0', '-p', String(PORT)], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
});

next.on('close', (code) => process.exit(code));
process.on('SIGINT', () => { next.kill('SIGINT'); process.exit(); });
process.on('SIGTERM', () => { next.kill('SIGTERM'); process.exit(); });
