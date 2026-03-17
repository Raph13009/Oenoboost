"use client";

import { useMemo, useState } from "react";
import type { SoilType } from "@/app/admin/(cms)/soil-types/actions";
import { SoilTypesList } from "./SoilTypesList";
import { SoilTypeEditor } from "./SoilTypeEditor";

type Props = {
  soilTypes: SoilType[];
};

export function SoilTypesView({ soilTypes }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);

  const selectedSoilType = useMemo(() => {
    if (selectedId === null || selectedId === "new") return null;
    return soilTypes.find((s) => s.id === selectedId) ?? null;
  }, [soilTypes, selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 w-[420px] shrink-0 flex-col overflow-hidden">
        <SoilTypesList
          soilTypes={soilTypes}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId === "new" ? null : selectedId}
          onSelect={setSelectedId}
          onNew={() => setSelectedId("new")}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {selectedId !== null ? (
          <SoilTypeEditor
            soilType={selectedId === "new" ? null : selectedSoilType}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Select a soil type or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}

