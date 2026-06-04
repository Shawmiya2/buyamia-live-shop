import Image from "next/image";
import Link from "next/link";
import { DashboardAccessGate } from "./dashboard-access-gate";
import { DashboardApiPanels } from "./dashboard-api-panels";
import type { DashboardType } from "@/lib/backend/types";

type DashboardKind =
  | "overview"
  | "hotel"
  | "restaurant"
  | "supplier"
  | "services"
  | "traveler"
  | "procurement";

type Tone = "default" | "dark" | "warm" | "live" | "risk";

type Metric = {
  label: string;
  value: string;
  delta: string;
  tone?: Tone;
};

type WorkItem = {
  title: string;
  detail: string;
  status: string;
  tone?: Tone;
};

type Signal = {
  label: string;
  value: string;
  width: number;
};

type DashboardTab = {
  label: string;
  items: WorkItem[];
};

type Dashboard = {
  kind: Exclude<DashboardKind, "overview">;
  name: string;
  href: string;
  eyebrow: string;
  headline: string;
  summary: string;
  command: string;
  heroImage: string;
  trustScore: string;
  healthLabel: string;
  metrics: Metric[];
  priority: WorkItem[];
  widgets: WorkItem[];
  tabs: DashboardTab[];
  activity: WorkItem[];
  analytics: Signal[];
  quickActions: string[];
};

const dashboards: Dashboard[] = [
  {
    kind: "hotel",
    name: "Hotel",
    href: "/dashboard/hotel",
    eyebrow: "Hotel command center",
    headline: "Live rooms, bookings, guest trust, and room revenue in one cockpit.",
    summary:
      "Hotels manage live room tours, verified reviews, booking status, replay analytics, guest verification, stream scheduling, showcase content, and trust score operations from a compact operating surface.",
    command: "Ask Buyamia AI to summarize booking risk and room showcase gaps",
    heroImage:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1500&q=88",
    trustScore: "94",
    healthLabel: "Room readiness healthy",
    metrics: [
      { label: "Live rooms", value: "12", delta: "4 selling now", tone: "live" },
      { label: "Bookings", value: "$306K", delta: "+21% next 14 days" },
      { label: "Verified reviews", value: "312", delta: "4.8 average score" },
      { label: "Trust score", value: "94", delta: "Guest proof verified", tone: "dark" },
    ],
    priority: [
      {
        title: "Ocean suite live room",
        detail: "1,820 viewers, 18.6% booking intent, VIP transfer offer attached.",
        status: "Live",
        tone: "live",
      },
      {
        title: "Late check-in queue",
        detail: "Eight suites need final inspection before the 16:00 arrival window.",
        status: "Action",
        tone: "risk",
      },
      {
        title: "Replay analytics",
        detail: "Pool privacy segment produced the highest booking lift in replays.",
        status: "+14%",
      },
    ],
    widgets: [
      {
        title: "Guest verification",
        detail: "Stay-linked reviews, identity confidence, and direct booking proof.",
        status: "Verified",
      },
      {
        title: "Stream scheduling",
        detail: "Sunset walkthrough, breakfast Q&A, and spa inspection sessions.",
        status: "3 queued",
      },
      {
        title: "Room showcase",
        detail: "Suites, villas, premium king, and family inventory need fresh media.",
        status: "Manage",
      },
      {
        title: "Booking status",
        detail: "Direct site leads OTA share while concierge remains high value.",
        status: "62%",
      },
      {
        title: "Replay conversion",
        detail: "Short replay clips convert after guests compare amenities.",
        status: "18.6%",
      },
      {
        title: "Performance metrics",
        detail: "Occupancy, RevPAR, cancellation risk, and channel mix.",
        status: "Live",
      },
    ],
    tabs: [
      {
        label: "Live Rooms",
        items: [
          {
            title: "Ocean suite sunset walkthrough",
            detail: "Canggu boutique resort is live with verified guest Q&A.",
            status: "1,820",
            tone: "live",
          },
          {
            title: "Villa breakfast and pool privacy",
            detail: "Audience is queued for the 15:30 booking-assisted session.",
            status: "640 queued",
          },
          {
            title: "Spa room inspection",
            detail: "Prior guests validate treatment rooms and service pacing.",
            status: "18:45",
          },
        ],
      },
      {
        label: "Bookings",
        items: [
          {
            title: "Direct site",
            detail: "42% of revenue with lower OTA dependency.",
            status: "$128K",
          },
          {
            title: "Live sessions",
            detail: "28% of revenue attributed to live assisted decisions.",
            status: "$86K",
          },
          {
            title: "Concierge",
            detail: "High-value stays are being routed through VIP bundles.",
            status: "$54K",
          },
        ],
      },
      {
        label: "Reviews",
        items: [
          {
            title: "Maya L.",
            detail: "Private pool matched the live walkthrough and check-in took six minutes.",
            status: "5.0",
          },
          {
            title: "Daniel K.",
            detail: "Airport transfer bundle worked without extra follow-up.",
            status: "4.8",
          },
          {
            title: "Nadia R.",
            detail: "Breakfast queue needs better weekend pacing.",
            status: "4.7",
            tone: "warm",
          },
        ],
      },
    ],
    activity: [
      {
        title: "Villa refresh RFQ",
        detail: "Outdoor lounge sets are 11% below target quote.",
        status: "Approve",
      },
      {
        title: "Guest proof updated",
        detail: "Twelve verified stay references attached to suite media.",
        status: "Done",
      },
      {
        title: "Booking push",
        detail: "AI recommends sending replay to Singapore and UAE audiences.",
        status: "Ready",
      },
    ],
    analytics: [
      { label: "Occupancy", value: "86%", width: 86 },
      { label: "Room readiness", value: "94%", width: 94 },
      { label: "Replay lift", value: "41%", width: 41 },
      { label: "Cancellation risk", value: "3.2%", width: 12 },
    ],
    quickActions: ["Open live room", "Create booking push", "Schedule stream", "Generate review brief"],
  },
  {
    kind: "restaurant",
    name: "Restaurant",
    href: "/dashboard/restaurant",
    eyebrow: "Restaurant operations",
    headline: "Chef streams, reservations, live orders, and diner trust.",
    summary:
      "Restaurants control live chef streams, bookings, tasting sessions, menu highlights, livestream controls, customer analytics, reservations, and live order flow in one dense command layer.",
    command: "Ask Buyamia AI to rebalance covers, menu highlights, and kitchen load",
    heroImage:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1500&q=88",
    trustScore: "91",
    healthLabel: "Service tempo strong",
    metrics: [
      { label: "Live chef streams", value: "7", delta: "2 selling now", tone: "live" },
      { label: "Reservations", value: "284", delta: "+36 waitlist" },
      { label: "Live orders", value: "1.8K", delta: "Grab and Gojek staged" },
      { label: "Diner trust", value: "4.9", delta: "Receipt-linked reviews", tone: "dark" },
    ],
    priority: [
      {
        title: "Seminyak chef tasting",
        detail: "2,460 watching, 184 orders, tasting menu bundle is pacing above target.",
        status: "Live",
        tone: "live",
      },
      {
        title: "Dessert production",
        detail: "Patisserie batch is short 18 portions for the 20:00 service window.",
        status: "Prep",
        tone: "warm",
      },
      {
        title: "Waitlist surge",
        detail: "36 high-value guests requested the 19:30 seating.",
        status: "High",
        tone: "risk",
      },
    ],
    widgets: [
      {
        title: "Tasting sessions",
        detail: "Chef table, wine pairing, and dessert preview sessions.",
        status: "5 live",
      },
      {
        title: "Menu highlights",
        detail: "Lobster sambal, dry-aged duck, and pandan tart drive demand.",
        status: "Edit",
      },
      {
        title: "Livestream controls",
        detail: "Pin dishes, open bundles, pause order intake, and invite diners.",
        status: "Ready",
      },
      {
        title: "Customer analytics",
        detail: "Direct, concierge, live conversion, repeat diner, and region split.",
        status: "+24%",
      },
      {
        title: "Reservation mix",
        detail: "64% direct, 21% concierge, 15% live stream conversion.",
        status: "284",
      },
      {
        title: "Kitchen load",
        detail: "Grill station is the current constraint for tasting menu pacing.",
        status: "82%",
      },
    ],
    tabs: [
      {
        label: "Chef Lives",
        items: [
          {
            title: "Chef table live review",
            detail: "Verified diners are validating the kitchen pass and tasting flow.",
            status: "2,460",
            tone: "live",
          },
          {
            title: "Coffee and brunch session",
            detail: "Ubud garden cafe has a loyalty-oriented replay package.",
            status: "920",
          },
          {
            title: "Private tasting",
            detail: "Concierge guests are invited for tomorrow evening.",
            status: "Invited",
          },
        ],
      },
      {
        label: "Orders",
        items: [
          {
            title: "Delivery SLA",
            detail: "Instant delivery ETA drifted above premium threshold.",
            status: "Watch",
            tone: "warm",
          },
          {
            title: "Chef bundle",
            detail: "Live-only tasting box is converting at 24% above baseline.",
            status: "+24%",
          },
          {
            title: "Menu capacity",
            detail: "Dessert cap should hold until pastry replenishment clears.",
            status: "Cap",
          },
        ],
      },
      {
        label: "Guests",
        items: [
          {
            title: "High-value waitlist",
            detail: "36 guests match premium table profiles.",
            status: "36",
          },
          {
            title: "Verified diner reviews",
            detail: "Receipt-linked feedback keeps promotional reviews out.",
            status: "4.9",
          },
          {
            title: "Concierge handoff",
            detail: "VIP groups need seating and tasting confirmations.",
            status: "8",
          },
        ],
      },
    ],
    activity: [
      {
        title: "Seafood RFQ",
        detail: "Morning supplier replenishment required for weekend menus.",
        status: "RFQ",
      },
      {
        title: "Tasting replay",
        detail: "AI clipped three objection-handling moments for retargeting.",
        status: "Ready",
      },
      {
        title: "Order routing",
        detail: "Gojek and Grab capacity staged for the live spike.",
        status: "Synced",
      },
    ],
    analytics: [
      { label: "Table turn", value: "74m", width: 74 },
      { label: "Live order lift", value: "88%", width: 88 },
      { label: "Kitchen load", value: "82%", width: 82 },
      { label: "Food cost", value: "31%", width: 31 },
    ],
    quickActions: ["Open chef live", "Pin menu highlight", "Create tasting", "Adjust reservations"],
  },
  {
    kind: "supplier",
    name: "Supplier",
    href: "/dashboard/supplier",
    eyebrow: "Supplier studio",
    headline: "Sourcing streams, RFQs, buyer intent, escrow, and shipments.",
    summary:
      "Suppliers manage sourcing streams, RFQs, MOQ analytics, buyer activity, quote management, escrow tracking, supplier verification, and shipment tracking without leaving the console.",
    command: "Ask Buyamia AI to turn live buyer questions into quote packs",
    heroImage:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1500&q=88",
    trustScore: "98",
    healthLabel: "Supplier verified",
    metrics: [
      { label: "Sourcing streams", value: "7", delta: "Rattan live trending", tone: "live" },
      { label: "RFQs", value: "48", delta: "18 quote packs drafted" },
      { label: "MOQ analytics", value: "36", delta: "Mixed container target" },
      { label: "Escrow tracking", value: "$38K", delta: "5 milestones", tone: "dark" },
    ],
    priority: [
      {
        title: "Rattan lounge stream",
        detail: "126 buyers watched. AI drafted 18 quote packs from replay questions.",
        status: "Hot",
        tone: "live",
      },
      {
        title: "Factory audit renewal",
        detail: "Upload export packing evidence and updated production photos.",
        status: "Due",
        tone: "warm",
      },
      {
        title: "Mixed container quote",
        detail: "Buyer wants daybeds, chairs, and side tables split by SKU.",
        status: "Build",
      },
    ],
    widgets: [
      {
        title: "Buyer activity",
        detail: "Enterprise hotels are revisiting warranty and outdoor finish terms.",
        status: "42",
      },
      {
        title: "Quote management",
        detail: "Draft, negotiate, approve, and hand off quote packs.",
        status: "18",
      },
      {
        title: "Supplier verification",
        detail: "Business identity, trade docs, audit score, and references verified.",
        status: "98",
      },
      {
        title: "Shipment tracking",
        detail: "Container, scheduled delivery, instant delivery, and document status.",
        status: "96%",
      },
      {
        title: "Production capacity",
        detail: "May load is healthy. June teak schedule is near capacity.",
        status: "71%",
      },
      {
        title: "Overstock live",
        detail: "42 woven lamps can move through a flash liquidation stream.",
        status: "Launch",
      },
    ],
    tabs: [
      {
        label: "RFQs",
        items: [
          {
            title: "Villa lounge set",
            detail: "Outdoor finish, cushion fabric, CIF Bali, and warranty requested.",
            status: "Review",
          },
          {
            title: "Mixed container",
            detail: "Daybeds, chairs, and side tables need SKU-level pricing.",
            status: "Build",
          },
          {
            title: "Spa fixtures",
            detail: "Lombok stone studio needs packaging evidence attached.",
            status: "Docs",
          },
        ],
      },
      {
        label: "Buyers",
        items: [
          {
            title: "Villa Group",
            detail: "Requested CIF Bali with cushion options during the live room.",
            status: "High",
            tone: "live",
          },
          {
            title: "Hotel procurement lead",
            detail: "Needs stronger outdoor finish terms before finance approval.",
            status: "Legal",
          },
          {
            title: "Cafe operator",
            detail: "Watching woven lighting replay for a smaller MOQ.",
            status: "Warm",
          },
        ],
      },
      {
        label: "Fulfillment",
        items: [
          {
            title: "Escrow milestone",
            detail: "QC photos accepted. Freight document check is next.",
            status: "$18K",
          },
          {
            title: "Shipment tracking",
            detail: "42 orders are on time across protected payment workflows.",
            status: "96%",
          },
          {
            title: "Warranty clause",
            detail: "Two hotel buyers requested stronger finish coverage.",
            status: "Review",
            tone: "warm",
          },
        ],
      },
    ],
    activity: [
      {
        title: "AI RFQ draft",
        detail: "Specs, MOQ split, incoterms, and payment terms generated.",
        status: "Ready",
      },
      {
        title: "Verification badge",
        detail: "Export docs, factory audit, and hotel references attached.",
        status: "Live",
      },
      {
        title: "Buyer response SLA",
        detail: "Average supplier reply time across active enterprise buyers.",
        status: "17m",
      },
    ],
    analytics: [
      { label: "RFQ conversion", value: "18.4%", width: 78 },
      { label: "On-time ship", value: "96%", width: 96 },
      { label: "Capacity load", value: "71%", width: 71 },
      { label: "Buyer response", value: "17m", width: 84 },
    ],
    quickActions: ["Generate quote", "Open sourcing stream", "Update escrow", "Launch overstock live"],
  },
  {
    kind: "services",
    name: "Services",
    href: "/dashboard/services",
    eyebrow: "Service provider studio",
    headline: "Generic service providers can launch verified lives without fitting Hotel or Restaurant.",
    summary:
      "Service partners manage live setup, document verification placeholders, replay windows, paid promotion options, and provider visibility from a simple service-first workspace.",
    command: "Ask Buyamia AI to prepare a service live setup checklist",
    heroImage:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1500&q=88",
    trustScore: "89",
    healthLabel: "Verification in progress",
    metrics: [
      { label: "Service lives", value: "9", delta: "3 ready to publish", tone: "live" },
      { label: "Verification", value: "14", delta: "Docs pending review" },
      { label: "Replay windows", value: "5d", delta: "Default availability", tone: "warm" },
      { label: "Pinned slots", value: "6", delta: "Sponsored and featured", tone: "dark" },
    ],
    priority: [
      {
        title: "Airport transfer live setup",
        detail: "Provider selected vehicle walkthrough, pricing Q&A, and safety checklist.",
        status: "Setup",
        tone: "live",
      },
      {
        title: "Verification queue",
        detail: "Business license mock upload and insurance proof placeholder need review.",
        status: "Docs",
        tone: "warm",
      },
      {
        title: "Replay storage limit",
        detail: "Three replays expire within 3 days unless the provider extends availability.",
        status: "3 days",
        tone: "risk",
      },
    ],
    widgets: [
      {
        title: "Live setup",
        detail: "Choose service type, title, availability, live format, and review checklist.",
        status: "CTA",
      },
      {
        title: "Verification",
        detail: "Visual document handoff only. Documents are reviewed before validation.",
        status: "Mock",
      },
      {
        title: "Payments placeholder",
        detail: "Organize or publish lives through a visible payment option without real checkout.",
        status: "UI only",
      },
      {
        title: "Replay expiration",
        detail: "Default 5-day replay availability keeps storage cost controlled.",
        status: "5 days",
      },
      {
        title: "Pinned lives",
        detail: "Sponsored, nearby, most watched, or Buyamia featured placement reasons.",
        status: "Pins",
      },
      {
        title: "Provider profile",
        detail: "Viewer follows, upcoming lives, available replays, and subscription state.",
        status: "Follow",
      },
    ],
    tabs: [
      {
        label: "Setup",
        items: [
          {
            title: "Set up a live for my service",
            detail: "Provider form asks what service they offer and which live format they need.",
            status: "Start",
            tone: "live",
          },
          {
            title: "Service type",
            detail: "Spa therapist, private driver, guide, wellness expert, concierge, or custom service.",
            status: "Choose",
          },
          {
            title: "Publish option",
            detail: "Payment placeholder is shown before scheduling or promoting the live.",
            status: "Mock pay",
          },
        ],
      },
      {
        label: "Verification",
        items: [
          {
            title: "Document handoff",
            detail: "Mock upload zones for ID, license, insurance, certificates, or portfolio proof.",
            status: "Visual",
          },
          {
            title: "Review before validation",
            detail: "Clear notice states documents are checked before the live is approved.",
            status: "Required",
          },
          {
            title: "Trust badge",
            detail: "Badge remains pending until verification review is complete.",
            status: "Pending",
            tone: "warm",
          },
        ],
      },
      {
        label: "Replays",
        items: [
          {
            title: "Replay available for 5 days",
            detail: "Standard retention label is visible on each service replay.",
            status: "5 days",
          },
          {
            title: "Extend replay availability",
            detail: "Paid extension option is represented as UI only.",
            status: "Extend",
          },
          {
            title: "Storage optimized",
            detail: "Expired replays are marked to avoid uncontrolled cloud storage cost.",
            status: "Optimized",
          },
        ],
      },
    ],
    activity: [
      {
        title: "Provider live draft",
        detail: "Private airport transfer service created a draft live walkthrough.",
        status: "Draft",
      },
      {
        title: "Mock documents received",
        detail: "Insurance and license placeholders are waiting for verification review.",
        status: "Review",
      },
      {
        title: "Pinned placement",
        detail: "Nearby discovery pin reserved for a verified spa consultation replay.",
        status: "Pinned",
      },
    ],
    analytics: [
      { label: "Setup completion", value: "72%", width: 72 },
      { label: "Verification readiness", value: "64%", width: 64 },
      { label: "Replay retention", value: "5d", width: 50 },
      { label: "Viewer follows", value: "318", width: 78 },
    ],
    quickActions: [
      "Set up a live for my service",
      "Review verification",
      "Extend replay availability",
      "Request pinned placement",
    ],
  },
  {
    kind: "traveler",
    name: "Traveler",
    href: "/dashboard/viewer",
    eyebrow: "Traveler concierge",
    headline: "Booked stays, watched lives, wishlists, and trusted trip status.",
    summary:
      "Travelers get a premium trip console for booked stays, watched lives, saved hotels, verified reviews, wishlist planning, replay history, and booking status.",
    command: "Ask Buyamia AI to compare saved hotels and replay highlights",
    heroImage:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1500&q=88",
    trustScore: "96",
    healthLabel: "Trip ready",
    metrics: [
      { label: "Booked stays", value: "3", delta: "2 confirmed, 1 pending" },
      { label: "Watched lives", value: "18", delta: "6 hotel replays" },
      { label: "Saved hotels", value: "24", delta: "8 shortlist matches" },
      { label: "Booking status", value: "Ready", delta: "No document gaps", tone: "dark" },
    ],
    priority: [
      {
        title: "Uluwatu cliff villa",
        detail: "Deposit cleared, airport transfer confirmed, check-in proof ready.",
        status: "Confirmed",
      },
      {
        title: "Canggu suite replay",
        detail: "AI flagged privacy, breakfast quality, and pool layout highlights.",
        status: "Replay",
        tone: "live",
      },
      {
        title: "Wishlist price watch",
        detail: "Two saved hotels dropped below the preferred nightly range.",
        status: "Watch",
      },
    ],
    widgets: [
      {
        title: "Verified reviews",
        detail: "Only stay-linked reviews and receipt-linked dining feedback.",
        status: "Trusted",
      },
      {
        title: "Wishlist",
        detail: "Hotels, restaurants, spas, and travel experiences grouped by trip.",
        status: "24",
      },
      {
        title: "Replay history",
        detail: "Room tours, chef tastings, spa inspections, and guide previews.",
        status: "18",
      },
      {
        title: "Saved hotels",
        detail: "Shortlist by location, trust score, live proof, and price.",
        status: "8 best",
      },
      {
        title: "Booked stays",
        detail: "Check-in times, transfers, cancellation windows, and status.",
        status: "3",
      },
      {
        title: "Live reminders",
        detail: "Upcoming hotel and restaurant sessions matched to wishlist.",
        status: "5",
      },
    ],
    tabs: [
      {
        label: "Trips",
        items: [
          {
            title: "Uluwatu cliff villa",
            detail: "Transfer, check-in, and room preference are confirmed.",
            status: "Confirmed",
          },
          {
            title: "Sanur wellness hotel",
            detail: "Spa add-on pending after verified replay comparison.",
            status: "Pending",
          },
          {
            title: "Komodo experience",
            detail: "Private route requires group quote confirmation.",
            status: "Quote",
          },
        ],
      },
      {
        label: "Replays",
        items: [
          {
            title: "Ocean suite walkthrough",
            detail: "Most watched section: balcony privacy and sunset angle.",
            status: "6:42",
          },
          {
            title: "Chef tasting",
            detail: "Dietary notes added to the dinner reservation draft.",
            status: "Saved",
          },
          {
            title: "Spa inspection",
            detail: "Therapist Q&A matches the wellness stay preferences.",
            status: "Match",
          },
        ],
      },
      {
        label: "Reviews",
        items: [
          {
            title: "Verified stay proof",
            detail: "Reviews include stay dates, room type, and booking channel.",
            status: "On",
          },
          {
            title: "Saved review note",
            detail: "Breakfast queue concern pinned to the Sanur hotel card.",
            status: "Pinned",
            tone: "warm",
          },
          {
            title: "Trusted shortlist",
            detail: "Eight hotels pass the live proof and review threshold.",
            status: "8",
          },
        ],
      },
    ],
    activity: [
      {
        title: "Booking status",
        detail: "Two stays confirmed and one quote awaiting host response.",
        status: "Clear",
      },
      {
        title: "Live reminder",
        detail: "Villa breakfast Q&A starts at 15:30.",
        status: "Today",
      },
      {
        title: "Wishlist update",
        detail: "AI grouped saved hotels by privacy, dining, and transfer ease.",
        status: "Done",
      },
    ],
    analytics: [
      { label: "Trip readiness", value: "96%", width: 96 },
      { label: "Wishlist match", value: "82%", width: 82 },
      { label: "Replay coverage", value: "74%", width: 74 },
      { label: "Booking risk", value: "8%", width: 8 },
    ],
    quickActions: ["Compare hotels", "Open replay", "Update wishlist", "Check booking"],
  },
  {
    kind: "procurement",
    name: "AI Procurement",
    href: "/dashboard/main",
    eyebrow: "AI procurement OS",
    headline: "Sourcing intelligence, RFQ automation, negotiation, and risk.",
    summary:
      "Procurement teams get an AI-native workspace for sourcing assistance, procurement analytics, RFQ generation, supplier recommendations, live negotiations, logistics insights, and procurement risk alerts.",
    command: "Ask Buyamia AI to generate RFQs and compare supplier risk",
    heroImage:
      "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=1500&q=88",
    trustScore: "93",
    healthLabel: "Risk under control",
    metrics: [
      { label: "AI sourcing", value: "286", delta: "Active workflow signals" },
      { label: "RFQ generation", value: "48", delta: "18 ready to send" },
      { label: "Supplier recs", value: "124", delta: "12 markets ranked" },
      { label: "Risk alerts", value: "24", delta: "8 high priority", tone: "dark" },
    ],
    priority: [
      {
        title: "Outdoor furniture sourcing",
        detail: "AI recommends three verified suppliers with balanced MOQ and lead time.",
        status: "Ranked",
      },
      {
        title: "Live negotiation",
        detail: "Counter-offer suggests quantity split, warranty extension, and CIF terms.",
        status: "Assist",
        tone: "live",
      },
      {
        title: "Document risk",
        detail: "Two export packs are missing updated production photos.",
        status: "High",
        tone: "risk",
      },
    ],
    widgets: [
      {
        title: "AI sourcing assistant",
        detail: "Translate conversations, summarize intent, and create sourcing briefs.",
        status: "On",
      },
      {
        title: "Procurement analytics",
        detail: "RFQ conversion, landed cost, buyer intent, and supplier SLA.",
        status: "Live",
      },
      {
        title: "Supplier recommendations",
        detail: "Rank by audit, docs, MOQ fit, lead time, and hotel references.",
        status: "124",
      },
      {
        title: "Live negotiations",
        detail: "Counter-offer guidance based on quantity, risk, and lead time.",
        status: "6",
      },
      {
        title: "Logistics insights",
        detail: "Instant, scheduled, standard, and container strategy guidance.",
        status: "Ready",
      },
      {
        title: "Risk alerts",
        detail: "Missing docs, capacity pressure, unusual terms, and payment exposure.",
        status: "24",
      },
    ],
    tabs: [
      {
        label: "Assistant",
        items: [
          {
            title: "Translate supplier conversation",
            detail: "Live multilingual context is structured into procurement notes.",
            status: "Auto",
          },
          {
            title: "Generate RFQ",
            detail: "Specs, MOQ, incoterms, payment, docs, and warranty drafted.",
            status: "Draft",
          },
          {
            title: "Estimate landed cost",
            detail: "Product, freight, duties, lead time, and risk are modeled.",
            status: "Model",
          },
        ],
      },
      {
        label: "Analytics",
        items: [
          {
            title: "RFQ conversion",
            detail: "Supplier quote performance is improving week over week.",
            status: "18.4%",
          },
          {
            title: "Buyer intent",
            detail: "Live questions and replay moments identify active demand.",
            status: "71%",
          },
          {
            title: "Automation",
            detail: "AI recaps, RFQ drafts, and quote routing are ready.",
            status: "93%",
          },
        ],
      },
      {
        label: "Risk",
        items: [
          {
            title: "Capacity pressure",
            detail: "June teak schedule is near capacity for two suppliers.",
            status: "Watch",
            tone: "warm",
          },
          {
            title: "Warranty terms",
            detail: "Outdoor finish warranty needs legal approval before deposit.",
            status: "Review",
          },
          {
            title: "Escrow exposure",
            detail: "Five milestones are open across protected payment workflows.",
            status: "$38K",
          },
        ],
      },
    ],
    activity: [
      {
        title: "Supplier shortlist",
        detail: "Three suppliers meet audit, MOQ, and shipping constraints.",
        status: "Ready",
      },
      {
        title: "RFQ pack",
        detail: "AI prepared quote structure and required document checklist.",
        status: "Draft",
      },
      {
        title: "Logistics route",
        detail: "Container strategy beats scheduled delivery for the mixed order.",
        status: "Save 8%",
      },
    ],
    analytics: [
      { label: "Revenue quality", value: "84%", width: 84 },
      { label: "Buyer intent", value: "71%", width: 71 },
      { label: "Operational risk", value: "22%", width: 22 },
      { label: "AI automation", value: "93%", width: 93 },
    ],
    quickActions: ["Generate RFQ", "Rank suppliers", "Open negotiation", "Review risk"],
  },
];

const navItems = [
  { label: "Public discovery", href: "/", kind: "overview" },
  { label: "Main dashboard", href: "/dashboard/main", kind: "procurement" },
  { label: "Hotel dashboard", href: "/dashboard/hotel", kind: "hotel" },
  { label: "Restaurant dashboard", href: "/dashboard/restaurant", kind: "restaurant" },
  { label: "Supplier dashboard", href: "/dashboard/supplier", kind: "supplier" },
  { label: "Services dashboard", href: "/dashboard/services", kind: "services" },
  { label: "Viewer account", href: "/dashboard/viewer", kind: "traveler" },
] satisfies { label: string; href: string; kind: DashboardKind }[];

const platformModules: WorkItem[] = [
  {
    title: "Live commerce rooms",
    detail: "Supplier showcases, hotel walkthroughs, chef streams, customer reviews, and replay conversion.",
    status: "Live",
    tone: "live",
  },
  {
    title: "AI procurement OS",
    detail: "Sourcing assistant, RFQ generation, supplier recommendations, landed cost, and risk alerts.",
    status: "AI",
  },
  {
    title: "Trust and verification",
    detail: "Verified suppliers, real customer reviews, hotel references, documents, and trust scores.",
    status: "Proof",
  },
  {
    title: "Protected transactions",
    detail: "Escrow, contracts, warranty, Apple Pay, Stripe, wire, QR status, and delivery milestones.",
    status: "Secure",
  },
  {
    title: "Seller studio",
    detail: "Paid stream setup, vouchers, booking lives, free delivery rules, and account modes.",
    status: "Studio",
  },
  {
    title: "Experience marketplace",
    detail: "Hotels, restaurants, cafes, spas, tastings, travel experiences, and verified guest feedback.",
    status: "Growth",
  },
];

const publicCategories = [
  "All",
  "Live now",
  "Replays",
  "Pinned",
  "Rooms",
  "Hotels",
  "Restaurants",
  "Services",
  "Spa",
  "Food & Brunch",
  "Facilities",
  "Nearby",
  "Experiences",
];

const liveSessions = [
  {
    title: "Ocean suite walkthrough",
    category: "Hotels - Rooms",
    status: "Live",
    pinReason: "Featured by Buyamia",
    replayLabel: "Replay available for 5 days",
    expiry: "Expires in 5 days",
    provider: "Canggu boutique resort",
    tone: "live" as Tone,
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=86",
  },
  {
    title: "Spa treatment room preview",
    category: "Services - Spa",
    status: "Upcoming",
    pinReason: "Nearby",
    replayLabel: "Upcoming live",
    expiry: "Replay starts after validation",
    provider: "Uluwatu wellness spa",
    tone: "warm" as Tone,
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=86",
  },
  {
    title: "Beach brunch tasting",
    category: "Restaurants - Food & Brunch",
    status: "Replay",
    pinReason: "Most watched",
    replayLabel: "Replay available for 5 days",
    expiry: "Expires in 3 days",
    provider: "Seminyak supper club",
    tone: "default" as Tone,
    image:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=86",
  },
  {
    title: "Private driver arrival service",
    category: "Services - Nearby",
    status: "Pinned",
    pinReason: "Sponsored / paid pin",
    replayLabel: "Replay available for 5 days",
    expiry: "Expires in 2 days",
    provider: "Island Arrival Concierge",
    tone: "dark" as Tone,
    image:
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=900&q=86",
  },
];

const followedProviders = [
  {
    name: "Canggu boutique resort",
    category: "Hotel partner",
    status: "Following",
    nextLive: "Ocean suite Q&A tomorrow",
    replays: "4 available replays",
  },
  {
    name: "Seminyak supper club",
    category: "Restaurant",
    status: "Follow",
    nextLive: "Chef brunch live Friday",
    replays: "2 available replays",
  },
  {
    name: "Island Arrival Concierge",
    category: "Service provider",
    status: "Following",
    nextLive: "Airport pickup walkthrough",
    replays: "1 replay expires in 2 days",
  },
];

const replayPolicies: WorkItem[] = [
  {
    title: "Replay available for 5 days",
    detail: "Default replay window keeps public discovery useful while controlling storage.",
    status: "5 days",
  },
  {
    title: "Extend replay availability",
    detail: "Paid extension is represented as a placeholder option, not a real payment flow.",
    status: "Paid option",
    tone: "warm",
  },
  {
    title: "Storage optimized",
    detail: "Expired replays are flagged for cleanup instead of accumulating cloud cost.",
    status: "Optimized",
  },
];

const howItWorks = [
  "Watch real live experiences",
  "Verify the place or supplier",
  "Book, source or request access",
];

const connectedWorkflows: WorkItem[] = [
  {
    title: "Main dashboard",
    detail: "Platform overview for live performance, workflow routing, and partner health.",
    status: "Open",
  },
  {
    title: "Hotel dashboard",
    detail: "Client view and supplier / hotel partner view are separated.",
    status: "Open",
  },
  {
    title: "Restaurant dashboard",
    detail: "Chef lives, reservations, live orders, and diner trust.",
    status: "Open",
  },
  {
    title: "Supplier dashboard",
    detail: "Verified sourcing, quote packs, buyer intent, and shipments.",
    status: "Open",
  },
  {
    title: "Services dashboard",
    detail: "Generic service providers set up lives, verification, pins, and replay windows.",
    status: "New",
    tone: "live",
  },
  {
    title: "Sourcing and procurement",
    detail: "RFQs, approvals, contracts, escrow, and risk review.",
    status: "Platform",
    tone: "dark",
  },
];

export function DashboardPlatform({
  activeDashboard,
}: {
  activeDashboard: DashboardKind;
}) {
  const selectedDashboard =
    activeDashboard === "overview"
      ? undefined
      : dashboards.find((dashboard) => dashboard.kind === activeDashboard);

  return (
    <main className="min-h-dvh overflow-hidden bg-[#f3ecdc] text-[#1e2419]">
      <div className="grid min-h-dvh grid-rows-[auto_1fr] lg:grid-cols-[284px_minmax(0,1fr)] lg:grid-rows-1">
        <Sidebar activeDashboard={activeDashboard} />
        <div className="min-h-0 min-w-0 overflow-y-auto">
          <Topbar activeDashboard={selectedDashboard?.name ?? "Discover"} />
          {selectedDashboard ? (
            <DashboardAccessGate
              dashboardType={getDashboardApiType(selectedDashboard.kind)}
            >
              <DashboardDetail dashboard={selectedDashboard} />
            </DashboardAccessGate>
          ) : (
            <OverviewDashboard />
          )}
        </div>
      </div>
    </main>
  );
}

function Sidebar({ activeDashboard }: { activeDashboard: DashboardKind }) {
  return (
    <aside className="border-b border-[#d6cbb6] bg-[#fffaf0]/90 px-4 py-4 backdrop-blur-xl lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/buyamia-logo.svg"
          alt="Buyamia logo"
          width={42}
          height={42}
          className="size-10 rounded-full shadow-sm"
          priority
        />
        <div>
          <p className="text-sm font-semibold tracking-wide">Buyamia</p>
          <p className="text-xs text-[#766e5e]">AI commerce OS</p>
        </div>
      </Link>

      <div className="mt-5 rounded-2xl border border-[#d6cbb6] bg-[#f6efe2] p-3">
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
          Left side: back-end
        </p>
        <p className="mt-1 text-xs leading-5 text-[#766e5e]">
          Main, hotel, restaurant, supplier, and services tools.
        </p>
      </div>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1.5 lg:overflow-visible lg:pb-0">
        {navItems.map((item) => (
          <Link
            key={item.kind}
            href={item.href}
            className={`flex min-w-fit items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${
              activeDashboard === item.kind
                ? "bg-[#1e2419] text-[#fffaf0] shadow-lg shadow-[#8a7d61]/12"
                : "bg-[#f3ecdc] text-[#675f50] hover:bg-[#efe5d2] hover:text-[#1e2419]"
            }`}
          >
            <span>{item.label}</span>
            <span
              className={`ml-4 hidden size-2 rounded-full lg:block ${
                activeDashboard === item.kind ? "bg-[#cbd8a7]" : "bg-[#cabda4]"
              }`}
            />
          </Link>
        ))}
      </nav>

      <div className="mt-5 hidden rounded-2xl border border-[#d6cbb6] bg-[#f6efe2] p-4 lg:block">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
            Platform health
          </p>
          <span className="rounded-full bg-[#dfe7c7] px-2.5 py-1 text-[11px] font-black text-[#44512f]">
            Live
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold">99.98%</p>
        <p className="mt-1 text-xs leading-5 text-[#766e5e]">
          Live rooms, RFQs, escrow, reviews, and analytics are operating normally.
        </p>
      </div>

      <div className="mt-3 hidden rounded-2xl bg-[#1e2419] p-4 text-[#fffaf0] lg:block">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#cbd8a7]">
          Right side: public-facing
        </p>
        <p className="mt-3 text-sm font-semibold">Browse, watch, details, follow</p>
        <p className="mt-1 text-xs leading-5 text-[#ded8ca]">
          Public live streams keep categories, pins, replay labels, and viewer subscriptions visible.
        </p>
        <Link
          href="/live"
          className="mt-4 inline-flex rounded-full bg-[#fffaf0] px-4 py-2 text-xs font-bold text-[#1e2419] transition hover:bg-white"
        >
          Open live room
        </Link>
      </div>
    </aside>
  );
}

function Topbar({ activeDashboard }: { activeDashboard: string }) {
  const isPublicHome = activeDashboard === "Discover";

  return (
    <header className="sticky top-0 z-20 border-b border-[#d6cbb6] bg-[#f3ecdc]/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="grid gap-3 xl:grid-cols-[minmax(180px,.55fr)_minmax(280px,1fr)_auto] xl:items-center">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
            {isPublicHome ? "Public experience" : "Enterprise workspace"}
          </p>
          <h1 className="font-serif text-2xl leading-tight sm:text-3xl">
            {isPublicHome ? "Buyamia live access" : `${activeDashboard} dashboard`}
          </h1>
        </div>
        <form className="flex min-w-0 items-center gap-2 rounded-2xl border border-[#d6cbb6] bg-[#fffaf0]/86 px-3 py-2 shadow-sm">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#edf2dd] text-sm font-black text-[#596540]">
            {isPublicHome ? "B" : "AI"}
          </span>
          <input
            aria-label="Ask Buyamia AI"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#1e2419] outline-none placeholder:text-[#8a8170]"
            placeholder={
              isPublicHome
                ? "Search hotels, rooms, food, spa, or live experiences"
                : "Ask Buyamia AI about RFQs, bookings, trust, risk, or live performance"
            }
          />
          <span className="hidden rounded-full bg-[#f3ecdc] px-3 py-1 text-xs font-bold text-[#766e5e] sm:inline-flex">
            Cmd K
          </span>
        </form>
        <div className="flex flex-wrap gap-2 xl:justify-end">
          <Link
            href="/live"
            className="rounded-full border border-[#cabda4] bg-[#fffaf0]/76 px-4 py-2 text-sm font-bold text-[#1e2419] transition hover:bg-white"
          >
            Explore live streams
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[#6f7f4f] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#596540]"
          >
            {isPublicHome ? "Create account" : "Create account"}
          </Link>
        </div>
      </div>
    </header>
  );
}

function OverviewDashboard() {
  return (
    <section className="px-4 py-6 sm:px-6 lg:px-8">
      <PublicHero />
      <BrowseCategories />
      <LiveNow />
      <PinnedLives />
      <ViewerSubscriptions />
      <HowItWorks />
      <ConnectedPlatform />
    </section>
  );
}

function PublicHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#d6cbb6] bg-[#1e2419] p-5 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12 sm:p-8">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-45"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(30,36,25,.04), rgba(30,36,25,.24) 42%, rgba(30,36,25,.92)), url(https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1700&q=88)",
        }}
      />
      <div className="relative z-10 flex min-h-[500px] flex-col justify-end">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-[#cbd8a7]">
            Buyamia live hospitality commerce
          </p>
          <h2 className="mt-4 max-w-4xl font-serif text-4xl leading-[1.04] sm:text-6xl">
            Discover verified hotels, rooms, food and experiences through live access.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#ded8ca]">
            Watch real places, compare trusted details, and move from discovery
            to booking or partner access without the noise.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/live"
              className="rounded-full bg-[#fffaf0] px-6 py-3 text-center text-sm font-bold text-[#1e2419] transition hover:bg-white"
            >
              Explore live streams
            </Link>
            <a
              href="/signup"
              className="rounded-full border border-white/20 bg-white/[.08] px-6 py-3 text-center text-sm font-bold text-[#fffaf0] backdrop-blur-xl transition hover:bg-white/[.14]"
            >
              Create account
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function BrowseCategories() {
  return (
    <section className="py-14">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#6f7f4f]">Browse</p>
          <h2 className="font-serif text-3xl leading-tight">Browse by category</h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[#675f50]">
          Start with what you want to see, then watch live or go deeper.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {publicCategories.map((category) => (
          <a
            key={category}
            href="#live-now"
            className="rounded-full border border-[#d6cbb6] bg-[#fffaf0] px-4 py-3 text-center text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
          >
            {category}
          </a>
        ))}
      </div>
    </section>
  );
}

function LiveNow() {
  return (
    <section id="live-now" className="py-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#6f7f4f]">Live now</p>
          <h2 className="font-serif text-3xl leading-tight">Watch before you decide</h2>
        </div>
        <Link href="/live" className="text-sm font-bold text-[#596540]">
          View all streams -&gt;
        </Link>
      </div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {["All", "Hotels", "Restaurants", "Services", "Nearby", "Live now", "Replays", "Pinned"].map(
          (filter) => (
            <a
              key={filter}
              href="#live-now"
              className="min-w-fit rounded-full bg-[#fffaf0] px-3.5 py-2 text-xs font-bold text-[#596540] shadow-sm transition hover:bg-white"
            >
              {filter}
            </a>
          ),
        )}
      </div>
      <div className="grid gap-5 xl:grid-cols-4">
        {liveSessions.map((session) => (
          <article
            key={session.title}
            className="overflow-hidden rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] shadow-sm"
          >
            <div
              className="relative min-h-56 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(30,36,25,.02), rgba(30,36,25,.5)), url(${session.image})`,
              }}
            >
              <div className="absolute left-4 top-4">
                <StatusChip label={session.status} tone={session.tone} compact />
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm font-semibold text-[#6f7f4f]">
                {session.category}
              </p>
              <h3 className="mt-2 text-xl font-semibold">{session.title}</h3>
              <p className="mt-1 text-sm text-[#675f50]">{session.provider}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusChip label={session.pinReason} tone={session.tone} compact />
                <StatusChip label={session.expiry} compact />
              </div>
              <p className="mt-3 text-xs font-bold text-[#6f7f4f]">
                {session.replayLabel}
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/live"
                  className="rounded-full bg-[#1e2419] px-4 py-3 text-center text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540]"
                >
                  Watch live
                </Link>
                <Link
                  href="/live"
                  className="rounded-full border border-[#cabda4] bg-[#f3ecdc] px-4 py-3 text-center text-sm font-bold text-[#1e2419] transition hover:bg-white"
                >
                  View details
                </Link>
                <button className="rounded-full border border-[#cabda4] bg-white px-4 py-3 text-center text-sm font-bold text-[#1e2419] transition hover:bg-[#f3ecdc]">
                  Follow
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PinnedLives() {
  return (
    <section className="py-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#6f7f4f]">Pinned discovery</p>
          <h2 className="font-serif text-3xl leading-tight">Why a live is featured</h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[#675f50]">
          Pins are labeled so viewers understand whether a stream is sponsored,
          nearby, most watched, or featured by Buyamia.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {["Sponsored / paid pin", "Nearby", "Most watched", "Featured by Buyamia"].map(
          (reason) => (
            <article
              key={reason}
              className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-4 shadow-sm"
            >
              <StatusChip label="Pinned" tone="live" compact />
              <h3 className="mt-4 text-lg font-semibold">{reason}</h3>
              <p className="mt-2 text-sm leading-6 text-[#675f50]">
                Mock placement reason shown on public live thumbnails and details.
              </p>
            </article>
          ),
        )}
      </div>
    </section>
  );
}

function ViewerSubscriptions() {
  return (
    <section className="py-8">
      <div className="rounded-3xl border border-[#d6cbb6] bg-[#e9dfcb] p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6f7f4f]">Viewer account</p>
            <h2 className="font-serif text-3xl leading-tight">Your subscriptions</h2>
          </div>
          <StatusChip label="Mock viewer state" />
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {followedProviders.map((provider) => (
            <article
              key={provider.name}
              className="rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-4"
            >
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                {provider.category}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{provider.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[#675f50]">
                {provider.nextLive}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#596540]">
                {provider.replays}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                <button className="rounded-full bg-[#1e2419] px-4 py-2.5 text-sm font-bold text-[#fffaf0]">
                  {provider.status}
                </button>
                <button className="rounded-full border border-[#cabda4] bg-[#f3ecdc] px-4 py-2.5 text-sm font-bold">
                  View replays
                </button>
                <button className="rounded-full border border-[#cabda4] bg-white px-4 py-2.5 text-sm font-bold">
                  Upcoming lives
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-14">
      <div className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-6 shadow-sm sm:p-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold text-[#6f7f4f]">How it works</p>
          <h2 className="mt-2 font-serif text-3xl leading-tight">
            Simple live proof, then action.
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {howItWorks.map((step, index) => (
            <div key={step} className="rounded-2xl bg-[#f3ecdc] p-5">
              <span className="text-sm font-bold text-[#6f7f4f]">
                0{index + 1}
              </span>
              <p className="mt-4 text-xl font-semibold">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ConnectedPlatform() {
  return (
    <section id="connected-platform" className="py-10">
      <div className="mb-7 max-w-3xl">
        <p className="text-sm font-semibold text-[#6f7f4f]">Connected platform</p>
        <h2 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">
          Public discovery connected to hotel, supplier and procurement tools.
        </h2>
        <p className="mt-4 text-sm leading-7 text-[#675f50]">
          The public experience stays simple. Teams still get the operating
          layer for dashboards, sourcing, procurement, verification and payments.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[.86fr_1.14fr]">
        <WorkflowPanel
          eyebrow="Back office"
          title="Partner workspaces"
          items={connectedWorkflows}
        />
        <WidgetGrid title="Platform modules" items={platformModules} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <RoleSwitcher />
        <QuickActions
          title="Platform shortcuts"
          actions={[
            "Open hotel dashboard",
            "Open services dashboard",
            "Open supplier dashboard",
            "Review replay expiration",
          ]}
        />
      </div>
    </section>
  );
}

function RoleSwitcher() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
      {dashboards.map((dashboard) => (
        <Link
          key={dashboard.kind}
          href={dashboard.href}
          className="group rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#8a7d61]/10"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                {dashboard.eyebrow}
              </p>
              <h2 className="mt-2 text-lg font-semibold">{dashboard.name}</h2>
            </div>
            <span className="rounded-full bg-[#edf2dd] px-3 py-1 text-xs font-black text-[#596540]">
              {dashboard.trustScore}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#675f50]">
            {dashboard.summary}
          </p>
          <div className="mt-3 flex items-center justify-between text-sm font-bold text-[#596540]">
            Open dashboard
            <span className="transition group-hover:translate-x-1">-&gt;</span>
          </div>
        </Link>
      ))}
    </section>
  );
}

function DashboardDetail({ dashboard }: { dashboard: Dashboard }) {
  const dashboardType = getDashboardApiType(dashboard.kind);

  return (
    <section className="px-4 py-5 sm:px-6 lg:px-8">
      <div className="grid gap-5 xl:grid-cols-[1.08fr_.92fr]">
        <DashboardHero dashboard={dashboard} />
        <WorkflowPanel
          eyebrow="Priority"
          title={`${dashboard.name} work queue`}
          items={dashboard.priority}
        />
      </div>

      <MetricGrid metrics={dashboard.metrics} />
      <DashboardApiPanels dashboardType={dashboardType} title={dashboard.name} />

      {dashboard.kind === "hotel" && <HotelAudienceSplit />}
      {dashboard.kind === "services" && <ServicesProviderSetup />}

      <div className="mt-5 grid gap-5 2xl:grid-cols-[1.12fr_.88fr]">
        <DashboardWorkbench dashboard={dashboard} />
        <div className="grid gap-5">
          <CompactAnalytics title={`${dashboard.name} analytics`} rows={dashboard.analytics} />
          <QuickActions title="Quick actions" actions={dashboard.quickActions} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <WidgetGrid title={`${dashboard.name} control modules`} items={dashboard.widgets} />
        <WorkflowPanel
          eyebrow="Activity"
          title="Recent automation"
          items={dashboard.activity}
          dark
        />
      </div>

      <ReplayExpirationManager />
    </section>
  );
}

function getDashboardApiType(kind: Dashboard["kind"]): DashboardType {
  if (kind === "procurement") {
    return "main";
  }

  if (kind === "traveler") {
    return "viewer";
  }

  return kind;
}

function HotelAudienceSplit() {
  const views: WorkItem[] = [
    {
      title: "Client view",
      detail: "Browse rooms, watch live walkthroughs, compare amenities, follow the hotel, and view available replays.",
      status: "Guest path",
      tone: "live",
    },
    {
      title: "Supplier / hotel partner view",
      detail: "Manage room lives, verification, booking signals, replay expiration, and paid promotion placeholders.",
      status: "Partner path",
      tone: "dark",
    },
  ];

  return (
    <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
            Hotel role clarity
          </p>
          <h2 className="mt-1 text-xl font-semibold">Choose the right hotel path</h2>
        </div>
        <StatusChip label="Client vs partner" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {views.map((view) => (
          <article key={view.title} className="rounded-2xl bg-[#f3ecdc] p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">{view.title}</h3>
              <StatusChip label={view.status} tone={view.tone} compact />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#675f50]">{view.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ServicesProviderSetup() {
  return (
    <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <div className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
              For service providers
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Set up a live for my service</h2>
          </div>
          <StatusChip label="UI mock" tone="warm" />
        </div>
        <div className="grid gap-3">
          <label className="rounded-2xl bg-[#f3ecdc] p-4">
            <span className="text-sm font-bold text-[#596540]">What service do you offer?</span>
            <input
              aria-label="Service offered"
              placeholder="Example: private transfer, spa treatment, guide, concierge"
              className="mt-3 w-full rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] px-4 py-3 text-sm outline-none"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Identity or license", "Insurance or certificate"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-dashed border-[#cabda4] bg-[#f6efe2] p-4"
              >
                <p className="font-semibold">{item}</p>
                <p className="mt-2 text-sm leading-6 text-[#675f50]">
                  Visual document transfer placeholder. Do not upload sensitive originals.
                </p>
              </div>
            ))}
          </div>
          <p className="rounded-2xl bg-[#edf2dd] p-4 text-sm font-semibold leading-6 text-[#44512f]">
            Documents will be verified before validation. This screen does not store real documents.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="rounded-2xl bg-[#f3ecdc] p-4">
              <span className="text-sm font-bold text-[#596540]">
                Replay expiration
              </span>
              <select
                aria-label="Replay expiration"
                className="mt-3 w-full rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] px-4 py-3 text-sm font-semibold outline-none"
                defaultValue="5"
              >
                <option value="3">Replay available for 3 days</option>
                <option value="5">Replay available for 5 days</option>
                <option value="7">Replay available for 7 days</option>
              </select>
            </label>
            <label className="rounded-2xl bg-[#f3ecdc] p-4">
              <span className="text-sm font-bold text-[#596540]">
                Pinned live option
              </span>
              <select
                aria-label="Pinned live option"
                className="mt-3 w-full rounded-2xl border border-[#d6cbb6] bg-[#fffaf0] px-4 py-3 text-sm font-semibold outline-none"
                defaultValue="featured_by_buyamia"
              >
                <option value="sponsored">Sponsored</option>
                <option value="nearby">Nearby</option>
                <option value="most_watched">Most watched</option>
                <option value="featured_by_buyamia">Featured by Buyamia</option>
              </select>
            </label>
          </div>
          <button className="w-full rounded-full bg-[#1e2419] px-5 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540]">
            Set up a live for my service
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-[#1e2419] bg-[#1e2419] p-5 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#cbd8a7]">
          Payment placeholder
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Organize or publish lives</h2>
        <p className="mt-3 text-sm leading-7 text-[#ded8ca]">
          Providers see a payment option for scheduling, publishing, or extending
          visibility. This is only interface copy until a real payment system is integrated.
        </p>
        <div className="mt-5 grid gap-3">
          {["Publish live slot", "Sponsor pinned placement", "Extend replay availability"].map(
            (option) => (
              <div
                key={option}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/[.07] p-4"
              >
                <span className="text-sm font-semibold">{option}</span>
                <span className="rounded-full bg-[#fffaf0]/12 px-3 py-1 text-xs font-bold text-[#cbd8a7]">
                  Mock pay
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function ReplayExpirationManager() {
  return (
    <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
            Replay expiration
          </p>
          <h2 className="mt-1 text-xl font-semibold">Storage-aware replay policy</h2>
        </div>
        <StatusChip label="Storage optimized" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {replayPolicies.map((policy) => (
          <MiniItem key={policy.title} item={policy} />
        ))}
      </div>
    </section>
  );
}

function DashboardHero({ dashboard }: { dashboard: Dashboard }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#d6cbb6] bg-[#1e2419] p-5 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12 sm:p-6">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(30,36,25,.08), rgba(30,36,25,.9)), url(${dashboard.heroImage})`,
        }}
      />
      <div className="relative z-10 grid min-h-[350px] content-between gap-6">
        <div className="flex flex-wrap gap-2">
          <StatusChip label="Live" tone="live" />
          <StatusChip label={dashboard.healthLabel} />
          <StatusChip label={`Trust ${dashboard.trustScore}`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#cbd8a7]">{dashboard.eyebrow}</p>
          <h2 className="mt-3 max-w-3xl font-serif text-3xl leading-tight sm:text-5xl">
            {dashboard.headline}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#ded8ca]">
            {dashboard.summary}
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.08] p-3 text-sm font-semibold text-[#fffaf0] backdrop-blur-xl">
            {dashboard.command}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardWorkbench({ dashboard }: { dashboard: Dashboard }) {
  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
            Role workspace
          </p>
          <h2 className="mt-1 text-xl font-semibold">Tabbed operations</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {dashboard.tabs.map((tab) => (
            <a
              key={tab.label}
              href={`#${dashboard.kind}-${tab.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="min-w-fit rounded-full bg-[#f3ecdc] px-3 py-2 text-xs font-bold text-[#596540] transition hover:bg-[#e8dfce]"
            >
              {tab.label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {dashboard.tabs.map((tab) => (
          <div
            key={tab.label}
            id={`${dashboard.kind}-${tab.label.toLowerCase().replace(/\s+/g, "-")}`}
            className="rounded-2xl bg-[#f3ecdc] p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold">{tab.label}</h3>
              <span className="rounded-full bg-[#fffaf0] px-2.5 py-1 text-[11px] font-black text-[#596540]">
                {tab.items.length}
              </span>
            </div>
            <div className="grid gap-2">
              {tab.items.map((item) => (
                <MiniItem key={item.title} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className={`rounded-2xl border p-4 shadow-sm ${cardTone(metric.tone)}`}
        >
          <p
            className={`text-[11px] font-bold uppercase tracking-[.14em] ${
              metric.tone === "dark" ? "text-[#cbd8a7]" : "text-[#6f7f4f]"
            }`}
          >
            {metric.label}
          </p>
          <p className="mt-3 text-3xl font-semibold">{metric.value}</p>
          <p
            className={`mt-1 text-xs ${
              metric.tone === "dark" ? "text-[#ded8ca]" : "text-[#766e5e]"
            }`}
          >
            {metric.delta}
          </p>
        </article>
      ))}
    </div>
  );
}

function WorkflowPanel({
  eyebrow,
  title,
  items,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  items: WorkItem[];
  dark?: boolean;
}) {
  return (
    <section
      className={`rounded-3xl border p-5 shadow-sm ${
        dark
          ? "border-[#1e2419] bg-[#1e2419] text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12"
          : "border-[#d6cbb6] bg-[#fffaf0]"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-[11px] font-bold uppercase tracking-[.16em] ${
              dark ? "text-[#cbd8a7]" : "text-[#6f7f4f]"
            }`}
          >
            {eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-semibold">{title}</h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            dark ? "bg-[#fffaf0]/12 text-[#cbd8a7]" : "bg-[#f3ecdc] text-[#596540]"
          }`}
        >
          {items.length} items
        </span>
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.title}
            className={`rounded-2xl p-4 ${dark ? "bg-white/[.06]" : "bg-[#f3ecdc]"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p
                  className={`mt-1 text-sm leading-6 ${
                    dark ? "text-[#ded8ca]" : "text-[#675f50]"
                  }`}
                >
                  {item.detail}
                </p>
              </div>
              <StatusChip label={item.status} tone={item.tone} compact />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WidgetGrid({ title, items }: { title: string; items: WorkItem[] }) {
  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
            Modules
          </p>
          <h2 className="mt-1 text-xl font-semibold">{title}</h2>
        </div>
        <span className="rounded-full bg-[#f3ecdc] px-3 py-1 text-xs font-bold text-[#596540]">
          {items.length}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.title} className="rounded-2xl bg-[#f3ecdc] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">{item.title}</p>
              <StatusChip label={item.status} tone={item.tone} compact />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#675f50]">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CompactAnalytics({ title, rows }: { title: string; rows: Signal[] }) {
  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
            Analytics
          </p>
          <h2 className="mt-1 text-lg font-semibold">{title}</h2>
        </div>
        <StatusChip label="Live" tone="live" compact />
      </div>
      <div className="grid gap-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl bg-[#f3ecdc] p-4">
            <div className="mb-2 flex justify-between text-sm font-semibold">
              <span>{row.label}</span>
              <span>{row.value}</span>
            </div>
            <div className="h-2 rounded-full bg-[#ded4c2]">
              <div
                className="h-2 rounded-full bg-[#6f7f4f]"
                style={{ width: `${row.width}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickActions({ title, actions }: { title: string; actions: string[] }) {
  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#e9dfcb] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
            Actions
          </p>
          <h2 className="mt-1 text-lg font-semibold">{title}</h2>
        </div>
        <span className="rounded-full bg-[#1e2419] px-3 py-1 text-xs font-bold text-[#fffaf0]">
          AI ready
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action}
            className="rounded-full border border-[#cabda4] bg-[#fffaf0]/74 px-4 py-3 text-left text-sm font-bold text-[#1e2419] transition hover:bg-white"
          >
            {action}
          </button>
        ))}
      </div>
    </section>
  );
}

function MiniItem({ item }: { item: WorkItem }) {
  return (
    <article className="rounded-xl bg-[#fffaf0] p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{item.title}</p>
        <StatusChip label={item.status} tone={item.tone} compact />
      </div>
      <p className="mt-2 text-xs leading-5 text-[#675f50]">{item.detail}</p>
    </article>
  );
}

function StatusChip({
  label,
  tone = "default",
  compact = false,
}: {
  label: string;
  tone?: Tone;
  compact?: boolean;
}) {
  const toneClass =
    tone === "live"
      ? "bg-[#b85438] text-white"
      : tone === "risk"
        ? "bg-[#f0d5c8] text-[#8c3f2b]"
        : tone === "warm"
          ? "bg-[#efe0bf] text-[#6c5730]"
          : tone === "dark"
            ? "bg-[#1e2419] text-[#fffaf0]"
      : "bg-[#edf2dd] text-[#596540]";

  return (
    <span
      className={`min-w-fit rounded-full font-black ${
        compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs"
      } ${toneClass}`}
    >
      {label}
    </span>
  );
}

function cardTone(tone: Tone = "default") {
  if (tone === "dark") {
    return "border-[#1e2419] bg-[#1e2419] text-[#fffaf0]";
  }

  if (tone === "warm") {
    return "border-[#d6cbb6] bg-[#e9dfcb]";
  }

  if (tone === "live") {
    return "border-[#d9b2a3] bg-[#fff3ed]";
  }

  if (tone === "risk") {
    return "border-[#d9b2a3] bg-[#f2d9cf]";
  }

  return "border-[#d6cbb6] bg-[#fffaf0]";
}
