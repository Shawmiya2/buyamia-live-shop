import type { BotActionType } from "@prisma/client";

export type BotIntent = {
  actionType: BotActionType;
  confidence: "exact" | "keyword" | "fallback";
};

const intentPatterns: Array<{ actionType: BotActionType; patterns: RegExp[] }> = [
  {
    actionType: "account_summary",
    patterns: [/account\s+summary/i, /my\s+account/i, /account\s+info/i, /who\s+am\s+i/i, /dashboard/i],
  },
  {
    actionType: "schedule_live",
    patterns: [/schedule\s+(a\s+)?live/i, /launch\s+(a\s+)?live/i, /set\s+up\s+(a\s+)?live/i, /book\s+(a\s+)?live/i],
  },
  {
    actionType: "check_live_availability",
    patterns: [/available\s+slots?/i, /availability/i, /open\s+slots?/i, /time\s+slots?/i, /when\s+can\s+i\s+go\s+live/i],
  },
  {
    actionType: "create_live_request",
    patterns: [/create\s+(a\s+)?live\s+request/i, /draft\s+(a\s+)?live\s+request/i, /submit\s+(a\s+)?live\s+request/i],
  },
  {
    actionType: "live_status",
    patterns: [/live\s+status/i, /request\s+status/i, /show\s+live\s+requests?/i, /pending\s+live/i],
  },
  {
    actionType: "rfq_summary",
    patterns: [/rfq\s+summary/i, /procurement\s+summary/i, /show\s+rfqs?/i, /buyer\s+requests?/i],
  },
  {
    actionType: "create_account",
    patterns: [/create\s+(an\s+)?account/i, /setup\s+(an\s+)?account/i, /set\s+up\s+(an\s+)?account/i, /sign\s*up/i, /onboard/i],
  },
  {
    actionType: "help",
    patterns: [/^help$/i, /commands?/i, /what\s+can\s+you\s+do/i, /menu/i],
  },
];

export function detectBotIntent(message: string): BotIntent {
  const normalized = message.trim();
  if (!normalized) {
    return { actionType: "help", confidence: "fallback" };
  }

  for (const intent of intentPatterns) {
    if (intent.patterns.some((pattern) => pattern.test(normalized))) {
      return {
        actionType: intent.actionType,
        confidence: normalized.toLowerCase() === intent.actionType.replace(/_/g, " ") ? "exact" : "keyword",
      };
    }
  }

  return { actionType: "help", confidence: "fallback" };
}

export function getSuggestedBotCommands(role: string) {
  const commands = [
    "Account summary",
    "Check available live slots",
    "Schedule a live",
    "Create live request",
    "Show live request status",
    "Help",
  ];

  if (role === "main_admin") {
    commands.push("RFQ summary", "Pending live requests summary");
  }

  return commands;
}
