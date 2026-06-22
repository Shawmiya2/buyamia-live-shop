import { z } from "zod";
import { prisma } from "./prisma";
import { ApiError, ValidationApiError } from "./errors";
import { canAccessDashboard, getDashboardForRole } from "./role-guard";
import type {
  AssistantAction,
  AssistantResponse,
  ProfileType,
  SafeUser,
} from "./types";

const querySchema = z.object({
  query: z.string().trim().min(1, "Please enter a command or search.").max(180, "Please keep the query shorter."),
});

const publicRoles: ProfileType[] = ["main_admin", "hotel", "restaurant", "supplier", "service_provider", "viewer"];

type CommandDefinition = AssistantAction & {
  aliases: string[];
  roles: "public" | ProfileType[];
};

export const assistantCommands: CommandDefinition[] = [
  command("open_calendar", "Open calendar", "/dashboard/main/calendar", "Open the main admin operations calendar.", ["calendar", "view calendar", "show calendar", "operations calendar"], ["main_admin"]),
  command("generate_rfq", "Generate an RFQ", "/dashboard/main/rfqs/new", "Create a new RFQ from the main admin dashboard.", ["generate rfq", "create rfq", "new rfq", "make an rfq", "generate an rfq"], ["main_admin"]),
  command("show_rfqs", "Show RFQs", "/dashboard/main/rfqs", "Open stored RFQs.", ["show rfqs", "open rfqs", "list rfqs", "rfq list"], ["main_admin"]),
  command("rank_suppliers", "Rank suppliers", "/dashboard/main/suppliers/rank", "Open supplier ranking and filters.", ["rank suppliers", "supplier ranking", "score suppliers", "find suppliers"], ["main_admin"]),
  command("open_negotiations", "Open negotiations", "/dashboard/main/negotiations", "Open the negotiation workspace.", ["open negotiations", "show negotiations", "negotiation workspace", "negotiations"], ["main_admin"]),
  command("review_risk", "Review risk", "/dashboard/main/risk", "Open provider and RFQ risk review.", ["review risk", "risk review", "show risk", "audit risk"], ["main_admin"]),
  command("pending_live_requests", "Show pending live requests", "/dashboard/main#pending-live-requests", "Jump to the main admin live request queue.", ["pending live requests", "show pending live requests", "admin queue", "live request queue"], ["main_admin"]),
  command("manage_lives", "Manage lives", "/dashboard/main/lives", "Open paginated main admin live controls.", ["manage lives", "all lives", "live controls", "backend live controls"], ["main_admin"]),
  command("show_pinned_lives", "Show pinned lives", "/dashboard/main/lives?pinned=true", "Filter main admin live controls to active pins.", ["pinned lives", "show pinned lives", "active pins", "pinned live controls"], ["main_admin"]),
  command("show_replay_expiring", "Show replay expiring soon", "/dashboard/main/lives?replayStatus=expiring_soon", "Filter lives to replay windows expiring soon.", ["replay expiring soon", "expiring replays", "show expiring replays", "replays expiring soon"], ["main_admin"]),
  command("hotel_dashboard", "Open hotel dashboard", "/dashboard/hotel", "Open the hotel dashboard.", ["hotel dashboard", "open hotel", "hotel workspace"], ["main_admin", "hotel"]),
  command("restaurant_dashboard", "Open restaurant dashboard", "/dashboard/restaurant", "Open the restaurant dashboard.", ["restaurant dashboard", "open restaurant", "restaurant workspace"], ["main_admin", "restaurant"]),
  command("supplier_dashboard", "Open supplier dashboard", "/dashboard/supplier", "Open the supplier dashboard.", ["supplier dashboard", "open supplier", "supplier workspace"], ["main_admin", "supplier"]),
  command("services_dashboard", "Open services dashboard", "/dashboard/services", "Open the services dashboard.", ["services dashboard", "service provider dashboard", "open services"], ["main_admin", "service_provider"]),
  command("viewer_dashboard", "Open viewer dashboard", "/dashboard/viewer", "Open the viewer dashboard.", ["viewer dashboard", "traveler dashboard", "open viewer"], ["main_admin", "viewer"]),
  command("explore_live", "Explore live streams", "/live", "Browse public live streams and replays.", ["explore live streams", "open live streams", "find lives", "browse lives", "live streams"], "public"),
  command("create_account", "Create account", "/signup", "Create a Buyamia account.", ["create account", "sign up", "signup", "register"], "public"),
  command("help", "Help", "#assistant-help", "Show all supported assistant actions.", ["help", "commands", "available commands", "show commands"], "public", "help"),
];

export function getAssistantIntegrationStatus() {
  const providerConfigured = Boolean(process.env.BUYAMIA_AI_PROVIDER || process.env.OPENAI_API_KEY);

  return {
    mode: providerConfigured ? "provider" as const : "local" as const,
    providerConfigured,
    providerHealthy: providerConfigured,
  };
}

export async function runAssistantQuery(input: unknown, user: SafeUser | null): Promise<AssistantResponse> {
  const parsed = querySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationApiError({ query: parsed.error.issues[0]?.message ?? "Please enter a command or search." });
  }

  const query = parsed.data.query;
  const status = getAssistantIntegrationStatus();
  const allowedCommands = commandsForRole(user?.role ?? null);
  const matched = matchCommand(query, allowedCommands);
  const helpRequested = matched?.id === "help";
  const results = helpRequested ? [] : await searchRealData(query, user);
  const suggestions = allowedCommands.slice(0, 8).map(stripCommand);

  return {
    ...status,
    role: user?.role ?? null,
    query,
    recognizedAction: matched ? stripCommand(matched) : undefined,
    actions: helpRequested ? allowedCommands.map(stripCommand) : matched ? [stripCommand(matched)] : [],
    results,
    suggestions: helpRequested || matched || results.length ? suggestions : suggestions.slice(0, 5),
    message: messageForResponse(Boolean(matched), results.length, helpRequested),
  };
}

export function commandsForRole(role: ProfileType | null) {
  return assistantCommands.filter((item) => isCommandAllowed(item, role));
}

function command(
  id: string,
  title: string,
  href: string,
  description: string,
  aliases: string[],
  roles: "public" | ProfileType[],
  category: AssistantAction["category"] = "command",
): CommandDefinition {
  return { id, title, href, description, aliases: [title, ...aliases], roles, category };
}

function isCommandAllowed(commandDefinition: CommandDefinition, role: ProfileType | null) {
  if (commandDefinition.roles === "public") {
    return true;
  }
  if (!role) {
    return false;
  }
  if (commandDefinition.href.startsWith("/dashboard/")) {
    const dashboardType = dashboardTypeFromHref(commandDefinition.href);
    if (dashboardType && !canAccessDashboard(role, dashboardType)) {
      return false;
    }
  }
  return commandDefinition.roles.includes(role);
}

function dashboardTypeFromHref(href: string) {
  if (href.startsWith("/dashboard/main")) return "main";
  if (href.startsWith("/dashboard/hotel")) return "hotel";
  if (href.startsWith("/dashboard/restaurant")) return "restaurant";
  if (href.startsWith("/dashboard/supplier")) return "supplier";
  if (href.startsWith("/dashboard/services")) return "services";
  if (href.startsWith("/dashboard/viewer")) return "viewer";
  return null;
}

function matchCommand(query: string, commands: CommandDefinition[]) {
  const normalizedQuery = normalize(query);
  let best: { command: CommandDefinition; score: number } | null = null;

  for (const item of commands) {
    for (const alias of item.aliases) {
      const score = fuzzyScore(normalizedQuery, normalize(alias));
      if (!best || score > best.score) {
        best = { command: item, score };
      }
    }
  }

  return best && best.score >= 0.62 ? best.command : null;
}

function fuzzyScore(query: string, alias: string) {
  if (!query || !alias) return 0;
  if (query === alias) return 1;
  if (query.includes(alias) || alias.includes(query)) return 0.86;

  const queryTokens = query.split(" ").filter(Boolean);
  const aliasTokens = alias.split(" ").filter(Boolean);
  const matched = aliasTokens.filter((token) =>
    queryTokens.some((queryToken) => queryToken === token || queryToken.startsWith(token) || token.startsWith(queryToken)),
  ).length;

  return matched / Math.max(aliasTokens.length, queryTokens.length);
}

async function searchRealData(query: string, user: SafeUser | null) {
  const terms = searchTerms(query);
  const search = terms.join(" ");
  const role = user?.role ?? null;
  const canSearchAdmin = role === "main_admin";
  const providerId = user?.providerId;
  const liveWhere = liveSearchWhere(query, search);
  const [lives, providers, rfqs, liveRequests] = await Promise.all([
    prisma.live.findMany({
      where: liveWhere,
      include: { provider: true },
      orderBy: [{ isPinned: "desc" }, { scheduledAt: "desc" }],
      take: 5,
    }),
    prisma.providerProfile.findMany({
      where: {
        OR: [
          { displayName: { contains: search } },
          { category: { in: providerRolesInQuery(query) } },
          { location: { contains: search } },
          { description: { contains: search } },
        ],
      },
      include: { user: true },
      take: 5,
    }),
    canSearchAdmin
      ? prisma.rfq.findMany({
          where: {
            OR: [
              { title: { contains: search } },
              { category: { contains: search } },
              { requirements: { contains: search } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    canSearchAdmin || providerId
      ? prisma.liveRequest.findMany({
          where: {
            providerId: canSearchAdmin ? undefined : providerId,
            OR: [
              { title: { contains: search } },
              { category: { contains: search } },
              { description: { contains: search } },
            ],
          },
          include: { provider: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  return [
    ...lives.map((live) => ({
      id: live.id,
      title: live.title,
      href: role === "main_admin" ? `/dashboard/main/lives/${live.id}` : `/live/${live.id}`,
      context: `${live.provider.displayName} - ${live.category} - ${live.status.replace(/_/g, " ")}`,
      type: "live" as const,
    })),
    ...providers.map((provider) => ({
      id: provider.id,
      title: provider.displayName,
      href: role === "main_admin" ? `/dashboard/main/suppliers/${provider.id}` : getDashboardForRole(provider.category),
      context: `${provider.category.replace(/_/g, " ")}${provider.location ? ` - ${provider.location}` : ""}`,
      type: "provider" as const,
    })),
    ...rfqs.map((rfq) => ({
      id: rfq.id,
      title: rfq.title,
      href: `/dashboard/main/rfqs/${rfq.id}`,
      context: `${rfq.category} - ${rfq.status.replace(/_/g, " ")}`,
      type: "rfq" as const,
    })),
    ...liveRequests.map((request) => ({
      id: request.id,
      title: request.title,
      href: role === "main_admin" ? "/dashboard/main#pending-live-requests" : getDashboardForRole(role ?? "viewer"),
      context: `${request.provider.displayName} - ${request.category} - ${request.status.replace(/_/g, " ")}`,
      type: "live_request" as const,
    })),
  ].slice(0, 10);
}

function liveSearchWhere(query: string, search: string) {
  const lower = normalize(query);
  const roleFilters = providerRolesInQuery(query);
  const and = [];

  if (roleFilters.length) {
    and.push({ provider: { category: { in: roleFilters } } });
  }
  if (lower.includes("active")) {
    and.push({ status: "active" as const });
  }
  if (lower.includes("replay")) {
    and.push({ status: "completed" as const });
  }

  and.push({
    OR: [
      { title: { contains: search } },
      { category: { contains: search } },
      { provider: { displayName: { contains: search } } },
      { provider: { location: { contains: search } } },
      { provider: { description: { contains: search } } },
    ],
  });

  return { AND: and };
}

function providerRolesInQuery(query: string) {
  const lower = normalize(query);
  const roles: ProfileType[] = [];
  if (lower.includes("hotel")) roles.push("hotel");
  if (lower.includes("restaurant")) roles.push("restaurant");
  if (lower.includes("supplier") || lower.includes("rattan")) roles.push("supplier");
  if (lower.includes("service")) roles.push("service_provider");
  return roles.filter((role) => publicRoles.includes(role));
}

function searchTerms(query: string) {
  const stopWords = new Set(["find", "show", "open", "active", "live", "lives", "replay", "replays", "the", "a", "an"]);
  const terms = normalize(query).split(" ").filter((term) => term && !stopWords.has(term));
  return terms.length ? terms : normalize(query).split(" ").filter(Boolean);
}

function messageForResponse(hasAction: boolean, resultCount: number, helpRequested: boolean) {
  if (helpRequested) return "Available commands are listed below.";
  if (hasAction && resultCount) return "I found an action and matching data.";
  if (hasAction) return "I found a matching action.";
  if (resultCount) return "I found matching records.";
  return "I could not match that yet. Try one of the available commands.";
}

function stripCommand(commandDefinition: CommandDefinition): AssistantAction {
  const { aliases: _aliases, roles: _roles, ...action } = commandDefinition;
  return action;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
