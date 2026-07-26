"use client";

import { type ReactNode, useState } from "react";

export function FeaturedSupplierSessionTabs({
  tabs,
}: {
  tabs: { id: string; label: string; content: ReactNode }[];
}) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");
  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Featured supplier session categories">
        {tabs.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`featured-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-fit rounded-full bg-[#fffaf0] px-3.5 py-2 text-xs font-bold text-[#596540] shadow-sm transition hover:bg-white ${selected ? "ring-2 ring-[#6f7f4f]" : ""}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div id={`featured-panel-${activeTab}`} role="tabpanel">
        {activeContent}
      </div>
    </>
  );
}
