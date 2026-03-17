"use client";

import { useMemo, useState } from "react";
import type { Grape } from "@/app/admin/(cms)/grapes/actions";
import {
  ListPanelHeader,
  STATUS_FILTER_OPTIONS,
  DEFAULT_STATUS_FILTER,
} from "@/components/admin/ListPanelHeader";

type Props = {
  grapes: Grape[];
  search: string;
  onSearchChange: (v: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
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

export function GrapesList({ grapes, search, onSearchChange, selectedId, onSelect, onNew }: Props) {
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = grapes;
    if (q) {
      list = list.filter(
        (g) =>
          g.name_fr.toLowerCase().includes(q) ||
          g.name_en?.toLowerCase().includes(q) ||
          g.slug.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((g) => g.status === statusFilter);
    }
    return list;
  }, [grapes, search, statusFilter]);

  const statusFilterConfig = {
    key: "status",
    label: "Status",
    value: statusFilter,
    options: [...STATUS_FILTER_OPTIONS],
    onChange: setStatusFilter,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col border-r border-slate-200 bg-white">
      <ListPanelHeader
        searchPlaceholder="Search grapes..."
        searchValue={search}
        onSearchChange={onSearchChange}
        filters={[statusFilterConfig]}
        onNew={onNew}
      />
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="w-10 pl-4 pr-1 py-2 font-medium" aria-label="Status" />
              <th className="p-2 font-medium">name_fr</th>
              <th className="p-2 font-medium">type</th>
              <th className="p-2 font-medium">origin_country</th>
              <th className="p-2 font-medium">updated_at</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr
                key={g.id}
                onClick={() => onSelect(g.id)}
                className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                  selectedId === g.id ? "bg-slate-100" : ""
                }`}
              >
                <td className="pl-4 pr-1 py-2">
                  <StatusDot status={g.status} />
                </td>
                <td className="p-2 font-medium text-slate-900">{g.name_fr}</td>
                <td className="p-2 text-slate-600">{g.type ?? "—"}</td>
                <td className="p-2 text-slate-600">{g.origin_country ?? "—"}</td>
                <td className="p-2 text-slate-500">{formatDate(g.updated_at)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-sm text-slate-500">
                  {grapes.length === 0 ? "No grapes yet." : "No match for search or filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
