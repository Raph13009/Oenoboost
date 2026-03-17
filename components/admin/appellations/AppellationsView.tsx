"use client";

import { useMemo, useState } from "react";
import type { Appellation } from "@/app/admin/(cms)/appellations/actions";
import type { WineRegion } from "@/app/admin/(cms)/wine-regions/actions";
import type { WineSubregion } from "@/app/admin/(cms)/wine-subregions/actions";
import { AppellationsList } from "./AppellationsList";
import { AppellationEditor } from "./AppellationEditor";

type Props = {
  appellations: Appellation[];
  regions: WineRegion[];
  subregions: WineSubregion[];
};

export function AppellationsView({ appellations, regions, subregions }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);

  const selectedAppellation = useMemo(() => {
    if (selectedId === null || selectedId === "new") return null;
    return appellations.find((a) => a.id === selectedId) ?? null;
  }, [appellations, selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 w-[420px] shrink-0 flex-col overflow-hidden">
        <AppellationsList
          appellations={appellations}
          regions={regions}
          subregions={subregions}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId === "new" ? null : selectedId}
          onSelect={setSelectedId}
          onNew={() => setSelectedId("new")}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {selectedId !== null ? (
          <AppellationEditor
            appellation={selectedId === "new" ? null : selectedAppellation}
            regions={regions}
            subregions={subregions}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Select an appellation or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}

