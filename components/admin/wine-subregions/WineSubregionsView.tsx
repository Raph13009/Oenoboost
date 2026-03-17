"use client";

import { useState, useMemo } from "react";
import type { WineSubregion } from "@/app/admin/(cms)/wine-subregions/actions";
import type { WineRegion } from "@/app/admin/(cms)/wine-regions/actions";
import { SubregionsList } from "./SubregionsList";
import { SubregionEditor } from "./SubregionEditor";

type Props = {
  subregions: WineSubregion[];
  regions: WineRegion[];
};

export function WineSubregionsView({ subregions, regions }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);

  const selectedSubregion = useMemo(() => {
    if (selectedId === null || selectedId === "new") return null;
    return subregions.find((r) => r.id === selectedId) ?? null;
  }, [subregions, selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 w-[420px] shrink-0 flex-col overflow-hidden">
        <SubregionsList
          subregions={subregions}
          regions={regions}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId === "new" ? null : selectedId}
          onSelect={setSelectedId}
          onNew={() => setSelectedId("new")}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {selectedId !== null ? (
          <SubregionEditor
            subregion={selectedId === "new" ? null : selectedSubregion}
            regions={regions}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Select a subregion or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}
