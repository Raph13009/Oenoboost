"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SoilType } from "@/app/admin/(cms)/soil-types/actions";
import {
  createSoilType,
  deleteSoilType,
  updateSoilType,
} from "@/app/admin/(cms)/soil-types/actions";
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

const CARD_STATE_KEY = "cms-soil-types-card-state";

type CardState = {
  identity: boolean;
  geology: boolean;
  distribution: boolean;
  wineImpact: boolean;
  flags: boolean;
  technical: boolean;
  metadata: boolean;
};

const defaultCardState: CardState = {
  identity: true,
  geology: true,
  distribution: true,
  wineImpact: true,
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
      geology: parsed.geology ?? defaultCardState.geology,
      distribution: parsed.distribution ?? defaultCardState.distribution,
      wineImpact: parsed.wineImpact ?? defaultCardState.wineImpact,
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

type Props = {
  soilType: SoilType | null;
  onClose: () => void;
  onDeleted: () => void;
};

const emptyForm = (): SoilType => ({
  id: "",
  slug: "",
  name_fr: "",
  name_en: null,
  photo_url: null,
  geological_origin_fr: null,
  geological_origin_en: null,
  regions_fr: null,
  regions_en: null,
  mineral_composition_fr: null,
  mineral_composition_en: null,
  wine_influence_fr: null,
  wine_influence_en: null,
  emblematic_aop_fr: null,
  emblematic_aop_en: null,
  carousel_order: null,
  is_premium: false,
  status: "draft",
  published_at: null,
  created_at: "",
  updated_at: "",
  deleted_at: null,
});

export function SoilTypeEditor({ soilType, onClose, onDeleted }: Props) {
  const router = useRouter();
  const isNew = !soilType?.id;
  const [form, setForm] = useState<SoilType>(() => soilType ?? emptyForm());

  useEffect(() => {
    setForm(soilType ?? emptyForm());
  }, [soilType?.id, soilType?.updated_at]);

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

  const update = useCallback((updates: Partial<SoilType>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        name_en: form.name_en || null,
        photo_url: form.photo_url || null,
        geological_origin_fr: form.geological_origin_fr || null,
        geological_origin_en: form.geological_origin_en || null,
        mineral_composition_fr: form.mineral_composition_fr || null,
        mineral_composition_en: form.mineral_composition_en || null,
        regions_fr: form.regions_fr || null,
        regions_en: form.regions_en || null,
        wine_influence_fr: form.wine_influence_fr || null,
        wine_influence_en: form.wine_influence_en || null,
        emblematic_aop_fr: form.emblematic_aop_fr || null,
        emblematic_aop_en: form.emblematic_aop_en || null,
        carousel_order: form.carousel_order ?? null,
        is_premium: !!form.is_premium,
        status: form.status || "draft",
        published_at: form.published_at || null,
      };
      if (isNew) {
        const res = await createSoilType(payload);
        if (res.error) setError(res.error);
        else {
          router.refresh();
          onClose();
        }
      } else {
        const res = await updateSoilType(form.id, payload);
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
      const res = await deleteSoilType(form.id);
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

  const panelTitle = form.name_fr?.trim() || form.name_en?.trim() || form.slug?.trim() || "Nouveau sol";

  const textareaClass =
    "min-h-[4rem] w-full resize-none rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200";

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
            {saving ? "Enregistrement…" : savedFeedback ? "Enregistré ✓" : "Enregistrer"}
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              disabled={deleting}
              className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Supprimer
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
        <CollapsibleCard title="Identité" open={cardState.identity} onToggle={() => toggleCard("identity")}>
          <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Nom (FR)</label>
              <input value={form.name_fr} onChange={(e) => update({ name_fr: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nom (EN)</label>
              <input
                value={form.name_en ?? ""}
                onChange={(e) => update({ name_en: e.target.value || null })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Slug</label>
              <input value={form.slug} onChange={(e) => update({ slug: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>URL photo</label>
              <input
                value={form.photo_url ?? ""}
                onChange={(e) => update({ photo_url: e.target.value || null })}
                className={inputClass}
              />
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Geological / Composition"
          open={cardState.geology}
          onToggle={() => toggleCard("geology")}
        >
          <div className={fieldSpacing}>
            <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Origine géologique (FR)</label>
                <AutoResizeTextarea
                  value={form.geological_origin_fr ?? ""}
                  onChange={(e) => update({ geological_origin_fr: e.target.value || null })}
                  minRows={2}
                  className={textareaClass}
                />
              </div>
              <div>
                <label className={labelClass}>Origine géologique (EN)</label>
                <AutoResizeTextarea
                  value={form.geological_origin_en ?? ""}
                  onChange={(e) => update({ geological_origin_en: e.target.value || null })}
                  minRows={2}
                  className={textareaClass}
                />
              </div>
              <div>
                <label className={labelClass}>Composition minérale (FR)</label>
                <AutoResizeTextarea
                  value={form.mineral_composition_fr ?? ""}
                  onChange={(e) => update({ mineral_composition_fr: e.target.value || null })}
                  minRows={2}
                  className={textareaClass}
                />
              </div>
              <div>
                <label className={labelClass}>Composition minérale (EN)</label>
                <AutoResizeTextarea
                  value={form.mineral_composition_en ?? ""}
                  onChange={(e) => update({ mineral_composition_en: e.target.value || null })}
                  minRows={2}
                  className={textareaClass}
                />
              </div>
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Répartition"
          open={cardState.distribution}
          onToggle={() => toggleCard("distribution")}
        >
          <div className={fieldSpacing}>
            <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Régions (FR)</label>
                <AutoResizeTextarea
                  value={form.regions_fr ?? ""}
                  onChange={(e) => update({ regions_fr: e.target.value || null })}
                  minRows={2}
                  className={textareaClass}
                />
              </div>
              <div>
                <label className={labelClass}>Régions (EN)</label>
                <AutoResizeTextarea
                  value={form.regions_en ?? ""}
                  onChange={(e) => update({ regions_en: e.target.value || null })}
                  minRows={2}
                  className={textareaClass}
                />
              </div>
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Impact sur le vin"
          open={cardState.wineImpact}
          onToggle={() => toggleCard("wineImpact")}
        >
          <div className={fieldSpacing}>
            <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Influence sur le vin (FR)</label>
                <AutoResizeTextarea
                  value={form.wine_influence_fr ?? ""}
                  onChange={(e) => update({ wine_influence_fr: e.target.value || null })}
                  minRows={2}
                  className={textareaClass}
                />
              </div>
              <div>
                <label className={labelClass}>Influence sur le vin (EN)</label>
                <AutoResizeTextarea
                  value={form.wine_influence_en ?? ""}
                  onChange={(e) => update({ wine_influence_en: e.target.value || null })}
                  minRows={2}
                  className={textareaClass}
                />
              </div>
              <div>
                <label className={labelClass}>AOP emblématiques (FR)</label>
                <AutoResizeTextarea
                  value={form.emblematic_aop_fr ?? ""}
                  onChange={(e) => update({ emblematic_aop_fr: e.target.value || null })}
                  minRows={2}
                  className={textareaClass}
                />
              </div>
              <div>
                <label className={labelClass}>AOP emblématiques (EN)</label>
                <AutoResizeTextarea
                  value={form.emblematic_aop_en ?? ""}
                  onChange={(e) => update({ emblematic_aop_en: e.target.value || null })}
                  minRows={2}
                  className={textareaClass}
                />
              </div>
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Indicateurs" open={cardState.flags} onToggle={() => toggleCard("flags")}>
          <div className={fieldSpacing}>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <div>
                <label className={labelClass}>Ordre du carrousel</label>
                <input
                  type="number"
                  value={form.carousel_order ?? ""}
                  onChange={(e) =>
                    update({ carousel_order: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </div>
              <div className="flex items-end">
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
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <div>
                <label className={labelClass}>Statut</label>
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
                <label className={labelClass}>Publié le</label>
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

        <CollapsibleCard title="Données techniques" open={cardState.technical} onToggle={() => toggleCard("technical")}>
          <dl className="space-y-2 text-xs">
            <div>
              <dt className={labelClass}>id</dt>
              <dd className="font-mono text-slate-800">{form.id || "—"}</dd>
            </div>
          </dl>
        </CollapsibleCard>

        {!isNew && (
          <CollapsibleCard title="Métadonnées système" open={cardState.metadata} onToggle={() => toggleCard("metadata")}>
            <dl className="space-y-2 text-xs">
              <div>
                <dt className={labelClass}>Créé le</dt>
                <dd className="text-slate-800">{formatDate(form.created_at)}</dd>
              </div>
              <div>
                <dt className={labelClass}>Mis à jour le</dt>
                <dd className="text-slate-800">{formatDate(form.updated_at)}</dd>
              </div>
              <div>
                <dt className={labelClass}>Supprimé le</dt>
                <dd className="text-slate-800">{formatDate(form.deleted_at)}</dd>
              </div>
            </dl>
          </CollapsibleCard>
        )}
      </div>

      <ConfirmDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Supprimer le sol"
        message="Are you sure you want to delete this soil type? This action will perform a soft delete."
        confirmLabel="Supprimer"
        onConfirm={handleConfirmDelete}
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

