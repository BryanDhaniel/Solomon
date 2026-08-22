import { BaseTool, asString } from "./base";
import type {
  ToolActionType,
  ToolDefinition,
  ToolInput,
  ToolOutput,
} from "@/lib/shared/types";


/**
 * Simulated page fetcher. Returns structured content shaped like a real
 * headless-browser extraction so a live Playwright/fetch backend can replace
 * `execute` without touching the planner or renderer.
 */
export class BrowseTool extends BaseTool {
  definition(): ToolDefinition {
    return {
      name: "browse",
      description: "Open a URL and extract its readable content.",
      actions: [
        {
          action: "navigate",
          description: "Fetch a web page and extract its main content.",
          parameters: {
            url: { type: "string", description: "The absolute URL to open." },
          },
        },
      ],
      permissions: ["browse_web"],
    };
  }

  actionType(_action: string): ToolActionType {
    return "read_only";
  }

  async execute(input: ToolInput): Promise<ToolOutput> {
    if (input.action !== "navigate") {
      return { success: false, error: `Unknown action: ${input.action}` };
    }
    const url = asString(input.parameters.url).trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      return { success: false, error: "A valid absolute http(s) URL is required." };
    }

    let host = url;
    try {
      host = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      /* keep raw url as host */
    }
    const pageName = host.split(".")[0].replace(/[-_]/g, " ");

    return {
      success: true,
      data: {
        url,
        title: `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} — page content`,
        sections: [
          `Overview: this page on ${host} introduces its main subject and links to the primary resources it publishes.`,
          "Key points: three highlighted take-aways with supporting detail and references.",
          "Updates: the most recent changes posted by the authors, newest first.",
        ],
        fetchedAt: new Date().toISOString(),
      },
      metadata: { simulated: true },
    };
  }
}
