"use client";

import { useState, useMemo } from "react";
import type { WineRegion } from "@/app/admin/(cms)/wine-regions/actions";
import { RegionsList } from "./RegionsList";
import { RegionEditor } from "./RegionEditor";

type Props = {
  regions: WineRegion[];
};

export function WineRegionsView({ regions }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);

  const selectedRegion = useMemo(() => {
    if (selectedId === null || selectedId === "new") return null;
    return regions.find((r) => r.id === selectedId) ?? null;
  }, [regions, selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 w-[420px] shrink-0 flex-col overflow-hidden">
        <RegionsList
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
          <RegionEditor
            region={selectedId === "new" ? null : selectedRegion}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Select a region or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}
