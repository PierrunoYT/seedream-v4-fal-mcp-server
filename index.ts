#!/usr/bin/env node

/**
 * SeedDream 4.0 FAL MCP Server
 * 
 * This MCP server provides image generation capabilities using Bytedance's SeedDream 4.0 model
 * via the FAL AI platform. SeedDream 4.0 is a new-generation image creation model that 
 * integrates image generation and image editing capabilities into a single, unified architecture.
 * 
 * Key Features:
 * - Advanced text-to-image generation with improved quality
 * - Flexible image sizing (1024x1024 to 4096x4096)
 * - Multi-image generation capabilities
 * - Enhanced safety checking
 * - Unified architecture for generation and editing
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { fal } from "@fal-ai/client";
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

// Get FAL API key from environment variable
const FAL_KEY = process.env.FAL_KEY;
let falClient: typeof fal | null = null;

if (!FAL_KEY) {
  console.error("Error: FAL_KEY environment variable is required");
  console.error("Please set your FAL API key: export FAL_KEY=your_fal_key_here");
  // Server continues running, no process.exit()
} else {
  // Configure FAL client
  fal.config({
    credentials: FAL_KEY
  });
  falClient = fal;
}

// Valid image size presets for SeedDream 4.0
const VALID_IMAGE_SIZES = {
  "square_1024": { width: 1024, height: 1024 },
  "square_1280": { width: 1280, height: 1280 },
  "square_1536": { width: 1536, height: 1536 },
  "portrait_1024": { width: 1024, height: 1280 },
  "portrait_1280": { width: 1280, height: 1600 },
  "landscape_1024": { width: 1280, height: 1024 },
  "landscape_1280": { width: 1600, height: 1280 },
  "wide_1024": { width: 1536, height: 1024 },
  "tall_1024": { width: 1024, height: 1536 }
} as const;

type ImageSizePreset = keyof typeof VALID_IMAGE_SIZES;

/**
 * Interface for SeedDream 4.0 generation parameters
 */
interface SeedDream4Params {
  prompt: string;
  image_size?: { width: number; height: number } | ImageSizePreset;
  num_images?: number;
  max_images?: number;
  seed?: number;
  sync_mode?: boolean;
  enable_safety_checker?: boolean;
}

/**
 * Interface for SeedDream 4.0 API response
 */
interface SeedDream4Response {
  images: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
  seed: number;
}

/**
 * Download an image from a URL and save it locally
 */
async function downloadImage(url: string, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    // Create images directory if it doesn't exist
    const imagesDir = path.join(process.cwd(), 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    
    const filePath = path.join(imagesDir, filename);
    const file = fs.createWriteStream(filePath);
    
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filePath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Generate a unique filename for an image
 */
function generateImageFilename(prompt: string, index: number, seed: number): string {
  // Create a safe filename from the prompt
  const safePrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `seedream4_${safePrompt}_${seed}_${index}_${timestamp}.png`;
}

/**
 * Resolve image size parameter to width/height object
 */
function resolveImageSize(imageSize?: { width: number; height: number } | ImageSizePreset): { width: number; height: number } {
  if (!imageSize) {
    return { width: 1280, height: 1280 }; // Default size
  }
  
  if (typeof imageSize === 'string') {
    const preset = VALID_IMAGE_SIZES[imageSize];
    if (!preset) {
      throw new Error(`Invalid image size preset: ${imageSize}. Valid presets: ${Object.keys(VALID_IMAGE_SIZES).join(', ')}`);
    }
    return preset;
  }
  
  // Validate custom dimensions
  if (imageSize.width < 1024 || imageSize.width > 4096 || imageSize.height < 1024 || imageSize.height > 4096) {
    throw new Error("Image dimensions must be between 1024 and 4096 pixels");
  }
  
  return imageSize;
}

/**
 * Create an MCP server with image generation capabilities
 */
const server = new Server(
  {
    name: "seedream-v4-fal-server",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler that lists available tools for image generation
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_image",
        description: "Generate images using Bytedance's SeedDream 4.0 model. A new-generation image creation model that integrates image generation and image editing capabilities into a single, unified architecture.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The text prompt used to generate the image. Be descriptive for best results."
            },
            image_size: {
              oneOf: [
                {
                  type: "string",
                  enum: Object.keys(VALID_IMAGE_SIZES),
                  description: "Preset image size"
                },
                {
                  type: "object",
                  properties: {
                    width: {
                      type: "integer",
                      minimum: 1024,
                      maximum: 4096,
                      description: "Image width in pixels"
                    },
                    height: {
                      type: "integer",
                      minimum: 1024,
                      maximum: 4096,
                      description: "Image height in pixels"
                    }
                  },
                  required: ["width", "height"],
                  description: "Custom image dimensions"
                }
              ],
              description: "The size of the generated image. Can be a preset or custom dimensions (1024-4096px)",
              default: "square_1280"
            },
            num_images: {
              type: "integer",
              description: "Number of separate model generations to be run with the prompt",
              minimum: 1,
              maximum: 6,
              default: 1
            },
            max_images: {
              type: "integer",
              description: "Maximum images per generation. Total images will be between num_images and max_images*num_images",
              minimum: 1,
              maximum: 6,
              default: 1
            },
            seed: {
              type: "integer",
              description: "Random seed to control the stochasticity of image generation. Use the same seed for reproducible results."
            },
            sync_mode: {
              type: "boolean",
              description: "If true, waits for image generation and upload before returning response (higher latency but direct access)",
              default: false
            },
            enable_safety_checker: {
              type: "boolean",
              description: "Enable safety checker to filter inappropriate content",
              default: true
            }
          },
          required: ["prompt"]
        }
      },
      {
        name: "generate_image_batch",
        description: "Generate multiple images with different prompts in a single request using SeedDream 4.0.",
        inputSchema: {
          type: "object",
          properties: {
            prompts: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Array of text prompts to generate images for",
              minItems: 1,
              maxItems: 5
            },
            image_size: {
              oneOf: [
                {
                  type: "string",
                  enum: Object.keys(VALID_IMAGE_SIZES),
                  description: "Preset image size"
                },
                {
                  type: "object",
                  properties: {
                    width: {
                      type: "integer",
                      minimum: 1024,
                      maximum: 4096
                    },
                    height: {
                      type: "integer",
                      minimum: 1024,
                      maximum: 4096
                    }
                  },
                  required: ["width", "height"]
                }
              ],
              description: "The size for all generated images",
              default: "square_1280"
            },
            enable_safety_checker: {
              type: "boolean",
              description: "Enable safety checker for all generations",
              default: true
            }
          },
          required: ["prompts"]
        }
      }
    ]
  };
});

/**
 * Handler for tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "generate_image": {
      try {
        if (!falClient) {
          return {
            content: [{
              type: "text",
              text: "Error: FAL_KEY environment variable is not set. Please configure your FAL API key."
            }],
            isError: true
          };
        }

        const params = (request.params.arguments || {}) as unknown as SeedDream4Params;
        
        if (!params.prompt || typeof params.prompt !== 'string') {
          throw new Error("Prompt is required and must be a string");
        }

        // Resolve image size
        const imageSize = resolveImageSize(params.image_size);

        // Prepare the request payload
        const payload: any = {
          prompt: params.prompt,
          image_size: imageSize,
          num_images: params.num_images || 1,
          max_images: params.max_images || 1,
          sync_mode: params.sync_mode || false,
          enable_safety_checker: params.enable_safety_checker !== false
        };

        if (params.seed !== undefined) {
          payload.seed = params.seed;
        }

        console.error(`Generating image with SeedDream 4.0: "${params.prompt}"`);
        
        // Call the SeedDream 4.0 API
        const result = await falClient.subscribe("fal-ai/bytedance/seedream/v4/text-to-image", {
          input: payload,
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              update.logs?.map((log) => log.message).forEach(msg => console.error(`[SeedDream 4.0] ${msg}`));
            }
          },
        }) as { data: SeedDream4Response };

        const response = result.data;
        
        if (!response.images || response.images.length === 0) {
          throw new Error("No images were generated");
        }

        // Download images locally
        console.error("Downloading images locally...");
        const downloadedImages: Array<{ url: string; localPath: string; dimensions?: string }> = [];
        
        for (let i = 0; i < response.images.length; i++) {
          const img = response.images[i];
          const filename = generateImageFilename(params.prompt, i + 1, response.seed);
          
          try {
            const localPath = await downloadImage(img.url, filename);
            const dimensions = img.width && img.height ? ` (${img.width}x${img.height})` : ` (${imageSize.width}x${imageSize.height})`;
            downloadedImages.push({
              url: img.url,
              localPath,
              dimensions
            });
            console.error(`Downloaded: ${filename}`);
          } catch (downloadError) {
            console.error(`Failed to download image ${i + 1}:`, downloadError);
            // Still include the original URL if download fails
            downloadedImages.push({
              url: img.url,
              localPath: `Failed to download: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`,
              dimensions: img.width && img.height ? ` (${img.width}x${img.height})` : ` (${imageSize.width}x${imageSize.height})`
            });
          }
        }

        // Format the response with local paths
        const imageDescriptions = downloadedImages.map((img, index) => {
          return `Image ${index + 1}${img.dimensions}:
  Local Path: ${img.localPath}
  Original URL: ${img.url}`;
        }).join('\n\n');

        return {
          content: [
            {
              type: "text",
              text: `Successfully generated ${response.images.length} image(s) using SeedDream 4.0:

Prompt: "${params.prompt}"
Image Size: ${imageSize.width}x${imageSize.height}
Number of Images: ${payload.num_images}
Max Images per Generation: ${payload.max_images}
Safety Checker: ${payload.enable_safety_checker ? 'Enabled' : 'Disabled'}
Seed Used: ${response.seed}

Generated Images:
${imageDescriptions}

Images have been downloaded to the local 'images' directory. You can find them at the local paths listed above.`
            }
          ]
        };

      } catch (error) {
        console.error("Error generating image:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error generating image: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
            }
          ],
          isError: true
        };
      }
    }

    case "generate_image_batch": {
      try {
        if (!falClient) {
          return {
            content: [{
              type: "text",
              text: "Error: FAL_KEY environment variable is not set. Please configure your FAL API key."
            }],
            isError: true
          };
        }

        const { prompts, image_size, enable_safety_checker = true } = request.params.arguments as {
          prompts: string[];
          image_size?: { width: number; height: number } | ImageSizePreset;
          enable_safety_checker?: boolean;
        };

        if (!Array.isArray(prompts) || prompts.length === 0) {
          throw new Error("Prompts array is required and must not be empty");
        }

        if (prompts.length > 5) {
          throw new Error("Maximum 5 prompts allowed per batch request");
        }

        // Resolve image size
        const imageSize = resolveImageSize(image_size);

        console.error(`Generating batch of ${prompts.length} images with SeedDream 4.0`);

        // Generate images for each prompt
        const results = await Promise.allSettled(
          prompts.map(async (prompt, index) => {
            console.error(`Generating image ${index + 1}/${prompts.length}: "${prompt}"`);
            
            const result = await falClient.subscribe("fal-ai/bytedance/seedream/v4/text-to-image", {
              input: {
                prompt,
                image_size: imageSize,
                num_images: 1,
                max_images: 1,
                enable_safety_checker
              },
              logs: false
            }) as { data: SeedDream4Response };

            return {
              prompt,
              ...result.data
            };
          })
        );

        // Process results
        const successful: Array<{ prompt: string; images: any[]; seed: number }> = [];
        const failed: Array<{ prompt: string; error: string }> = [];

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successful.push(result.value);
          } else {
            failed.push({
              prompt: prompts[index],
              error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
            });
          }
        });

        // Format response
        let responseText = `Batch image generation completed using SeedDream 4.0:

Settings:
- Image Size: ${imageSize.width}x${imageSize.height}
- Safety Checker: ${enable_safety_checker ? 'Enabled' : 'Disabled'}
- Total Prompts: ${prompts.length}
- Successful: ${successful.length}
- Failed: ${failed.length}

`;

        if (successful.length > 0) {
          responseText += "Successfully Generated Images:\n";
          
          // Download all images from successful generations
          for (let i = 0; i < successful.length; i++) {
            const item = successful[i];
            responseText += `\n${i + 1}. Prompt: "${item.prompt}"\n`;
            responseText += `   Seed: ${item.seed}\n`;
            
            for (let imgIndex = 0; imgIndex < item.images.length; imgIndex++) {
              const img = item.images[imgIndex];
              const filename = generateImageFilename(item.prompt, imgIndex + 1, item.seed);
              
              try {
                const localPath = await downloadImage(img.url, filename);
                responseText += `   Image ${imgIndex + 1}:\n`;
                responseText += `     Local Path: ${localPath}\n`;
                responseText += `     Original URL: ${img.url}\n`;
                console.error(`Downloaded batch image: ${filename}`);
              } catch (downloadError) {
                responseText += `   Image ${imgIndex + 1}:\n`;
                responseText += `     Download Failed: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}\n`;
                responseText += `     Original URL: ${img.url}\n`;
                console.error(`Failed to download batch image ${imgIndex + 1}:`, downloadError);
              }
            }
          }
        }

        if (failed.length > 0) {
          responseText += "\nFailed Generations:\n";
          failed.forEach((item, index) => {
            responseText += `\n${index + 1}. Prompt: "${item.prompt}"\n`;
            responseText += `   Error: ${item.error}\n`;
          });
        }

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };

      } catch (error) {
        console.error("Error in batch generation:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error in batch generation: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
            }
          ],
          isError: true
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

/**
 * Start the server using stdio transport
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SeedDream 4.0 FAL MCP server running on stdio");
}

// Graceful shutdown handlers
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
