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

### Setup

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd seedream-fal-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the server**
   ```bash
   npm run build
   ```

### Configuration

#### For Claude Desktop App

Add the server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "seedream": {
      "command": "node",
      "args": ["/absolute/path/to/seedream-fal-server/build/index.js"],
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
      "command": "node",
      "args": ["/absolute/path/to/seedream-fal-server/build/index.js"],
      "env": {
        "FAL_KEY": "your-fal-api-key-here"
      }
    }
  }
}
```

**Important**: Replace `/absolute/path/to/seedream-fal-server` with the actual absolute path to your seedream-fal-server directory.

#### Finding the Absolute Path

**Windows:**
1. Open the seedream-fal-server folder in File Explorer
2. Click on the address bar at the top
3. Copy the full path (e.g., `C:\Users\YourName\Projects\seedream-fal-server`)
4. Use forward slashes in the config: `C:/Users/YourName/Projects/seedream-fal-server/build/index.js`

**macOS/Linux:**
1. Open Terminal and navigate to the seedream-fal-server directory
2. Run: `pwd` to get the current directory path
3. The full path will be something like: `/Users/YourName/Projects/seedream-fal-server`
4. Use: `/Users/YourName/Projects/seedream-fal-server/build/index.js`

**Alternative method (any OS):**
1. Open the seedream-fal-server folder in VS Code
2. Right-click on the `build/index.js` file
3. Select "Copy Path" or "Copy Absolute Path"
4. Use this path in your configuration

**Easiest method - Use the helper script:**
```bash
npm run get-path
```
This will automatically display the correct absolute path and show you an example configuration with the path already filled in.

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

1. **"FAL_KEY environment variable is required"**
   - Ensure your FAL API key is properly set in the MCP configuration
   - Verify the key is valid and has sufficient credits

2. **"Server not showing up in Claude"**
   - Check that the absolute path in the configuration is correct
   - Restart Claude Desktop after configuration changes
   - Verify the JSON configuration syntax is valid

3. **"Generation failed"**
   - Check your FAL AI account has sufficient credits
   - Verify your API key has the necessary permissions
   - Try with a simpler prompt to test connectivity

### Debug Logging

The server outputs debug information to stderr, which can help diagnose issues:
- Generation progress updates
- Error messages
- API call details

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

### v0.1.0
- Initial release
- Support for single and batch image generation
- Bilingual prompt support (English/Chinese)
- Multiple aspect ratios
- Configurable generation parameters
