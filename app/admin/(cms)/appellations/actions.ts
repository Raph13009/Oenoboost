"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type Appellation = {
  id: string;
  subregion_id: string;
  slug: string;
  name_fr: string;
  name_en: string | null;
  area_hectares: number | null;
  producer_count: number | null;
  production_volume_hl: number | null;
  price_range_min_eur: number | null;
  price_range_max_eur: number | null;
  history_fr: string | null;
  history_en: string | null;
  colors_grapes_fr: string | null;
  colors_grapes_en: string | null;
  soils_description_fr: string | null;
  soils_description_en: string | null;
  geojson: unknown;
  centroid_lat: number | null;
  centroid_lng: number | null;
  is_premium: boolean;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  /** From join: wine_subregions.name_fr */
  subregion_name_fr?: string | null;
  /** From join through subregion: wine_regions.name_fr */
  region_name_fr?: string | null;
  /** From join through subregion: wine_subregions.region_id */
  region_id?: string | null;
};

export async function getAppellations(): Promise<Appellation[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("appellations")
    .select(
      `
      *,
      wine_subregions!subregion_id(
        name_fr,
        region_id,
        wine_regions!region_id(name_fr)
      )
    `
    )
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as (Omit<
    Appellation,
    "subregion_name_fr" | "region_name_fr" | "region_id"
  > & {
    wine_subregions:
      | {
          name_fr: string;
          region_id: string | null;
          wine_regions: { name_fr: string } | { name_fr: string }[] | null;
        }
      | {
          name_fr: string;
          region_id: string | null;
          wine_regions: { name_fr: string } | { name_fr: string }[] | null;
        }[]
      | null;
  })[];

  return rows.map((r) => {
    const { wine_subregions, ...rest } = r;
    const sr =
      wine_subregions == null
        ? null
        : Array.isArray(wine_subregions)
          ? wine_subregions[0]
          : wine_subregions;
    const region =
      sr?.wine_regions == null
        ? null
        : Array.isArray(sr.wine_regions)
          ? sr.wine_regions[0]
          : sr.wine_regions;
    return {
      ...(rest as Appellation),
      subregion_name_fr: sr?.name_fr ?? null,
      region_name_fr: region?.name_fr ?? null,
      region_id: sr?.region_id ?? null,
    };
  }) as Appellation[];
}

export async function getAppellation(id: string): Promise<Appellation | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("appellations").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data as Appellation;
}

type AppellationForm = Omit<
  Appellation,
  | "id"
  | "created_at"
  | "updated_at"
  | "deleted_at"
  | "subregion_name_fr"
  | "region_name_fr"
  | "region_id"
> & {
  id?: string;
};

function formToRow(form: AppellationForm): Record<string, unknown> {
  let geojson: unknown = form.geojson ?? null;
  if (typeof geojson === "string" && geojson.trim()) {
    try {
      geojson = JSON.parse(geojson);
    } catch {
      geojson = null;
    }
  }
  return {
    subregion_id: form.subregion_id || null,
    slug: form.slug || null,
    name_fr: form.name_fr || "",
    name_en: form.name_en || null,
    area_hectares: form.area_hectares ?? null,
    producer_count: form.producer_count ?? null,
    production_volume_hl: form.production_volume_hl ?? null,
    price_range_min_eur: form.price_range_min_eur ?? null,
    price_range_max_eur: form.price_range_max_eur ?? null,
    history_fr: form.history_fr || null,
    history_en: form.history_en || null,
    colors_grapes_fr: form.colors_grapes_fr || null,
    colors_grapes_en: form.colors_grapes_en || null,
    soils_description_fr: form.soils_description_fr || null,
    soils_description_en: form.soils_description_en || null,
    geojson,
    centroid_lat: form.centroid_lat ?? null,
    centroid_lng: form.centroid_lng ?? null,
    is_premium: !!form.is_premium,
    status: form.status || "draft",
    published_at: form.published_at || null,
  };
}

export async function createAppellation(form: AppellationForm): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("appellations").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/appellations");
  return {};
}

export async function updateAppellation(
  id: string,
  form: AppellationForm
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("appellations").update(row).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/appellations");
  return {};
}

export async function deleteAppellation(id: string): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("appellations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/appellations");
  return {};
}

