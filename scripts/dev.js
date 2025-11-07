#!/usr/bin/env node

const net = require('net');
const { spawn } = require('child_process');

const PORT = 3000;

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // Port is available
      });
      server.close();
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false); // Port is in use
      } else {
        reject(err);
      }
    });
  });
}

async function startDev() {
  console.log(`🔍 Checking if port ${PORT} is available...`);
  
  const isPortAvailable = await checkPort(PORT);
  
  if (!isPortAvailable) {
    console.error(`❌ Error: Port ${PORT} is already in use!`);
    console.error(`Please stop the process using port ${PORT} and try again.`);
    console.error(`\nTo find what's using port ${PORT}, run:`);
    console.error(`  Windows: netstat -ano | findstr :${PORT}`);
    console.error(`  Mac/Linux: lsof -ti:${PORT}`);
    process.exit(1);
  }
  
  console.log(`✅ Port ${PORT} is available. Starting Next.js...`);
  
  // Start Next.js development server
  const nextProcess = spawn('npx', ['next', 'dev', '-p', PORT.toString()], {
    stdio: 'inherit',
    shell: true
  });
  
  nextProcess.on('close', (code) => {
    process.exit(code);
  });
  
  nextProcess.on('error', (err) => {
    console.error('Failed to start Next.js:', err);
    process.exit(1);
  });
}

startDev().catch((err) => {
  console.error('Error starting development server:', err);
  process.exit(1);
});