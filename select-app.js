#!/usr/bin/env node

const readline = require('readline');
const { spawn } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Select an app to run in development mode:');
console.log('1) Geneva (default)');
console.log('2) Purr');
console.log('3) Paddock (chained-horse)');

rl.question('Enter your choice [1-3]: ', (choice) => {
  let app;
  
  switch (choice) {
    case '1':
      app = 'geneva';
      break;
    case '2':
      app = 'purr';
      break;
    case '3':
      app = 'chained-horse';
      break;
    default:
      app = 'geneva';
      break;
  }
  
  console.log(`Starting development server for ${app}...`);
  
  // Close the readline interface before spawning the process
  rl.close();
  
  // Use spawn instead of execSync to properly handle signals like Ctrl+C
  const child = spawn('./switch-app.sh', [app, 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  // Forward signals to the child process
  process.on('SIGINT', () => {
    console.log('Received SIGINT, forwarding to child process...');
    child.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, forwarding to child process...');
    child.kill('SIGTERM');
  });
  
  // Handle child process exit
  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`Process was killed by signal: ${signal}`);
      process.exit(0);
    } else {
      console.log(`Process exited with code: ${code}`);
      process.exit(code);
    }
  });
});