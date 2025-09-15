#!/usr/bin/env node

/**
 * Helper script to get the absolute path for MCP configuration
 * Run this script to get the exact path needed for your MCP config
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getAbsolutePath() {
  const buildPath = join(__dirname, 'build', 'index.js');
  
  console.log('🔍 SeedDream 4.0 FAL MCP Server Path Helper\n');
  
  if (!existsSync(buildPath)) {
    console.log('❌ Build file not found!');
    console.log('   Please run: npm run build\n');
    return;
  }
  
  console.log('✅ SeedDream 4.0 server build found!');
  console.log('📁 Absolute path for MCP configuration:\n');
  console.log(`   ${buildPath}\n`);
  
  console.log('📋 Copy this path and use it in your MCP configuration:');
  console.log('   Replace "/absolute/path/to/seedream-v4-fal-server/build/index.js"');
  console.log(`   With: "${buildPath}"\n`);
  
  // Show example config
  console.log('📄 Example MCP configuration:');
  console.log(JSON.stringify({
    mcpServers: {
      seedream4: {
        command: "node",
        args: [buildPath],
        env: {
          FAL_KEY: "your-fal-api-key-here"
        }
      }
    }
  }, null, 2));
  
  console.log('\n🚀 SeedDream 4.0 Features:');
  console.log('   • Advanced text-to-image generation');
  console.log('   • Flexible image sizing (1024-4096px)');
  console.log('   • Multi-image generation capabilities');
  console.log('   • Enhanced safety checking');
  console.log('   • Unified architecture for generation and editing');
}

getAbsolutePath();