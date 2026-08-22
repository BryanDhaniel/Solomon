import { BaseTool, asString } from "./base";
import type {
  ToolActionType,
  ToolDefinition,
  ToolInput,
  ToolOutput,
} from "@/lib/shared/types";


/**
 * Simulated web search. Returns structured results shaped like a real search
 * API response so a live provider can replace `execute` without touching the
 * planner or renderer.
 */
export class SearchTool extends BaseTool {
  definition(): ToolDefinition {
    return {
      name: "search",
      description: "Search the web and return ranked results with snippets.",
      actions: [
        {
          action: "search",
          description: "Run a web search for a query.",
          parameters: {
            query: { type: "string", description: "The search query." },
          },
        },
      ],
      permissions: ["search_web"],
    };
  }

  actionType(_action: string): ToolActionType {
    return "read_only";
  }

  async execute(input: ToolInput): Promise<ToolOutput> {
    if (input.action !== "search") {
      return { success: false, error: `Unknown action: ${input.action}` };
    }
    const query = asString(input.parameters.query).trim();
    if (!query) {
      return { success: false, error: "A non-empty 'query' is required." };
    }

    const topic = query.replace(/\s+/g, " ").trim();
    const slug = encodeURIComponent(topic.slice(0, 40));
    const year = new Date().getFullYear();

    return {
      success: true,
      data: {
        query: topic,
        results: [
          {
            title: `${topic} — overview and current landscape (${year})`,
            url: `https://www.example-encyclopedia.org/wiki/${slug}`,
            snippet: `A structured overview of ${topic}: key concepts, major players, and how the space has developed through ${year}. Includes comparisons and references.`,
          },
          {
            title: `The state of ${topic}: what changed recently`,
            url: `https://blog.example-news.com/${slug}-state-${year}`,
            snippet: `Recent developments in ${topic}, including notable releases, adoption trends, and what practitioners should watch next quarter.`,
          },
          {
            title: `${topic}: practical guide and best practices`,
            url: `https://guides.example-dev.io/topics/${slug}`,
            snippet: `A practitioner's guide to ${topic} — common pitfalls, evaluation criteria, and recommended starting points with worked examples.`,
          },
        ],
      },
      metadata: { simulated: true },
    };
  }
}
