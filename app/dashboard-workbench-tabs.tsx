"use client";

import { useState, type ReactNode } from "react";

type WorkbenchTab = {
  id: string;
  label: string;
  content: ReactNode;
};

export function DashboardWorkbenchTabs({ tabs }: { tabs: WorkbenchTab[] }) {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "");
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  return (
    <section className="rounded-3xl border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
            Role workspace
          </p>
          <h2 className="mt-1 text-xl font-semibold">Tabbed operations</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Role workspace">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab?.id;

            return (
              <button
                key={tab.id}
                id={`${tab.id}-tab`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                onClick={() => setActiveTabId(tab.id)}
                className={`min-w-fit rounded-full px-3 py-2 text-xs font-bold transition ${
                  isActive
                    ? "bg-[#596540] text-[#fffaf0]"
                    : "bg-[#f3ecdc] text-[#596540] hover:bg-[#e8dfce]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab ? (
        <div
          id={`${activeTab.id}-panel`}
          role="tabpanel"
          aria-labelledby={`${activeTab.id}-tab`}
          className="rounded-2xl bg-[#f3ecdc] p-3"
        >
          {activeTab.content}
        </div>
      ) : null}
    </section>
  );
}
