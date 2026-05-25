const os = require('os');
const { spawn } = require('child_process');

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
const PORT = process.env.PORT || 3001;

console.log('');
console.log('  ╔══════════════════════════════════════════════════════╗');
console.log('  ║         DDBMS v1.1.4 — Backend API Server           ║');
console.log('  ╠══════════════════════════════════════════════════════╣');
console.log(`  ║  Local:    http://localhost:${PORT}/api               ║`);
console.log(`  ║  Network:  http://${lanIp}:${PORT}/api          ║`);
console.log('  ╚══════════════════════════════════════════════════════╝');
console.log('');

const nest = spawn('npx', ['nest', 'start', '--watch'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
  env: { ...process.env, HOST: '0.0.0.0', PORT: String(PORT) },
});

nest.on('close', (code) => process.exit(code));
process.on('SIGINT', () => { nest.kill('SIGINT'); process.exit(); });
process.on('SIGTERM', () => { nest.kill('SIGTERM'); process.exit(); });
