"use client";

import { useMemo, useState, useEffect } from "react";
import type { AppellationListItem } from "@/app/admin/(cms)/appellations/actions";
import {
  DEFAULT_STATUS_FILTER,
  ListPanelHeader,
  STATUS_FILTER_OPTIONS,
} from "@/components/admin/ListPanelHeader";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TableSkeleton } from "@/components/admin/Loaders";

type Props = {
  appellations: AppellationListItem[];
  regions: Array<{ id: string; name_fr: string }>;
  subregions: Array<{ id: string; name_fr: string; region_id: string }>;
  search: string;
  onSearchChange: (v: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  currentPage: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
  isLoadingList?: boolean;
};

function formatDate(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "published"
      ? "bg-emerald-500"
      : status === "draft"
        ? "bg-amber-400"
        : "bg-slate-400";
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${color}`}
      title={status}
      aria-hidden
    />
  );
}

export function AppellationsList({
  appellations,
  regions,
  subregions,
  search,
  onSearchChange,
  selectedId,
  onSelect,
  onNew,
  currentPage,
  hasPrev,
  hasNext,
  onPageChange,
  isLoadingList = false,
}: Props) {
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);
  const [regionFilter, setRegionFilter] = useState("all");
  const [subregionFilter, setSubregionFilter] = useState("all");

  // Cascade: if region changes, ensure subregion stays valid.
  const subregionsForRegion = useMemo(() => {
    if (regionFilter === "all") return subregions;
    return subregions.filter((sr) => sr.region_id === regionFilter);
  }, [subregions, regionFilter]);

  useEffect(() => {
    if (subregionFilter === "all") return;
    const stillExists = subregionsForRegion.some((sr) => sr.id === subregionFilter);
    if (!stillExists) setSubregionFilter("all");
  }, [subregionFilter, subregionsForRegion]);

  const filtered = useMemo(() => {
    let list = appellations;
    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (regionFilter !== "all") {
      list = list.filter((a) => a.region_id === regionFilter);
    }
    if (subregionFilter !== "all") {
      list = list.filter((a) => a.subregion_id === subregionFilter);
    }
    return list;
  }, [appellations, search, statusFilter, regionFilter, subregionFilter]);

  const statusFilterConfig = {
    key: "status",
    label: "Status",
    value: statusFilter,
    options: [...STATUS_FILTER_OPTIONS],
    onChange: setStatusFilter,
  };

  const regionFilterConfig = {
    key: "region",
    label: "Region",
    value: regionFilter,
    options: [
      { value: "all", label: "All" },
      ...regions.map((r) => ({ value: r.id, label: r.name_fr })),
    ],
    onChange: setRegionFilter,
  };

  const subregionFilterConfig = {
    key: "subregion",
    label: "Subregion",
    value: subregionFilter,
    options: [
      { value: "all", label: "All" },
      ...subregionsForRegion.map((sr) => ({ value: sr.id, label: sr.name_fr })),
    ],
    onChange: setSubregionFilter,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col border-r border-slate-200 bg-white">
      <ListPanelHeader
        searchPlaceholder="Search appellations..."
        searchValue={search}
        onSearchChange={onSearchChange}
        filters={[statusFilterConfig, regionFilterConfig, subregionFilterConfig]}
        onNew={onNew}
      />
      <div className="flex flex-col items-start gap-2 border-b border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-medium text-slate-600">
          Page <span className="font-mono">{currentPage}</span>
        </div>
        <div className="flex w-full items-center justify-start gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrev}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNext}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className={`flex-1 overflow-hidden transition-opacity duration-200 ${isLoadingList ? "opacity-70" : "opacity-100"}`}>
        {isLoadingList ? (
          <TableSkeleton rows={8} columns={5} />
        ) : (
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="w-10 pl-4 pr-1 py-2 font-medium" aria-label="Status" />
              <th className="p-2 font-medium">name_fr</th>
              <th className="p-2 font-medium">subregion</th>
              <th className="p-2 font-medium">region</th>
              <th className="p-2 font-medium">updated_at</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr
                key={a.id}
                onClick={() => onSelect(a.id)}
                className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                  selectedId === a.id ? "bg-slate-100" : ""
                }`}
              >
                <td className="pl-4 pr-1 py-2">
                  <StatusDot status={a.status} />
                </td>
                <td className="p-2 font-medium text-slate-900">{a.name_fr}</td>
                <td className="p-2 text-slate-600">{a.subregion_name_fr ?? "—"}</td>
                <td className="p-2 text-slate-600">{a.region_name_fr ?? "—"}</td>
                <td className="p-2 text-slate-500">{formatDate(a.updated_at)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-sm text-slate-500">
                  {appellations.length === 0 ? "No appellations yet." : "No match for search or filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
