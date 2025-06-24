#!/usr/bin/env node

/**
 * Simple test script for the SeedDream 3.0 MCP Server
 * This script helps verify that the server is working correctly
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test messages to send to the server
const testMessages = [
  // List available tools
  {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list"
  },
  // Test image generation (commented out to avoid API calls during testing)
  /*
  {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "generate_image",
      arguments: {
        prompt: "a cute robot in a garden",
        aspect_ratio: "1:1",
        num_images: 1
      }
    }
  }
  */
];

async function testServer() {
  console.log('Testing SeedDream 3.0 MCP Server...\n');

  // Check if build exists
  const serverPath = join(__dirname, 'build', 'index.js');
  
  try {
    // Start the server process
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        FAL_KEY: process.env.FAL_KEY || 'test-key-for-listing-tools'
      }
    });

    let responseCount = 0;
    let responses = [];

    // Handle server output
    server.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        try {
          const response = JSON.parse(line);
          responses.push(response);
          responseCount++;
          
          console.log(`Response ${responseCount}:`);
          console.log(JSON.stringify(response, null, 2));
          console.log('---\n');
          
          // If we've received all expected responses, close the server
          if (responseCount >= testMessages.length) {
            server.kill();
          }
        } catch (e) {
          // Ignore non-JSON output
        }
      });
    });

    // Handle server errors
    server.stderr.on('data', (data) => {
      const message = data.toString();
      if (message.includes('running on stdio')) {
        console.log('✅ Server started successfully\n');
        
        // Send test messages
        testMessages.forEach((message, index) => {
          console.log(`Sending test message ${index + 1}:`);
          console.log(JSON.stringify(message, null, 2));
          console.log('');
          
          server.stdin.write(JSON.stringify(message) + '\n');
        });
      } else if (!message.includes('SeedDream')) {
        console.error('Server stderr:', message);
      }
    });

    // Handle server exit
    server.on('close', (code) => {
      console.log(`\nServer exited with code ${code}`);
      
      if (responses.length > 0) {
        console.log('\n✅ Test completed successfully!');
        console.log(`Received ${responses.length} response(s) from the server.`);
        
        // Check if tools are listed correctly
        const toolsResponse = responses.find(r => r.result && r.result.tools);
        if (toolsResponse) {
          const tools = toolsResponse.result.tools;
          console.log(`\n📋 Available tools: ${tools.map(t => t.name).join(', ')}`);
        }
      } else {
        console.log('\n❌ No responses received from server');
      }
    });

    // Handle server startup errors
    server.on('error', (error) => {
      console.error('❌ Failed to start server:', error.message);
      
      if (error.code === 'ENOENT') {
        console.log('\n💡 Make sure to build the server first:');
        console.log('   npm run build');
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!server.killed) {
        console.log('\n⏰ Test timeout - killing server');
        server.kill();
      }
    }, 10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testServer().catch(console.error);