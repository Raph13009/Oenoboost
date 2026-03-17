"use client";

import { ChevronDown, Plus } from "lucide-react";

/** Reusable status filter options for list panels. */
export const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
] as const;

export const DEFAULT_STATUS_FILTER = "all";

export type FilterConfig = {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

type Props = {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterConfig[];
  onNew: () => void;
};

export function ListPanelHeader({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters = [],
  onNew,
}: Props) {
  return (
    <div className="shrink-0 border-b border-slate-200 px-3 py-2">
      <div className="flex items-center">
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-full rounded border border-slate-200 px-2.5 text-sm focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200"
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {filters.map((f) => (
            <div key={f.key} className="relative shrink-0">
              <select
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                className="h-8 appearance-none rounded border border-slate-200 bg-white pl-2.5 pr-7 text-sm text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200"
                aria-label={f.label}
              >
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onNew}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="New"
          title="New"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
