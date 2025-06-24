# SeedDream 3.0 FAL MCP Server

A Model Context Protocol (MCP) server that provides image generation capabilities using Bytedance's SeedDream 3.0 model via the FAL AI platform.

## Features

SeedDream 3.0 is a bilingual (Chinese and English) text-to-image model that excels at:

- **Native 2K high resolution output** with various aspect ratios
- **Exceptional text layout** for visually stunning results
- **Accurate small and large text generation**
- **Photorealistic portraits** with cinematic beauty
- **Fast generation** (3 seconds for 1K images)
- **Strong instruction following** and enhanced aesthetics

## Available Tools

### `generate_image`
Generate a single image or multiple images from a text prompt.

**Parameters:**
- `prompt` (required): Text description of the image to generate (supports English and Chinese)
- `aspect_ratio` (optional): Image aspect ratio - one of: `1:1`, `3:4`, `4:3`, `16:9`, `9:16`, `2:3`, `3:2`, `21:9` (default: `1:1`)
- `guidance_scale` (optional): Controls prompt adherence (1.0-20.0, default: 2.5)
- `num_images` (optional): Number of images to generate (1-4, default: 1)
- `seed` (optional): Random seed for reproducible results (0-2147483647)

### `generate_image_batch`
Generate multiple images with different prompts in a single request.

**Parameters:**
- `prompts` (required): Array of text prompts (1-5 prompts)
- `aspect_ratio` (optional): Aspect ratio for all images (default: `1:1`)
- `guidance_scale` (optional): Controls prompt adherence (1.0-20.0, default: 2.5)

## Installation

### Prerequisites

1. **FAL AI API Key**: Get your API key from [FAL AI](https://fal.ai/)
   - Sign up for an account at https://fal.ai/
   - Navigate to your dashboard and generate an API key
   - Keep this key secure as you'll need it for configuration

2. **Node.js**: Ensure you have Node.js installed (version 16 or higher)

### Quick Setup (Recommended)

The easiest way to use this server is through npx, which automatically downloads and runs the latest version:

#### For Claude Desktop App

Add the server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "seedream": {
      "command": "npx",
      "args": [
        "-y",
        "https://github.com/PierrunoYT/seedream-v3-fal-mcp-server.git"
      ],
      "env": {
        "FAL_KEY": "your-fal-api-key-here"
      }
    }
  }
}
```

#### For Kilo Code MCP Settings

Add to your MCP settings file at:
`C:\Users\[username]\AppData\Roaming\Code\User\globalStorage\kilocode.kilo-code\settings\mcp_settings.json`

```json
{
  "mcpServers": {
    "seedream": {
      "command": "npx",
      "args": [
        "-y",
        "https://github.com/PierrunoYT/seedream-v3-fal-mcp-server.git"
      ],
      "env": {
        "FAL_KEY": "your-fal-api-key-here"
      },
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

### Benefits of npx Configuration

✅ **Universal Access**: Works on any machine with Node.js
✅ **No Local Installation**: npx downloads and runs automatically
✅ **Always Latest Version**: Pulls from GitHub repository
✅ **Cross-Platform**: Windows, macOS, Linux compatible
✅ **Settings Sync**: Works everywhere you use your MCP client

### Manual Installation (Alternative)

If you prefer to install locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/PierrunoYT/seedream-v3-fal-mcp-server.git
   cd seedream-v3-fal-mcp-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the server**
   ```bash
   npm run build
   ```

4. **Use absolute path in configuration**
   ```json
   {
     "mcpServers": {
       "seedream": {
         "command": "node",
         "args": ["/absolute/path/to/seedream-v3-fal-mcp-server/build/index.js"],
         "env": {
           "FAL_KEY": "your-fal-api-key-here"
         }
       }
     }
   }
   ```

**Helper script to get the absolute path:**
```bash
npm run get-path
```

## Usage Examples

Once configured, you can use the server through your MCP client:

### Basic Image Generation
```
Generate an image of a serene mountain landscape at sunset with a lake reflection
```

### Specific Aspect Ratio
```
Create a portrait-oriented image of a futuristic cityscape (aspect ratio 9:16)
```

### Multiple Images
```
Generate 3 variations of a cute robot character
```

### Batch Generation
```
Generate images for these prompts: "a red rose", "a blue ocean", "a green forest"
```

### Chinese Language Support
```
生成一张中国传统山水画的图片
```

### High Guidance for Precise Results
```
Generate a photorealistic portrait of a person reading a book in a library (guidance scale: 7.5)
```

## API Response Format

The server returns detailed information about generated images:

```
Successfully generated 1 image(s) using SeedDream 3.0:

Prompt: "a serene mountain landscape at sunset"
Aspect Ratio: 1:1
Guidance Scale: 2.5
Seed Used: 1234567890

Generated Images:
Image 1 (1024x1024): https://v3.fal.media/files/...
```

## Development

### Local Testing
```bash
# Test the server directly
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node build/index.js
```

### Watch Mode
```bash
npm run watch
```

### Inspector Tool
```bash
npm run inspector
```

## Troubleshooting

### Common Issues

1. **"FAL_KEY environment variable is not set"**
   - The server will continue running and show this helpful error message
   - Ensure your FAL API key is properly set in the MCP configuration
   - Verify the key is valid and has sufficient credits
   - **Note**: The server no longer crashes when the API key is missing

2. **"Server not showing up in Claude"**
   - If using npx configuration, ensure you have Node.js installed
   - For manual installation, check that the absolute path is correct
   - Restart Claude Desktop after configuration changes
   - Verify the JSON configuration syntax is valid

3. **"Generation failed"**
   - Check your FAL AI account has sufficient credits
   - Verify your API key has the necessary permissions
   - Try with a simpler prompt to test connectivity

4. **"npx command not found"**
   - Ensure Node.js is properly installed
   - Try running `node --version` and `npm --version` to verify installation

### Server Stability Improvements

✅ **Robust Error Handling**: Server continues running even without API token
✅ **Graceful Shutdown**: Proper handling of SIGINT and SIGTERM signals
✅ **User-Friendly Messages**: Clear error messages with setup instructions
✅ **No More Crashes**: Eliminated `process.exit()` calls that caused connection drops

### Debug Logging

The server outputs debug information to stderr, which can help diagnose issues:
- Generation progress updates
- Error messages with helpful instructions
- API call details
- Graceful shutdown notifications

## Pricing

Image generation costs are determined by FAL AI's pricing structure. Check [FAL AI Pricing](https://fal.ai/pricing) for current rates.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues related to:
- **This MCP server**: Open an issue in this repository
- **FAL AI API**: Contact FAL AI support
- **SeedDream 3.0 model**: Refer to FAL AI documentation

## Changelog

### v0.1.1 (Latest)
- **🔧 Fixed connection drops**: Removed `process.exit()` calls that caused server crashes
- **🛡️ Improved error handling**: Server continues running even without API token
- **🌍 Added portability**: npx configuration works on any machine
- **📦 Enhanced stability**: Graceful shutdown handlers and null safety checks
- **💬 Better user experience**: Clear error messages with setup instructions
- **🔄 Auto-updating**: npx pulls latest version from GitHub automatically

### v0.1.0
- Initial release
- Support for single and batch image generation
- Bilingual prompt support (English/Chinese)
- Multiple aspect ratios
- Configurable generation parameters
