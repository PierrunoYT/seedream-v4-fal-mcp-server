# How to Create a Model Context Protocol (MCP) Server

## What is MCP?

The Model Context Protocol (MCP) is an open standard that enables AI applications to securely connect to data sources and tools. Think of MCP like a USB-C port for AI applications - it provides a standardized way for LLMs to access external resources.

## Core MCP Concepts

MCP servers can provide three main types of capabilities:

1. **Resources**: File-like data that can be read by clients (like API responses or file contents)
2. **Tools**: Functions that can be called by the LLM (with user approval)
3. **Prompts**: Pre-written templates that help users accomplish specific tasks

## Supported Languages

MCP servers can be built in multiple languages:
- **Python** (using FastMCP)
- **TypeScript/Node.js**
- **Java** (with Spring Boot)
- **Kotlin**
- **C#/.NET**

## Building Your First MCP Server (Python Example)

### Prerequisites
- Python 3.10 or higher
- Basic familiarity with Python and LLMs

### Setup Environment

```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create project
uv init weather-server
cd weather-server

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv add "mcp[cli]" httpx

# Create server file
touch weather.py
```

### Basic Server Structure

```python
from typing import Any
import httpx
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("weather")

# Constants
NWS_API_BASE = "https://api.weather.gov"
USER_AGENT = "weather-app/1.0"

# Helper function for API requests
async def make_nws_request(url: str) -> dict[str, Any] | None:
    """Make a request to the NWS API with proper error handling."""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/geo+json"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except Exception:
            return None

# Define tools using decorators
@mcp.tool()
async def get_alerts(state: str) -> str:
    """Get weather alerts for a US state.
    
    Args:
        state: Two-letter US state code (e.g. CA, NY)
    """
    url = f"{NWS_API_BASE}/alerts/active/area/{state}"
    data = await make_nws_request(url)
    
    if not data or "features" not in data:
        return "Unable to fetch alerts or no alerts found."
    
    if not data["features"]:
        return "No active alerts for this state."
    
    alerts = []
    for feature in data["features"]:
        props = feature["properties"]
        alert = f"""
Event: {props.get('event', 'Unknown')}
Area: {props.get('areaDesc', 'Unknown')}
Severity: {props.get('severity', 'Unknown')}
Description: {props.get('description', 'No description available')}
"""
        alerts.append(alert)
    
    return "\n---\n".join(alerts)

@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Get weather forecast for a location.
    
    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
    """
    # Get forecast grid endpoint
    points_url = f"{NWS_API_BASE}/points/{latitude},{longitude}"
    points_data = await make_nws_request(points_url)
    
    if not points_data:
        return "Unable to fetch forecast data for this location."
    
    # Get forecast URL and data
    forecast_url = points_data["properties"]["forecast"]
    forecast_data = await make_nws_request(forecast_url)
    
    if not forecast_data:
        return "Unable to fetch detailed forecast."
    
    # Format forecast periods
    periods = forecast_data["properties"]["periods"]
    forecasts = []
    for period in periods[:5]:  # Show next 5 periods
        forecast = f"""
{period['name']}:
Temperature: {period['temperature']}°{period['temperatureUnit']}
Wind: {period['windSpeed']} {period['windDirection']}
Forecast: {period['detailedForecast']}
"""
        forecasts.append(forecast)
    
    return "\n---\n".join(forecasts)

# Run the server
if __name__ == "__main__":
    mcp.run(transport='stdio')
```

### Running the Server

```bash
uv run weather.py
```

## TypeScript/Node.js Implementation

### Setup

```bash
mkdir weather-server
cd weather-server
npm init -y
npm install @modelcontextprotocol/sdk zod
npm install -D @types/node typescript

# Update package.json
echo '{"type": "module", "bin": {"weather": "./build/index.js"}}' > package.json
```

### Basic TypeScript Server

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "weather",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register tools
server.tool(
  "get-forecast",
  "Get weather forecast for a location",
  {
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  },
  async ({ latitude, longitude }) => {
    // Implementation here
    return {
      content: [{ type: "text", text: "Forecast data..." }],
    };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

## Connecting to Claude Desktop

### Configuration

Create or edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "weather": {
      "command": "uv",
      "args": [
        "--directory",
        "/ABSOLUTE/PATH/TO/YOUR/PROJECT",
        "run",
        "weather.py"
      ]
    }
  }
}
```

For TypeScript:
```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/PROJECT/build/index.js"]
    }
  }
}
```

### Testing

1. Restart Claude Desktop
2. Look for the tools icon in the interface
3. Test with queries like:
   - "What's the weather in Sacramento?"
   - "What are the active weather alerts in Texas?"

## Best Practices

### Error Handling
- Always implement proper error handling for API calls
- Return meaningful error messages to users
- Use timeouts for external requests

### Security
- Validate all input parameters
- Use environment variables for sensitive data
- Implement rate limiting for API calls

### Performance
- Use async/await for I/O operations
- Implement caching where appropriate
- Keep tool responses concise but informative

## Advanced Features

### Resources
```python
@mcp.resource("file://logs/{date}")
async def get_logs(date: str) -> str:
    """Get log files for a specific date."""
    # Implementation
    pass
```

### Prompts
```python
@mcp.prompt()
async def analyze_data() -> str:
    """Prompt template for data analysis."""
    return "Analyze the following data and provide insights..."
```

## Debugging

### Common Issues
1. **Server not showing up**: Check config file syntax and absolute paths
2. **Tool calls failing**: Check server logs and error handling
3. **Connection issues**: Verify transport configuration

### Logging
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Testing Locally
```bash
# Test server directly
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | uv run weather.py
```

## Resources

- [Official MCP Documentation](https://modelcontextprotocol.io/)
- [Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Example Servers](https://github.com/modelcontextprotocol/servers)
- [MCP Specification](https://modelcontextprotocol.io/specification/)

## Next Steps

1. Start with the basic weather server example
2. Add your own tools and resources
3. Implement proper error handling and logging
4. Test with Claude Desktop or build your own client
5. Explore advanced features like resources and prompts
6. Consider publishing your server for others to use
