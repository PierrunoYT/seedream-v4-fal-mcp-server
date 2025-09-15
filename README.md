# SeedDream 4.0 FAL MCP Server

A Model Context Protocol (MCP) server that provides image generation capabilities using Bytedance's SeedDream 4.0 model via the FAL AI platform.

## Features

SeedDream 4.0 is a new-generation image creation model that integrates image generation and image editing capabilities into a single, unified architecture:

- **Advanced Text-to-Image Generation** with improved quality and detail
- **Flexible Image Sizing** from 1024x1024 to 4096x4096 pixels
- **Multi-Image Generation** with configurable batch sizes
- **Enhanced Safety Checking** to filter inappropriate content
- **Unified Architecture** combining generation and editing capabilities
- **High-Quality Output** with superior detail and coherence
- **Fast Generation** with optimized processing

## Available Tools

### `generate_image`
Generate single or multiple images from a text prompt using SeedDream 4.0.

**Parameters:**
- `prompt` (required): Text description of the image to generate
- `image_size` (optional): Image dimensions - can be:
  - **Presets**: `square_1024`, `square_1280`, `square_1536`, `portrait_1024`, `portrait_1280`, `landscape_1024`, `landscape_1280`, `wide_1024`, `tall_1024`
  - **Custom**: `{width: number, height: number}` (1024-4096px range)
  - Default: `square_1280` (1280x1280)
- `num_images` (optional): Number of separate generations (1-6, default: 1)
- `max_images` (optional): Maximum images per generation (1-6, default: 1)
- `seed` (optional): Random seed for reproducible results
- `sync_mode` (optional): Wait for upload before response (default: false)
- `enable_safety_checker` (optional): Enable content filtering (default: true)

### `generate_image_batch`
Generate multiple images with different prompts in a single request.

**Parameters:**
- `prompts` (required): Array of text prompts (1-5 prompts)
- `image_size` (optional): Size for all images (preset or custom, default: `square_1280`)
- `enable_safety_checker` (optional): Enable safety checking (default: true)

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
    "seedream4": {
      "command": "npx",
      "args": [
        "-y",
        "https://github.com/PierrunoYT/seedream-v4-fal-mcp-server.git"
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
    "seedream4": {
      "command": "npx",
      "args": [
        "-y",
        "https://github.com/PierrunoYT/seedream-v4-fal-mcp-server.git"
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
   git clone https://github.com/PierrunoYT/seedream-v4-fal-mcp-server.git
   cd seedream-v4-fal-mcp-server
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
       "seedream4": {
         "command": "node",
         "args": ["/absolute/path/to/seedream-v4-fal-mcp-server/build/index.js"],
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
Generate an image of a futuristic cityscape at sunset with flying cars
```

### Custom Image Size
```
Create a wide landscape image (1600x1280) of a serene mountain lake
```

### Multiple Images
```
Generate 3 variations of a cute robot character (num_images: 3)
```

### High-Resolution Generation
```
Create a detailed portrait in 1536x1536 resolution of a wise old wizard
```

### Batch Generation
```
Generate images for these prompts: "a red rose in morning dew", "a blue ocean wave", "a green forest path"
```

### With Custom Parameters
```
Generate a square image (1280x1280) of a magical forest with safety checker enabled and seed 12345
```

### Sync Mode for Immediate Access
```
Create an image of a space station with sync_mode enabled for immediate download
```

## Image Size Presets

SeedDream 4.0 supports the following preset sizes:

- **Square Formats**:
  - `square_1024`: 1024x1024
  - `square_1280`: 1280x1280 (default)
  - `square_1536`: 1536x1536

- **Portrait Formats**:
  - `portrait_1024`: 1024x1280
  - `portrait_1280`: 1280x1600

- **Landscape Formats**:
  - `landscape_1024`: 1280x1024
  - `landscape_1280`: 1600x1280

- **Special Formats**:
  - `wide_1024`: 1536x1024
  - `tall_1024`: 1024x1536

You can also specify custom dimensions with `{width: number, height: number}` where both values are between 1024 and 4096 pixels.

## API Response Format

The server returns detailed information about generated images:

```
Successfully generated 1 image(s) using SeedDream 4.0:

Prompt: "a futuristic cityscape at sunset"
Image Size: 1280x1280
Number of Images: 1
Max Images per Generation: 1
Safety Checker: Enabled
Seed Used: 1234567890

Generated Images:
Image 1 (1280x1280):
  Local Path: ./images/seedream4_futuristic_cityscape_1234567890_1_2024-01-01T12-00-00-000Z.png
  Original URL: https://storage.googleapis.com/falserverless/...
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
   - Ensure image dimensions are within the 1024-4096 range

4. **"Invalid image size"**
   - Use valid presets or ensure custom dimensions are between 1024-4096
   - Check that width and height are both specified for custom sizes

5. **"npx command not found"**
   - Ensure Node.js is properly installed
   - Try running `node --version` and `npm --version` to verify installation

### Server Stability Improvements

✅ **Robust Error Handling**: Server continues running even without API token
✅ **Graceful Shutdown**: Proper handling of SIGINT and SIGTERM signals
✅ **User-Friendly Messages**: Clear error messages with setup instructions
✅ **No More Crashes**: Eliminated `process.exit()` calls that caused connection drops
✅ **Enhanced Validation**: Comprehensive input validation for all parameters

### Debug Logging

The server outputs debug information to stderr, which can help diagnose issues:
- Generation progress updates
- Error messages with helpful instructions
- API call details
- Image download status
- Graceful shutdown notifications

## What's New in SeedDream 4.0

### Improvements over SeedDream 3.0

- **Unified Architecture**: Combines generation and editing in one model
- **Enhanced Quality**: Improved image detail and coherence
- **Flexible Sizing**: Support for custom dimensions up to 4096px
- **Multi-Image Generation**: Better control over batch generation
- **Advanced Safety**: Enhanced content filtering capabilities
- **Better Performance**: Optimized generation pipeline

### Migration from SeedDream 3.0

If you're upgrading from SeedDream 3.0:

1. **API Endpoint**: Now uses `fal-ai/bytedance/seedream/v4/text-to-image`
2. **Aspect Ratios**: Replaced with flexible `image_size` parameter
3. **New Parameters**: Added `max_images`, `sync_mode`, `enable_safety_checker`
4. **Size Limits**: Expanded from 2K to 4K maximum resolution
5. **Presets**: New convenient size presets for common use cases

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
- **SeedDream 4.0 model**: Refer to FAL AI documentation

## Changelog

### v0.2.0 (Latest - SeedDream 4.0)
- **🚀 Upgraded to SeedDream 4.0**: New unified architecture for generation and editing
- **📐 Flexible Image Sizing**: Support for custom dimensions up to 4096x4096
- **🎯 Enhanced Presets**: 9 convenient size presets for common use cases
- **🔒 Advanced Safety**: Improved content filtering with configurable safety checker
- **⚡ Multi-Image Generation**: Better control with `num_images` and `max_images`
- **🔄 Sync Mode**: Option for immediate image access without CDN delays
- **🛡️ Enhanced Validation**: Comprehensive input validation for all parameters
- **📊 Better Responses**: More detailed generation information and status

### v0.1.1 (SeedDream 3.0)
- **🔧 Fixed connection drops**: Removed `process.exit()` calls that caused server crashes
- **🛡️ Improved error handling**: Server continues running even without API token
- **🌍 Added portability**: npx configuration works on any machine
- **📦 Enhanced stability**: Graceful shutdown handlers and null safety checks
- **💬 Better user experience**: Clear error messages with setup instructions
- **🔄 Auto-updating**: npx pulls latest version from GitHub automatically

### v0.1.0 (SeedDream 3.0)
- Initial release with SeedDream 3.0
- Support for single and batch image generation
- Bilingual prompt support (English/Chinese)
- Multiple aspect ratios
- Configurable generation parameters
