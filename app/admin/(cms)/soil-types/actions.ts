"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type SoilType = {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string | null;
  photo_url: string | null;
  geological_origin_fr: string | null;
  geological_origin_en: string | null;
  regions_fr: string | null;
  regions_en: string | null;
  mineral_composition_fr: string | null;
  mineral_composition_en: string | null;
  wine_influence_fr: string | null;
  wine_influence_en: string | null;
  emblematic_aop_fr: string | null;
  emblematic_aop_en: string | null;
  carousel_order: number | null;
  is_premium: boolean;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SoilTypeListItem = Pick<
  SoilType,
  "id" | "slug" | "name_fr" | "name_en" | "status" | "updated_at"
>;

const SOIL_TYPE_LIST_COLUMNS = "id,slug,name_fr,name_en,status,updated_at";
const SOIL_TYPE_DETAIL_COLUMNS =
  "id,slug,name_fr,name_en,photo_url,geological_origin_fr,geological_origin_en,regions_fr,regions_en,mineral_composition_fr,mineral_composition_en,wine_influence_fr,wine_influence_en,emblematic_aop_fr,emblematic_aop_en,carousel_order,is_premium,status,published_at,created_at,updated_at,deleted_at";

export async function getSoilTypesLite(): Promise<Array<Pick<SoilType, "id" | "name_fr" | "slug">>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("soil_types")
    .select("id,name_fr,slug")
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<{ id: string; name_fr: string; slug: string }>).map((row) => ({
    id: row.id,
    name_fr: row.name_fr,
    slug: row.slug,
  }));
}

export async function getSoilTypes(): Promise<SoilTypeListItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("soil_types")
    .select(SOIL_TYPE_LIST_COLUMNS)
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as SoilTypeListItem[];
}

export async function getSoilType(id: string): Promise<SoilType | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("soil_types")
    .select(SOIL_TYPE_DETAIL_COLUMNS)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as SoilType;
}

type SoilTypeForm = Omit<SoilType, "id" | "created_at" | "updated_at" | "deleted_at"> & { id?: string };

function formToRow(form: SoilTypeForm): Record<string, unknown> {
  return {
    slug: form.slug || null,
    name_fr: form.name_fr || "",
    name_en: form.name_en || null,
    photo_url: form.photo_url || null,
    geological_origin_fr: form.geological_origin_fr || null,
    geological_origin_en: form.geological_origin_en || null,
    regions_fr: form.regions_fr || null,
    regions_en: form.regions_en || null,
    mineral_composition_fr: form.mineral_composition_fr || null,
    mineral_composition_en: form.mineral_composition_en || null,
    wine_influence_fr: form.wine_influence_fr || null,
    wine_influence_en: form.wine_influence_en || null,
    emblematic_aop_fr: form.emblematic_aop_fr || null,
    emblematic_aop_en: form.emblematic_aop_en || null,
    carousel_order: form.carousel_order ?? null,
    is_premium: !!form.is_premium,
    status: form.status || "draft",
    published_at: form.published_at || null,
  };
}

export async function createSoilType(form: SoilTypeForm): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("soil_types").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/soil-types");
  return {};
}

export async function updateSoilType(id: string, form: SoilTypeForm): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("soil_types").update(row).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/soil-types");
  return {};
}

export async function deleteSoilType(id: string): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("soil_types")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/soil-types");
  return {};
}

