#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { postalDataLoader } from "./data/loader.js";
import { postalToAddress, addressToPostal } from "./tools/postal.js";
import { normalizeAddress } from "./tools/normalize.js";
import { validateAddress } from "./tools/validate.js";

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
        description: "郵便番号から住所を取得します。7桁の郵便番号を入力すると、対応する都道府県・市区町村・町域を返します。",
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
        name: "address_to_postal",
        description: "住所から郵便番号を検索します。住所の一部を入力すると、該当する郵便番号の一覧を返します。",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "検索したい住所（例: 東京都千代田区）",
            },
          },
          required: ["address"],
        },
      },
      {
        name: "normalize_address",
        description: "日本の住所を正規化します。全角/半角の統一、ハイフン統一、丁目・番地・号の統一などを行います。",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "正規化したい住所",
            },
            options: {
              type: "object",
              description: "正規化オプション",
              properties: {
                convertFullwidthToHalfwidth: {
                  type: "boolean",
                  description: "全角英数字を半角に変換（デフォルト: true）",
                },
                convertHalfwidthKanaToFullwidth: {
                  type: "boolean",
                  description: "半角カナを全角に変換（デフォルト: true）",
                },
                convertKanjiNumbers: {
                  type: "boolean",
                  description: "漢数字を算用数字に変換（デフォルト: false）",
                },
                normalizeHyphens: {
                  type: "boolean",
                  description: "ハイフン/ダッシュを統一（デフォルト: true）",
                },
                normalizeSpaces: {
                  type: "boolean",
                  description: "スペースを統一（デフォルト: true）",
                },
                normalizeChome: {
                  type: "boolean",
                  description: "丁目・番地・号の表記を統一（デフォルト: true）",
                },
              },
            },
          },
          required: ["address"],
        },
      },
      {
        name: "validate_address",
        description: "住所が有効かどうか検証します。郵便番号データベースと照合し、存在確認と候補提示を行います。",
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
      case "health_check": {
        const stats = postalDataLoader.getStats();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "ok",
                server: "japan-address-mcp",
                version: "0.1.0",
                timestamp: new Date().toISOString(),
                dataLoaded: postalDataLoader.isLoaded(),
                stats: stats,
              }, null, 2),
            },
          ],
        };
      }

      case "postal_to_address": {
        const postalCode = (args as { postalCode: string }).postalCode;
        const result = await postalToAddress(postalCode);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "address_to_postal": {
        const address = (args as { address: string }).address;
        const result = await addressToPostal(address);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "normalize_address": {
        const { address, options } = args as { address: string; options?: object };
        const result = normalizeAddress(address, options);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "validate_address": {
        const address = (args as { address: string }).address;
        const result = await validateAddress(address);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

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
  // Pre-load postal data
  console.error("Loading postal data...");
  await postalDataLoader.load();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("japan-address-mcp server started");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
