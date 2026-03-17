"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type WineSubregion = {
  id: string;
  region_id: string;
  slug: string;
  name_fr: string;
  name_en: string | null;
  area_hectares: number | null;
  description_fr: string | null;
  description_en: string | null;
  geojson: unknown;
  centroid_lat: number | null;
  centroid_lng: number | null;
  map_order: number | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  /** From join: wine_regions.name_fr (set when fetching list) */
  region_name_fr?: string | null;
};

export async function getWineSubregions(): Promise<WineSubregion[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wine_subregions")
    .select(
      `
      *,
      wine_regions!region_id(name_fr)
    `
    )
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as (Omit<WineSubregion, "region_name_fr"> & {
    wine_regions: { name_fr: string } | { name_fr: string }[] | null;
  })[];
  return rows.map((r) => {
    const { wine_regions, ...rest } = r;
    const region =
      wine_regions == null
        ? null
        : Array.isArray(wine_regions)
          ? wine_regions[0]
          : wine_regions;
    return {
      ...rest,
      region_name_fr: region?.name_fr ?? null,
    };
  }) as WineSubregion[];
}

export async function getWineSubregion(id: string): Promise<WineSubregion | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wine_subregions")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as WineSubregion;
}

type WineSubregionForm = Omit<
  WineSubregion,
  "id" | "created_at" | "updated_at" | "deleted_at" | "region_name_fr"
> & {
  id?: string;
};

function formToRow(form: WineSubregionForm): Record<string, unknown> {
  let geojson: unknown = form.geojson ?? null;
  if (typeof geojson === "string" && geojson.trim()) {
    try {
      geojson = JSON.parse(geojson);
    } catch {
      geojson = null;
    }
  }
  return {
    region_id: form.region_id || null,
    slug: form.slug || null,
    name_fr: form.name_fr || "",
    name_en: form.name_en || null,
    area_hectares: form.area_hectares ?? null,
    description_fr: form.description_fr || null,
    description_en: form.description_en || null,
    geojson,
    centroid_lat: form.centroid_lat ?? null,
    centroid_lng: form.centroid_lng ?? null,
    map_order: form.map_order ?? null,
    status: form.status || "draft",
    published_at: form.published_at || null,
  };
}

export async function createWineSubregion(
  form: WineSubregionForm
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("wine_subregions").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/wine-subregions");
  return {};
}

export async function updateWineSubregion(
  id: string,
  form: WineSubregionForm
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("wine_subregions").update(row).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/wine-subregions");
  return {};
}

export async function deleteWineSubregion(id: string): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("wine_subregions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/wine-subregions");
  return {};
}
