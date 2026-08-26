"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import {
  createHeroImageService,
  deleteHeroImageService,
  getHeroSettingsService,
  listHeroImagesService,
  reorderHeroImagesService,
  updateHeroImageService,
  updateHeroSettingsService,
} from "@/modules/web-customization/services/hero.service";

export async function getHeroSettingsAction() {
  return guardAction("getHeroSettingsAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const data = await getHeroSettingsService(supabaseConfig);
    return { ok: true as const, data };
  });
}

export async function updateHeroSettingsAction(raw: unknown) {
  return guardAction("updateHeroSettingsAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    return updateHeroSettingsService(supabaseConfig, raw);
  });
}

export async function listHeroImagesAction() {
  return guardAction("listHeroImagesAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const data = await listHeroImagesService(supabaseConfig);
    return { ok: true as const, data };
  });
}

export async function createHeroImageAction(raw: unknown) {
  return guardAction("createHeroImageAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    return createHeroImageService(supabaseConfig, raw);
  });
}

export async function updateHeroImageAction(raw: unknown) {
  return guardAction("updateHeroImageAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    return updateHeroImageService(supabaseConfig, raw);
  });
}

export async function deleteHeroImageAction(id: string) {
  return guardAction("deleteHeroImageAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    return deleteHeroImageService(supabaseConfig, id);
  });
}

export async function reorderHeroImagesAction(raw: unknown) {
  return guardAction("reorderHeroImagesAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    return reorderHeroImagesService(supabaseConfig, raw);
  });
}
