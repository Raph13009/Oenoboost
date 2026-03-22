"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAppellation,
  type Appellation,
  type AppellationListItem,
} from "@/app/admin/(cms)/appellations/actions";
import { DrawerSkeleton, useDelayedBusy } from "@/components/admin/Loaders";
import { AppellationsList } from "./AppellationsList";
import { AppellationEditor } from "./AppellationEditor";
import { useTransition } from "react";

type Props = {
  appellations: AppellationListItem[];
  regions: Array<{ id: string; name_fr: string }>;
  subregions: Array<{ id: string; name_fr: string; region_id: string }>;
  soilTypes: Array<{ id: string; name_fr: string; slug: string }>;
  currentPage: number;
  hasPrev: boolean;
  hasNext: boolean;
  initialSearch: string;
};

export function AppellationsView({
  appellations,
  regions,
  subregions,
  soilTypes,
  currentPage,
  hasPrev,
  hasNext,
  initialSearch,
}: Props) {
  const [search, setSearch] = useState(initialSearch);
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [selectedAppellationData, setSelectedAppellationData] = useState<Appellation | null>(null);
  const [isLoadingAppellation, setIsLoadingAppellation] = useState(false);
  const [isNavigatingPage, startPageTransition] = useTransition();
  const router = useRouter();
  const showDrawerLoader = useDelayedBusy(isLoadingAppellation, 150);
  const showListLoader = useDelayedBusy(isNavigatingPage, 150);

  const onPageChange = (nextPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    if (search.trim()) params.set("q", search.trim());
    startPageTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const nextSearch = search.trim();
    const currentSearch = initialSearch.trim();
    if (nextSearch === currentSearch) return;
    const t = window.setTimeout(() => {
      const params = new URLSearchParams();
      params.set("page", "1");
      if (nextSearch) params.set("q", nextSearch);
      startPageTransition(() => {
        router.push(`?${params.toString()}`);
      });
    }, 300);
    return () => window.clearTimeout(t);
  }, [search, initialSearch, router, startPageTransition]);

  useEffect(() => {
    if (!hasNext) return;
    const params = new URLSearchParams();
    params.set("page", String(currentPage + 1));
    if (search.trim()) params.set("q", search.trim());
    router.prefetch(`?${params.toString()}`);
  }, [currentPage, hasNext, router, search]);

  useEffect(() => {
    let active = true;
    if (selectedId === null || selectedId === "new") {
      setSelectedAppellationData(null);
      setIsLoadingAppellation(false);
      return () => {
        active = false;
      };
    }
    setIsLoadingAppellation(true);
    getAppellation(selectedId)
      .then((appellation) => {
        if (!active) return;
        setSelectedAppellationData(appellation);
      })
      .finally(() => {
        if (!active) return;
        setIsLoadingAppellation(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden sm:w-[420px]">
        <AppellationsList
          appellations={appellations}
          regions={regions}
          subregions={subregions}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId === "new" ? null : selectedId}
          onSelect={setSelectedId}
          onNew={() => setSelectedId("new")}
          currentPage={currentPage}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPageChange={onPageChange}
          isLoadingList={showListLoader}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {selectedId === "new" ? (
          <AppellationEditor
            appellation={null}
            regions={regions}
            subregions={subregions}
            soilTypes={soilTypes}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null && isLoadingAppellation ? (
          showDrawerLoader ? (
            <DrawerSkeleton />
          ) : (
            <div className="h-full border-l border-slate-200 bg-white" />
          )
        ) : selectedId !== null && selectedAppellationData ? (
          <AppellationEditor
            appellation={selectedAppellationData}
            regions={regions}
            subregions={subregions}
            soilTypes={soilTypes}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Appellation not found.
          </div>
        ) : (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Select an appellation or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}
