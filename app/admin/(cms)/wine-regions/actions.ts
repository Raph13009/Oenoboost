"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type WineRegion = {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string;
  department_count: number | null;
  area_hectares: number | null;
  total_production_hl: number | null;
  main_grapes_fr: string | null;
  main_grapes_en: string | null;
  geojson: unknown;
  centroid_lat: number | null;
  centroid_lng: number | null;
  color_hex: string | null;
  map_order: number | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export async function getWineRegions(): Promise<WineRegion[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wine_regions")
    .select("*")
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as WineRegion[];
}

export async function getWineRegion(id: string): Promise<WineRegion | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wine_regions")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as WineRegion;
}

type WineRegionForm = Omit<WineRegion, "id" | "created_at" | "updated_at" | "deleted_at"> & {
  id?: string;
};

function formToRow(form: WineRegionForm): Record<string, unknown> {
  return {
    slug: form.slug || null,
    name_fr: form.name_fr || "",
    name_en: form.name_en || "",
    department_count: form.department_count ?? null,
    area_hectares: form.area_hectares ?? null,
    total_production_hl: form.total_production_hl ?? null,
    main_grapes_fr: form.main_grapes_fr || null,
    main_grapes_en: form.main_grapes_en || null,
    geojson: form.geojson ?? null,
    centroid_lat: form.centroid_lat ?? null,
    centroid_lng: form.centroid_lng ?? null,
    color_hex: form.color_hex || null,
    map_order: form.map_order ?? null,
    status: form.status || "draft",
    published_at: form.published_at || null,
  };
}

export async function createWineRegion(form: WineRegionForm): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("wine_regions").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/wine-regions");
  return {};
}

export async function updateWineRegion(id: string, form: WineRegionForm): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("wine_regions").update(row).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/wine-regions");
  return {};
}

export async function deleteWineRegion(id: string): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("wine_regions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/wine-regions");
  return {};
}
