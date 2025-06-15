#!/usr/bin/env node

/**
 * Development setup script for Logger application
 * Sets up environment and starts development server
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Logger development environment...');

// Check if .env exists
if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file from template...');
    try {
        fs.copyFileSync('.env.example', '.env');
        console.log('✅ .env file created. Please configure your settings.');
    } catch (error) {
        console.error('❌ Failed to create .env file:', error.message);
    }
}

// Start TypeScript compiler in watch mode
console.log('👀 Starting TypeScript compiler in watch mode...');
const tscWatch = spawn('npx', ['tsc', '--watch'], {
    stdio: 'pipe',
    shell: true
});

tscWatch.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Found 0 errors')) {
        console.log('✅ TypeScript compilation successful');
    } else if (output.includes('error TS')) {
        console.log('❌ TypeScript compilation error:', output);
    }
});

// Wait a moment for initial compilation
setTimeout(() => {
    console.log('🔄 Starting development server...');
    const server = spawn('node', ['dist/server.js'], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, NODE_ENV: 'development' }
    });

    server.on('close', (code) => {
        console.log(`🛑 Server exited with code ${code}`);
        tscWatch.kill();
    });
}, 3000);

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development environment...');
    tscWatch.kill();
    process.exit();
});
