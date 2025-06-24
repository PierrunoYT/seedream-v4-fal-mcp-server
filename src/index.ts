#!/usr/bin/env node

/**
 * SeedDream 3.0 MCP Server
 * 
 * This MCP server provides image generation capabilities using Bytedance's SeedDream 3.0 model
 * via the FAL AI platform. SeedDream 3.0 is a bilingual (Chinese and English) text-to-image 
 * model that excels at:
 * 
 * - Native 2K high resolution output with various aspect ratios
 * - Exceptional text layout for visually stunning results
 * - Accurate small and large text generation
 * - Photorealistic portraits with cinematic beauty
 * - Fast generation (3 seconds for 1K images)
 * - Strong instruction following and enhanced aesthetics
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { fal } from "@fal-ai/client";

// Get FAL API key from environment variable
const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error("Error: FAL_KEY environment variable is required");
  process.exit(1);
}

// Configure FAL client
fal.config({
  credentials: FAL_KEY
});

// Valid aspect ratios for SeedDream 3.0
const VALID_ASPECT_RATIOS = [
  "1:1", "3:4", "4:3", "16:9", "9:16", "2:3", "3:2", "21:9"
] as const;

type AspectRatio = typeof VALID_ASPECT_RATIOS[number];

/**
 * Interface for SeedDream 3.0 generation parameters
 */
interface SeedDreamParams {
  prompt: string;
  aspect_ratio?: AspectRatio;
  guidance_scale?: number;
  num_images?: number;
  seed?: number;
}

/**
 * Interface for SeedDream 3.0 API response
 */
interface SeedDreamResponse {
  images: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
  seed: number;
}

/**
 * Create an MCP server with image generation capabilities
 */
const server = new Server(
  {
    name: "seedream-server",
    version: "0.1.0",
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
        description: "Generate images using Bytedance's SeedDream 3.0 model. Supports bilingual prompts (Chinese and English), high-resolution output, and various aspect ratios.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The text prompt used to generate the image. Supports both English and Chinese. Be descriptive for best results."
            },
            aspect_ratio: {
              type: "string",
              enum: VALID_ASPECT_RATIOS,
              description: "The aspect ratio of the generated image",
              default: "1:1"
            },
            guidance_scale: {
              type: "number",
              description: "Controls how closely the output image aligns with the input prompt. Higher values mean stronger prompt correlation.",
              minimum: 1.0,
              maximum: 20.0,
              default: 2.5
            },
            num_images: {
              type: "integer",
              description: "Number of images to generate",
              minimum: 1,
              maximum: 4,
              default: 1
            },
            seed: {
              type: "integer",
              description: "Random seed to control the stochasticity of image generation. Use the same seed for reproducible results.",
              minimum: 0,
              maximum: 2147483647
            }
          },
          required: ["prompt"]
        }
      },
      {
        name: "generate_image_batch",
        description: "Generate multiple images with different prompts in a single request using SeedDream 3.0.",
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
            aspect_ratio: {
              type: "string",
              enum: VALID_ASPECT_RATIOS,
              description: "The aspect ratio for all generated images",
              default: "1:1"
            },
            guidance_scale: {
              type: "number",
              description: "Controls how closely the output images align with the input prompts",
              minimum: 1.0,
              maximum: 20.0,
              default: 2.5
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
        const params = (request.params.arguments || {}) as unknown as SeedDreamParams;
        
        if (!params.prompt || typeof params.prompt !== 'string') {
          throw new Error("Prompt is required and must be a string");
        }

        // Validate aspect ratio if provided
        if (params.aspect_ratio && !VALID_ASPECT_RATIOS.includes(params.aspect_ratio)) {
          throw new Error(`Invalid aspect ratio. Must be one of: ${VALID_ASPECT_RATIOS.join(', ')}`);
        }

        // Prepare the request payload
        const payload: any = {
          prompt: params.prompt,
          aspect_ratio: params.aspect_ratio || "1:1",
          guidance_scale: params.guidance_scale || 2.5,
          num_images: params.num_images || 1
        };

        if (params.seed !== undefined) {
          payload.seed = params.seed;
        }

        console.error(`Generating image with prompt: "${params.prompt}"`);
        
        // Call the SeedDream 3.0 API
        const result = await fal.subscribe("fal-ai/bytedance/seedream/v3/text-to-image", {
          input: payload,
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              update.logs?.map((log) => log.message).forEach(msg => console.error(`[SeedDream] ${msg}`));
            }
          },
        }) as { data: SeedDreamResponse };

        const response = result.data;
        
        if (!response.images || response.images.length === 0) {
          throw new Error("No images were generated");
        }

        // Format the response
        const imageDescriptions = response.images.map((img, index) => {
          const dimensions = img.width && img.height ? ` (${img.width}x${img.height})` : '';
          return `Image ${index + 1}${dimensions}: ${img.url}`;
        }).join('\n');

        return {
          content: [
            {
              type: "text",
              text: `Successfully generated ${response.images.length} image(s) using SeedDream 3.0:

Prompt: "${params.prompt}"
Aspect Ratio: ${payload.aspect_ratio}
Guidance Scale: ${payload.guidance_scale}
Seed Used: ${response.seed}

Generated Images:
${imageDescriptions}

You can view and download the images using the URLs above. The images are hosted on FAL's CDN and will be available for download.`
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
        const { prompts, aspect_ratio = "1:1", guidance_scale = 2.5 } = request.params.arguments as {
          prompts: string[];
          aspect_ratio?: AspectRatio;
          guidance_scale?: number;
        };

        if (!Array.isArray(prompts) || prompts.length === 0) {
          throw new Error("Prompts array is required and must not be empty");
        }

        if (prompts.length > 5) {
          throw new Error("Maximum 5 prompts allowed per batch request");
        }

        // Validate aspect ratio
        if (!VALID_ASPECT_RATIOS.includes(aspect_ratio)) {
          throw new Error(`Invalid aspect ratio. Must be one of: ${VALID_ASPECT_RATIOS.join(', ')}`);
        }

        console.error(`Generating batch of ${prompts.length} images`);

        // Generate images for each prompt
        const results = await Promise.allSettled(
          prompts.map(async (prompt, index) => {
            console.error(`Generating image ${index + 1}/${prompts.length}: "${prompt}"`);
            
            const result = await fal.subscribe("fal-ai/bytedance/seedream/v3/text-to-image", {
              input: {
                prompt,
                aspect_ratio,
                guidance_scale,
                num_images: 1
              },
              logs: false
            }) as { data: SeedDreamResponse };

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
        let responseText = `Batch image generation completed using SeedDream 3.0:

Settings:
- Aspect Ratio: ${aspect_ratio}
- Guidance Scale: ${guidance_scale}
- Total Prompts: ${prompts.length}
- Successful: ${successful.length}
- Failed: ${failed.length}

`;

        if (successful.length > 0) {
          responseText += "Successfully Generated Images:\n";
          successful.forEach((item, index) => {
            responseText += `\n${index + 1}. Prompt: "${item.prompt}"\n`;
            responseText += `   Seed: ${item.seed}\n`;
            item.images.forEach((img, imgIndex) => {
              responseText += `   Image ${imgIndex + 1}: ${img.url}\n`;
            });
          });
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
  console.error("SeedDream 3.0 MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
