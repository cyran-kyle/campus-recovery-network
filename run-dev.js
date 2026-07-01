const { spawn } = require('child_process');
const path = require('path');

function runService(name, command, args, cwd, colorCode) {
  const color = `\x1b[${colorCode}m`;
  const reset = '\x1b[0m';
  console.log(`${color}[${name}] Starting: ${command} ${args.join(' ')}${reset}`);

  // On Windows, npm is actually npm.cmd / npm.ps1, shell: true handles this.
  const child = spawn(command, args, {
    cwd: cwd,
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe']
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${color}[${name}]${reset} ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.error(`${color}[${name}] [ERROR]${reset} ${line}`);
      }
    });
  });

  child.on('close', (code) => {
    console.log(`${color}[${name}] Process exited with code ${code}${reset}`);
    process.exit(code || 0);
  });

  return child;
}

const backendPath = path.join(__dirname, 'backend');
const frontendPath = path.join(__dirname, 'frontend');

const backend = runService('BACKEND', 'npm', ['run', 'start:dev'], backendPath, '36'); // Cyan
const frontend = runService('FRONTEND', 'npm', ['run', 'dev'], frontendPath, '32'); // Green

// Clean up child processes when the main process is terminated
const cleanup = () => {
  console.log('\nStopping servers...');
  try {
    backend.kill();
  } catch (e) {}
  try {
    frontend.kill();
  } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
