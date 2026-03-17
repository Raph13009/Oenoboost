"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Appellation } from "@/app/admin/(cms)/appellations/actions";
import {
  createAppellation,
  deleteAppellation,
  updateAppellation,
} from "@/app/admin/(cms)/appellations/actions";
import type { WineRegion } from "@/app/admin/(cms)/wine-regions/actions";
import type { WineSubregion } from "@/app/admin/(cms)/wine-subregions/actions";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

const cardClass =
  "rounded-lg border border-slate-200 bg-slate-50/50 shadow-sm overflow-hidden";
const cardPadding = "p-3.5";
const sectionTitleClass = "text-xs font-semibold uppercase tracking-wider text-slate-600";
const labelClass = "block text-[11px] text-slate-500 mb-0.5";
const inputClass =
  "h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200";
const fieldSpacing = "space-y-2.5";

const CARD_STATE_KEY = "cms-appellations-card-state";

type CardState = {
  identity: boolean;
  production: boolean;
  editorial: boolean;
  flags: boolean;
  technical: boolean;
  metadata: boolean;
};

const defaultCardState: CardState = {
  identity: true,
  production: true,
  editorial: true,
  flags: true,
  technical: false,
  metadata: false,
};

function loadCardState(): CardState {
  if (typeof window === "undefined") return defaultCardState;
  try {
    const raw = localStorage.getItem(CARD_STATE_KEY);
    if (!raw) return defaultCardState;
    const parsed = JSON.parse(raw) as Partial<CardState>;
    return {
      identity: parsed.identity ?? defaultCardState.identity,
      production: parsed.production ?? defaultCardState.production,
      editorial: parsed.editorial ?? defaultCardState.editorial,
      flags: parsed.flags ?? defaultCardState.flags,
      // Always closed when entering the page (even if previously expanded).
      technical: false,
      metadata: false,
    };
  } catch {
    return defaultCardState;
  }
}

function saveCardState(state: CardState) {
  try {
    localStorage.setItem(CARD_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function CollapsibleCard({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className={cardClass}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 border-b border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-100/90"
      >
        <span className={sectionTitleClass}>{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
            open ? "" : "-rotate-90"
          }`}
          aria-hidden
        />
      </button>
      <div
        className="overflow-hidden transition-[max-height] duration-200 ease-out"
        style={{ maxHeight: open ? 2000 : 0 }}
      >
        <div className={cardPadding}>{children}</div>
      </div>
    </section>
  );
}

function AutoResizeTextarea({
  value,
  onChange,
  className,
  minRows = 2,
  ...props
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  minRows?: number;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const minHeight = minRows * 20;
  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(ta.scrollHeight, minHeight)}px`;
  }, [value, minHeight]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={minRows}
      className={className}
      style={{ overflow: "hidden" }}
      {...props}
    />
  );
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

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("fr-FR");
}

/** Searchable region dropdown: display name_fr, value id. Rendered in portal so it appears above cards. */
function RegionSelector({
  regions,
  value,
  onChange,
  disabled,
}: {
  regions: WineRegion[];
  value: string;
  onChange: (regionId: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = regions.find((r) => r.id === value);
  const filtered = q.trim()
    ? regions.filter((r) => r.name_fr.toLowerCase().includes(q.trim().toLowerCase()))
    : regions;

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    } else {
      setDropdownRect(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={triggerRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className="flex h-8 w-full items-center justify-between rounded border border-slate-200 bg-white px-2 text-left text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200 disabled:opacity-50"
      >
        <span className="min-w-0 truncate">{selected?.name_fr ?? "Select region…"}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      </button>
      {open &&
        dropdownRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            className="z-[100] max-h-56 overflow-auto rounded border border-slate-200 bg-white shadow-lg"
            style={{
              position: "fixed",
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
            }}
          >
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search region..."
              className="w-full border-b border-slate-200 px-2 py-1.5 text-sm focus:outline-none"
              autoFocus
            />
            <ul className="py-1">
              {filtered.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(r.id);
                      setOpen(false);
                      setQ("");
                    }}
                    className={`w-full px-2 py-1.5 text-left text-sm hover:bg-slate-50 ${
                      value === r.id ? "bg-slate-100 font-medium" : ""
                    }`}
                  >
                    {r.name_fr}
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-2 py-2 text-sm text-slate-500">No match</li>
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}

/** Searchable subregion dropdown: only show subregions from selected region. */
function SubregionSelector({
  subregions,
  value,
  onChange,
  disabled,
}: {
  subregions: WineSubregion[];
  value: string;
  onChange: (subregionId: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = subregions.find((sr) => sr.id === value);
  const filtered = q.trim()
    ? subregions.filter((sr) => sr.name_fr.toLowerCase().includes(q.trim().toLowerCase()))
    : subregions;

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    } else {
      setDropdownRect(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={triggerRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className="flex h-8 w-full items-center justify-between rounded border border-slate-200 bg-white px-2 text-left text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200 disabled:opacity-50"
      >
        <span className="min-w-0 truncate">{selected?.name_fr ?? "Select subregion…"}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      </button>
      {open &&
        dropdownRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            className="z-[100] max-h-56 overflow-auto rounded border border-slate-200 bg-white shadow-lg"
            style={{
              position: "fixed",
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
            }}
          >
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search subregion..."
              className="w-full border-b border-slate-200 px-2 py-1.5 text-sm focus:outline-none"
              autoFocus
            />
            <ul className="py-1">
              {filtered.map((sr) => (
                <li key={sr.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(sr.id);
                      setOpen(false);
                      setQ("");
                    }}
                    className={`w-full px-2 py-1.5 text-left text-sm hover:bg-slate-50 ${
                      value === sr.id ? "bg-slate-100 font-medium" : ""
                    }`}
                  >
                    {sr.name_fr}
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-2 py-2 text-sm text-slate-500">No match</li>
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}

type Props = {
  appellation: Appellation | null;
  regions: WineRegion[];
  subregions: WineSubregion[];
  onClose: () => void;
  onDeleted: () => void;
};

const emptyForm = (): Appellation => ({
  id: "",
  subregion_id: "",
  slug: "",
  name_fr: "",
  name_en: null,
  area_hectares: null,
  producer_count: null,
  production_volume_hl: null,
  price_range_min_eur: null,
  price_range_max_eur: null,
  history_fr: null,
  history_en: null,
  colors_grapes_fr: null,
  colors_grapes_en: null,
  soils_description_fr: null,
  soils_description_en: null,
  geojson: null,
  centroid_lat: null,
  centroid_lng: null,
  is_premium: false,
  status: "draft",
  published_at: null,
  created_at: "",
  updated_at: "",
  deleted_at: null,
});

export function AppellationEditor({ appellation, regions, subregions, onClose, onDeleted }: Props) {
  const router = useRouter();
  const isNew = !appellation?.id;
  const [form, setForm] = useState<Appellation>(() => appellation ?? emptyForm());

  useEffect(() => {
    setForm(appellation ?? emptyForm());
  }, [appellation?.id, appellation?.updated_at]);

  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cardState, setCardState] = useState<CardState>(defaultCardState);

  useEffect(() => {
    setCardState(loadCardState());
  }, []);

  const toggleCard = useCallback((key: keyof CardState) => {
    setCardState((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveCardState(next);
      return next;
    });
  }, []);

  const update = useCallback((updates: Partial<Appellation>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  // Cascade selector state: Region -> Subregion -> subregion_id
  const [regionId, setRegionId] = useState<string>("");

  // Prefill region when opening an appellation (based on its subregion relation).
  useEffect(() => {
    const subregionId = appellation?.subregion_id;
    if (!subregionId) {
      setRegionId("");
      return;
    }
    const sr = subregions.find((s) => s.id === subregionId);
    setRegionId(sr?.region_id ?? "");
  }, [appellation?.id, appellation?.subregion_id, subregions]);

  // If user picks a subregion, keep region in sync.
  useEffect(() => {
    if (!form.subregion_id) return;
    const sr = subregions.find((s) => s.id === form.subregion_id);
    if (sr?.region_id && sr.region_id !== regionId) setRegionId(sr.region_id);
  }, [form.subregion_id, subregions, regionId]);

  const subregionsForRegion = useMemo(() => {
    if (!regionId) return [];
    return subregions.filter((sr) => sr.region_id === regionId);
  }, [subregions, regionId]);

  useEffect(() => {
    if (!regionId) return;
    if (!form.subregion_id) return;
    const stillValid = subregionsForRegion.some((sr) => sr.id === form.subregion_id);
    if (!stillValid) update({ subregion_id: "" });
  }, [form.subregion_id, subregionsForRegion, update]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        subregion_id: form.subregion_id || null,
        area_hectares: form.area_hectares ?? null,
        producer_count: form.producer_count ?? null,
        production_volume_hl: form.production_volume_hl ?? null,
        price_range_min_eur: form.price_range_min_eur ?? null,
        price_range_max_eur: form.price_range_max_eur ?? null,
        centroid_lat: form.centroid_lat ?? null,
        centroid_lng: form.centroid_lng ?? null,
        history_fr: form.history_fr || null,
        history_en: form.history_en || null,
        colors_grapes_fr: form.colors_grapes_fr || null,
        colors_grapes_en: form.colors_grapes_en || null,
        soils_description_fr: form.soils_description_fr || null,
        soils_description_en: form.soils_description_en || null,
        geojson: form.geojson ?? null,
        published_at: form.published_at || null,
        is_premium: !!form.is_premium,
      };
      if (isNew) {
        const res = await createAppellation(payload);
        if (res.error) setError(res.error);
        else {
          router.refresh();
          onClose();
        }
      } else {
        const res = await updateAppellation(form.id, payload);
        if (res.error) setError(res.error);
        else {
          router.refresh();
          setSavedFeedback(true);
          setTimeout(() => setSavedFeedback(false), 1500);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (isNew) return;
    setError(null);
    setDeleting(true);
    try {
      const res = await deleteAppellation(form.id);
      if (res.error) setError(res.error);
      else {
        router.refresh();
        onDeleted();
        setDeleteModalOpen(false);
      }
    } finally {
      setDeleting(false);
    }
  };

  const panelTitle = form.name_fr?.trim() || form.name_en?.trim() || form.slug?.trim() || "New appellation";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
        <h2 className="min-w-0 truncate text-base font-semibold text-slate-900">{panelTitle}</h2>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-all duration-300 ${
              savedFeedback
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            }`}
          >
            {saving ? "Saving…" : savedFeedback ? "Saved ✓" : "Save"}
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              disabled={deleting}
              className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto p-3 space-y-4">
        <CollapsibleCard title="Identity" open={cardState.identity} onToggle={() => toggleCard("identity")}>
          <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label className={labelClass}>name_fr</label>
              <input value={form.name_fr} onChange={(e) => update({ name_fr: e.target.value })} className={inputClass} />
            </div>
            <div className="sm:col-span-1">
              <label className={labelClass}>name_en</label>
              <input
                value={form.name_en ?? ""}
                onChange={(e) => update({ name_en: e.target.value || null })}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>slug</label>
              <input value={form.slug} onChange={(e) => update({ slug: e.target.value })} className={inputClass} />
            </div>
            <div className="sm:col-span-1">
              <label className={labelClass}>region</label>
              <RegionSelector
                regions={regions}
                value={regionId}
                onChange={(id) => {
                  setRegionId(id);
                  update({ subregion_id: "" });
                }}
                disabled={regions.length === 0}
              />
            </div>
            <div className="sm:col-span-1">
              <label className={labelClass}>subregion</label>
              <SubregionSelector
                subregions={subregionsForRegion}
                value={form.subregion_id}
                onChange={(id) => update({ subregion_id: id })}
                disabled={!regionId || subregionsForRegion.length === 0}
              />
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Production / key metrics"
          open={cardState.production}
          onToggle={() => toggleCard("production")}
        >
          <div className={fieldSpacing}>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <div>
                <label className={labelClass}>area_hectares</label>
                <input
                  type="number"
                  value={form.area_hectares ?? ""}
                  onChange={(e) => update({ area_hectares: e.target.value === "" ? null : Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>producer_count</label>
                <input
                  type="number"
                  value={form.producer_count ?? ""}
                  onChange={(e) => update({ producer_count: e.target.value === "" ? null : Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>production_volume_hl</label>
                <input
                  type="number"
                  value={form.production_volume_hl ?? ""}
                  onChange={(e) =>
                    update({ production_volume_hl: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>price_range_min_eur</label>
                <input
                  type="number"
                  step="any"
                  value={form.price_range_min_eur ?? ""}
                  onChange={(e) =>
                    update({ price_range_min_eur: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>price_range_max_eur</label>
                <input
                  type="number"
                  step="any"
                  value={form.price_range_max_eur ?? ""}
                  onChange={(e) =>
                    update({ price_range_max_eur: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Editorial" open={cardState.editorial} onToggle={() => toggleCard("editorial")}>
          <div className={fieldSpacing}>
            <div>
              <label className={labelClass}>history_fr</label>
              <AutoResizeTextarea
                value={form.history_fr ?? ""}
                onChange={(e) => update({ history_fr: e.target.value || null })}
                minRows={2}
                className="min-h-[4rem] w-full resize-none rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200"
              />
            </div>
            <div>
              <label className={labelClass}>history_en</label>
              <AutoResizeTextarea
                value={form.history_en ?? ""}
                onChange={(e) => update({ history_en: e.target.value || null })}
                minRows={2}
                className="min-h-[4rem] w-full resize-none rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200"
              />
            </div>
            <div>
              <label className={labelClass}>colors_grapes_fr</label>
              <AutoResizeTextarea
                value={form.colors_grapes_fr ?? ""}
                onChange={(e) => update({ colors_grapes_fr: e.target.value || null })}
                minRows={2}
                className="min-h-[4rem] w-full resize-none rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200"
              />
            </div>
            <div>
              <label className={labelClass}>colors_grapes_en</label>
              <AutoResizeTextarea
                value={form.colors_grapes_en ?? ""}
                onChange={(e) => update({ colors_grapes_en: e.target.value || null })}
                minRows={2}
                className="min-h-[4rem] w-full resize-none rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200"
              />
            </div>
            <div>
              <label className={labelClass}>soils_description_fr</label>
              <AutoResizeTextarea
                value={form.soils_description_fr ?? ""}
                onChange={(e) => update({ soils_description_fr: e.target.value || null })}
                minRows={2}
                className="min-h-[4rem] w-full resize-none rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200"
              />
            </div>
            <div>
              <label className={labelClass}>soils_description_en</label>
              <AutoResizeTextarea
                value={form.soils_description_en ?? ""}
                onChange={(e) => update({ soils_description_en: e.target.value || null })}
                minRows={2}
                className="min-h-[4rem] w-full resize-none rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <div>
                <label className={labelClass}>status</label>
                <div className="relative flex h-8 w-full items-center rounded border border-slate-200 bg-white focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-slate-200">
                  <span className="pointer-events-none absolute left-2.5">
                    <StatusDot status={form.status} />
                  </span>
                  <select
                    value={form.status}
                    onChange={(e) => update({ status: e.target.value })}
                    className="h-full w-full flex-1 appearance-none rounded border-0 bg-transparent pl-7 pr-9 text-sm text-slate-900 focus:outline-none focus:ring-0"
                  >
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                    <option value="archived">archived</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400" aria-hidden />
                </div>
              </div>
              <div>
                <label className={labelClass}>published_at</label>
                <input
                  type="datetime-local"
                  value={form.published_at ? new Date(form.published_at).toISOString().slice(0, 16) : ""}
                  onChange={(e) =>
                    update({ published_at: e.target.value ? new Date(e.target.value).toISOString() : null })
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Flags" open={cardState.flags} onToggle={() => toggleCard("flags")}>
          <div className={fieldSpacing}>
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={!!form.is_premium}
                onChange={(e) => update({ is_premium: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span>is_premium</span>
            </label>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Technical data"
          open={cardState.technical}
          onToggle={() => toggleCard("technical")}
        >
          <dl className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2 text-xs">
            <div>
              <dt className={labelClass}>subregion_id</dt>
              <dd className="font-mono text-slate-800">{form.subregion_id || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className={labelClass}>geojson</dt>
              <dd className="mt-0.5 font-mono text-slate-600 break-all text-[11px]">
                {form.geojson != null
                  ? typeof form.geojson === "string"
                    ? form.geojson
                    : JSON.stringify(form.geojson)
                  : "—"}
              </dd>
            </div>
            <div className="sm:col-span-2 grid grid-cols-2 gap-x-3">
              <div>
                <dt className={labelClass}>centroid_lat</dt>
                <dd className="text-slate-800">{form.centroid_lat ?? "—"}</dd>
              </div>
              <div>
                <dt className={labelClass}>centroid_lng</dt>
                <dd className="text-slate-800">{form.centroid_lng ?? "—"}</dd>
              </div>
            </div>
          </dl>
        </CollapsibleCard>

        {!isNew && (
          <CollapsibleCard title="System metadata" open={cardState.metadata} onToggle={() => toggleCard("metadata")}>
            <dl className="space-y-2 text-xs">
              <div>
                <dt className={labelClass}>created_at</dt>
                <dd className="text-slate-800">{formatDate(form.created_at)}</dd>
              </div>
              <div>
                <dt className={labelClass}>updated_at</dt>
                <dd className="text-slate-800">{formatDate(form.updated_at)}</dd>
              </div>
              <div>
                <dt className={labelClass}>deleted_at</dt>
                <dd className="text-slate-800">{formatDate(form.deleted_at)}</dd>
              </div>
            </dl>
          </CollapsibleCard>
        )}
      </div>

      <ConfirmDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete appellation"
        message="Are you sure you want to delete this appellation? This action will perform a soft delete."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

