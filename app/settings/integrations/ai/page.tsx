import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/backend/auth-context";
import { commandsForRole, getAssistantIntegrationStatus } from "@/lib/backend/assistant-service";

export const metadata: Metadata = {
  title: "AI Integration Status",
  description: "Buyamia Assistant integration status and local assistant capabilities.",
};

export default async function AiIntegrationStatusPage() {
  const user = await getCurrentUser();
  const status = getAssistantIntegrationStatus();
  const commands = commandsForRole(user?.role ?? null);

  return (
    <main className="min-h-dvh bg-[#f3ecdc] text-[#1e2419]">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
            Integrations
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight">Buyamia Assistant status</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#675f50]">
            The assistant always works locally for command matching and database search. External provider keys are never exposed to the browser.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatusCard label="Current mode" value={status.mode === "provider" ? "Provider adapter" : "Local assistant"} />
            <StatusCard label="Provider configured" value={status.providerConfigured ? "Yes" : "No"} />
            <StatusCard label="Provider health" value={status.providerHealthy ? "Healthy" : "Not configured"} />
          </div>
        </div>

        <section className="mt-5 rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                Local capabilities
              </p>
              <h2 className="mt-1 text-xl font-semibold">Available commands for this session</h2>
            </div>
            <Link href="/dashboard/main" className="w-fit rounded-full border border-[#cabda4] bg-[#fffaf0] px-4 py-2 text-sm font-bold text-[#1e2419]">
              Back to dashboard
            </Link>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {commands.map((command) => (
              <Link key={command.id} href={command.href.startsWith("#") ? "/settings/integrations/ai" : command.href} className="rounded-2xl bg-[#f3ecdc] p-4 transition hover:bg-[#efe5d2]">
                <span className="block font-semibold">{command.title}</span>
                <span className="mt-1 block text-sm leading-6 text-[#675f50]">{command.description}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-[#1e2419] bg-[#1e2419] p-6 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#cbd8a7]">
            Secret handling
          </p>
          <h2 className="mt-1 text-xl font-semibold">No secrets are shown here</h2>
          <p className="mt-3 text-sm leading-7 text-[#ded8ca]">
            This page only reports whether a provider appears configured. It does not render API keys, tokens, or provider-specific secret values.
          </p>
        </section>
      </section>
    </main>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f3ecdc] p-4">
      <p className="text-[11px] font-black uppercase tracking-[.12em] text-[#6f7f4f]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
