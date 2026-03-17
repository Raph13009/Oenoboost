"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type Grape = {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string | null;
  type: string | null;
  origin_country: string | null;
  origin_region_fr: string | null;
  origin_region_en: string | null;
  origin_latitude: number | null;
  origin_longitude: number | null;
  history_fr: string | null;
  history_en: string | null;
  crossings_fr: string | null;
  crossings_en: string | null;
  production_regions_fr: string | null;
  production_regions_en: string | null;
  viticultural_traits_fr: string | null;
  viticultural_traits_en: string | null;
  tasting_traits_fr: string | null;
  tasting_traits_en: string | null;
  emblematic_wines_fr: string | null;
  emblematic_wines_en: string | null;
  is_premium: boolean;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export async function getGrapes(): Promise<Grape[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("grapes")
    .select("*")
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Grape[];
}

export async function getGrape(id: string): Promise<Grape | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("grapes").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data as Grape;
}

type GrapeForm = Omit<Grape, "id" | "created_at" | "updated_at" | "deleted_at"> & { id?: string };

function formToRow(form: GrapeForm): Record<string, unknown> {
  return {
    slug: form.slug || null,
    name_fr: form.name_fr || "",
    name_en: form.name_en || null,
    type: form.type || null,
    origin_country: form.origin_country || null,
    origin_region_fr: form.origin_region_fr || null,
    origin_region_en: form.origin_region_en || null,
    origin_latitude: form.origin_latitude ?? null,
    origin_longitude: form.origin_longitude ?? null,
    history_fr: form.history_fr || null,
    history_en: form.history_en || null,
    crossings_fr: form.crossings_fr || null,
    crossings_en: form.crossings_en || null,
    production_regions_fr: form.production_regions_fr || null,
    production_regions_en: form.production_regions_en || null,
    viticultural_traits_fr: form.viticultural_traits_fr || null,
    viticultural_traits_en: form.viticultural_traits_en || null,
    tasting_traits_fr: form.tasting_traits_fr || null,
    tasting_traits_en: form.tasting_traits_en || null,
    emblematic_wines_fr: form.emblematic_wines_fr || null,
    emblematic_wines_en: form.emblematic_wines_en || null,
    is_premium: !!form.is_premium,
    status: form.status || "draft",
    published_at: form.published_at || null,
  };
}

export async function createGrape(form: GrapeForm): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("grapes").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/grapes");
  return {};
}

export async function updateGrape(id: string, form: GrapeForm): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("grapes").update(row).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/grapes");
  return {};
}

export async function deleteGrape(id: string): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("grapes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/grapes");
  return {};
}
