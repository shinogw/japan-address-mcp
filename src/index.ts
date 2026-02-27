#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Create server instance
const server = new Server(
  {
    name: "japan-address-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "health_check",
        description: "サーバーの稼働状況を確認します",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "postal_to_address",
        description: "郵便番号から住所を取得します",
        inputSchema: {
          type: "object",
          properties: {
            postalCode: {
              type: "string",
              description: "郵便番号（例: 100-0001 または 1000001）",
            },
          },
          required: ["postalCode"],
        },
      },
      {
        name: "normalize_address",
        description: "日本の住所を正規化します（表記ゆれを統一）",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "正規化したい住所",
            },
          },
          required: ["address"],
        },
      },
      {
        name: "address_to_postal",
        description: "住所から郵便番号を検索します",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "検索したい住所",
            },
          },
          required: ["address"],
        },
      },
      {
        name: "validate_address",
        description: "住所が有効かどうか検証します",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "検証したい住所",
            },
          },
          required: ["address"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "health_check":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "ok",
                server: "japan-address-mcp",
                version: "0.1.0",
                timestamp: new Date().toISOString(),
              }),
            },
          ],
        };

      case "postal_to_address":
        // TODO: Issue #5で実装
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Not implemented yet",
                message: "この機能はIssue #5で実装予定です",
              }),
            },
          ],
        };

      case "normalize_address":
        // TODO: Issue #8で実装
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Not implemented yet",
                message: "この機能はIssue #8で実装予定です",
              }),
            },
          ],
        };

      case "address_to_postal":
        // TODO: Issue #6で実装
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Not implemented yet",
                message: "この機能はIssue #6で実装予定です",
              }),
            },
          ],
        };

      case "validate_address":
        // TODO: Issue #9で実装
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Not implemented yet",
                message: "この機能はIssue #9で実装予定です",
              }),
            },
          ],
        };

      default:
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Unknown tool",
                message: `Tool '${name}' is not supported`,
              }),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: "Internal error",
            message: error instanceof Error ? error.message : String(error),
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("japan-address-mcp server started");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
