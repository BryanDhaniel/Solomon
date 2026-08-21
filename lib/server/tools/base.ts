import type {
  ToolActionType,
  ToolDefinition,
  ToolInput,
  ToolOutput,
} from "@/lib/shared/types";

export abstract class BaseTool {
  abstract definition(): ToolDefinition;
  abstract execute(input: ToolInput): Promise<ToolOutput>;
  abstract actionType(action: string): ToolActionType;
}
