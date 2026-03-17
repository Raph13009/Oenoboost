"use client";

import { useMemo, useState } from "react";
import type { Grape } from "@/app/admin/(cms)/grapes/actions";
import { GrapesList } from "./GrapesList";
import { GrapeEditor } from "./GrapeEditor";

type Props = {
  grapes: Grape[];
};

export function GrapesView({ grapes }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);

  const selectedGrape = useMemo(() => {
    if (selectedId === null || selectedId === "new") return null;
    return grapes.find((g) => g.id === selectedId) ?? null;
  }, [grapes, selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 w-[420px] shrink-0 flex-col overflow-hidden">
        <GrapesList
          grapes={grapes}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId === "new" ? null : selectedId}
          onSelect={setSelectedId}
          onNew={() => setSelectedId("new")}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {selectedId !== null ? (
          <GrapeEditor
            grape={selectedId === "new" ? null : selectedGrape}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Select a grape or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}
