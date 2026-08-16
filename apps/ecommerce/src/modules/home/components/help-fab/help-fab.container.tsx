"use client";

import { useQuery } from "@tanstack/react-query";
import { buildWhatsappHref } from "@de-tin-marin/validations/business-settings";
import { getPublicBusinessSettingsAction } from "@/modules/business-settings/actions/get-public-business-settings";
import { queryKeys } from "@/shared/query/query-keys";
import { HelpFab } from "./help-fab";

export function HelpFabContainer() {
  const settingsQuery = useQuery({
    queryKey: queryKeys.businessSettings.public(),
    queryFn: async () => {
      const result = await getPublicBusinessSettingsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!settingsQuery.data) return null;

  return (
    <HelpFab
      whatsappHref={buildWhatsappHref(settingsQuery.data.whatsappE164)}
    />
  );
}
