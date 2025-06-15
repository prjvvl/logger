#!/usr/bin/env node

/**
 * Build script for Logger application
 * Compiles TypeScript and prepares distribution
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

console.log('🔧 Building Logger application...');

try {
    // Clean dist directory
    console.log('🧹 Cleaning dist directory...');
    fs.removeSync('dist');
    
    // Compile TypeScript
    console.log('📦 Compiling TypeScript...');
    execSync('npx tsc', { stdio: 'inherit' });
      // Copy public files
    console.log('📋 Copying public files...');
    fs.copySync('public', 'dist/public');
    
    // Copy environment example
    console.log('⚙️ Copying environment template...');
    if (fs.existsSync('.env.example')) {
        fs.copySync('.env.example', 'dist/.env.example');
    }
    
    // Copy package.json for production
    const packageJson = fs.readJsonSync('package.json');
    const prodPackageJson = {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        main: packageJson.main,
        scripts: {
            start: 'node server.js'
        },
        dependencies: packageJson.dependencies
    };
    fs.writeJsonSync('dist/package.json', prodPackageJson, { spaces: 2 });
    
    console.log('✅ Build completed successfully!');
    console.log('📁 Distribution files are in ./dist/');
    
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
