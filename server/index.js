#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { AnalyticsAdminServiceClient } from "@google-analytics/admin";
import fs from "fs";
import minimist from "minimist";

const log = (...args) => console.error("[GoogleAnalyticsMCP]", ...args);

class GoogleAnalyticsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "google-analytics-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    this.analyticsDataClient = null;
    this.analyticsAdminClient = null;
    this.defaultPropertyId = null;
    this.setupToolHandlers();
  }

  async initialize(args) {
    const keyFilePath = args["key-file"];
    if (!keyFilePath) {
      throw new Error(
        "キーファイルパスが --key-file 引数で指定されていません。"
      );
    }

    log(`キーファイルを読み込みます: ${keyFilePath}`);

    let credentials;
    try {
      const fileContent = fs.readFileSync(keyFilePath, "utf8");
      credentials = JSON.parse(fileContent);
    } catch (error) {
      log("キーファイルの読み込みまたは解析に失敗しました。", error);
      throw new Error(
        `キーファイルの読み込みに失敗しました: ${keyFilePath}. Error: ${error.message}`
      );
    }

    this.analyticsDataClient = new BetaAnalyticsDataClient({ credentials });
    this.analyticsAdminClient = new AnalyticsAdminServiceClient({
      credentials,
    });

    this.defaultPropertyId = args["property-id"] || null;
    log(`デフォルトのプロパティIDを設定しました: ${this.defaultPropertyId}`);
  }

  setupToolHandlers() {
    const tools = [
      {
        name: "list_properties",
        description:
          "アクセス可能なGoogle Analyticsのプロパティ一覧を取得します。",
        inputSchema: { type: "object", properties: {}, required: [] },
      },
      {
        name: "get_realtime_active_users",
        description: "直近30分間のアクティブユーザー数を取得します。",
        inputSchema: {
          type: "object",
          properties: {
            propertyId: {
              type: "string",
              description:
                "GA4プロパティID。省略時はデフォルト値が使用されます。",
            },
          },
          required: [],
        },
      },
      {
        name: "get_daily_report",
        description: "指定した日の合計ユーザー数とセッション数を取得します。",
        inputSchema: {
          type: "object",
          properties: {
            propertyId: {
              type: "string",
              description:
                "GA4プロパティID。省略時はデフォルト値が使用されます。",
            },
            date: {
              type: "string",
              description: "日付 (YYYY-MM-DD形式、省略時は昨日)",
            },
          },
          required: [],
        },
      },
      {
        name: "runReport",
        description:
          "柔軟なパラメータを指定して、Google Analyticsのレポートを取得します。",
        inputSchema: {
          type: "object",
          properties: {
            propertyId: {
              type: "string",
              description:
                "GA4プロパティID。省略時はデフォルト値が使用されます。",
            },
            startDate: {
              type: "string",
              description: "レポートの開始日 (YYYY-MM-DD形式)",
            },
            endDate: {
              type: "string",
              description: "レポートの終了日 (YYYY-MM-DD形式)",
            },
            metrics: {
              type: "array",
              items: { type: "string" },
              description: '取得する指標のリスト (例: ["activeUsers"])',
            },
            dimensions: {
              type: "array",
              items: { type: "string" },
              description: 'レポートの分析軸のリスト (例: ["date", "country"])',
            },
          },
          required: ["startDate", "endDate", "metrics", "dimensions"],
        },
      },
    ];

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      log(`Calling tool: ${name} with args:`, args);
      try {
        let result;
        switch (name) {
          case "list_properties":
            result = await this.listProperties();
            break;
          case "get_realtime_active_users":
            result = await this.getRealtimeActiveUsers(args.propertyId);
            break;
          case "get_daily_report":
            result = await this.getDailyReport(args.propertyId, args.date);
            break;
          case "runReport":
            result = await this.runReport(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        log("Tool execution error:", error);
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
        };
      }
    });
  }

  _getPropertyId(propertyId) {
    const pid = propertyId || this.defaultPropertyId;
    if (!pid) {
      throw new Error(
        "プロパティIDが指定されていません。ツールの引数で渡すか、拡張機能設定でデフォルト値を設定してください。"
      );
    }
    return pid;
  }

  async listProperties() {
    log("listProperties called.");
    try {
      const properties = [];
      // listAccountSummariesはページ分割されたレスポンスを返すイテレータを返します。
      const stream = this.analyticsAdminClient.listAccountSummariesAsync();

      // デバッグ用にレスポンス全体をログに出力
      console.error("Calling listAccountSummaries API...");

      for await (const accountSummary of stream) {
        log("Processing accountSummary:", accountSummary.displayName);
        if (
          accountSummary.propertySummaries &&
          Array.isArray(accountSummary.propertySummaries)
        ) {
          for (const propertySummary of accountSummary.propertySummaries) {
            log("Found property:", propertySummary.displayName);
            properties.push({
              propertyId: propertySummary.property.split("/")[1],
              displayName: propertySummary.displayName,
              accountDisplayName: accountSummary.displayName,
            });
          }
        }
      }

      log(`Found a total of ${properties.length} properties.`);
      return { properties };
    } catch (err) {
      log("API Error in listProperties:", err);
      console.error("Full error object:", JSON.stringify(err, null, 2));
      return {
        error: "Failed to list properties.",
        details: err.message,
      };
    }
  }

  async getRealtimeActiveUsers(propertyId) {
    const pid = this._getPropertyId(propertyId);
    try {
      const [response] = await this.analyticsDataClient.runRealtimeReport({
        property: `properties/${pid}`,
        metrics: [{ name: "activeUsers" }],
      });

      const activeUsers = response.rows?.[0]?.metricValues?.[0]?.value ?? "0";
      return { propertyId: pid, activeUsers };
    } catch (err) {
      log("API Error in getRealtimeActiveUsers:", err);
      return {
        error: "Failed to get realtime active users.",
        details: err.message,
      };
    }
  }

  async getDailyReport(propertyId, dateStr) {
    const pid = this._getPropertyId(propertyId);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDate = (date) => date.toISOString().split("T")[0];

    const startDate = dateStr || formatDate(yesterday);
    const endDate = dateStr || formatDate(yesterday);

    try {
      const [response] = await this.analyticsDataClient.runReport({
        property: `properties/${pid}`,
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: "totalUsers" }, { name: "sessions" }],
      });

      const totalUsers = response.rows?.[0]?.metricValues?.[0]?.value ?? "0";
      const sessions = response.rows?.[0]?.metricValues?.[1]?.value ?? "0";
      return {
        propertyId: pid,
        dateRange: { startDate, endDate },
        totalUsers,
        sessions,
      };
    } catch (err) {
      log("API Error in getDailyReport:", err);
      return {
        error: "Failed to get daily report.",
        details: err.message,
      };
    }
  }

  async runReport(args) {
    const { propertyId, startDate, endDate, metrics, dimensions } = args;
    const pid = this._getPropertyId(propertyId);

    try {
      const [response] = await this.analyticsDataClient.runReport({
        property: `properties/${pid}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: dimensions.map((name) => ({ name })),
        metrics: metrics.map((name) => ({ name })),
      });

      const result = {
        headers: [...dimensions, ...metrics],
        rows: [],
      };

      (response.rows || []).forEach((row) => {
        const rowData = [];
        (row.dimensionValues || []).forEach((dimValue) => {
          rowData.push(dimValue.value);
        });
        (row.metricValues || []).forEach((metricValue) => {
          rowData.push(metricValue.value);
        });
        result.rows.push(rowData);
      });

      return result;
    } catch (err) {
      log("API Error in runReport:", err);
      return {
        error: "Failed to run report.",
        details: err.message,
      };
    }
  }

  async run() {
    try {
      const args = minimist(process.argv.slice(2));
      await this.initialize(args);
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      log("Google Analytics MCP Server is running.");
    } catch (error) {
      log("致命的エラー:", error.message, error.stack);
      process.exit(1);
    }
  }
}

new GoogleAnalyticsMCPServer().run();
