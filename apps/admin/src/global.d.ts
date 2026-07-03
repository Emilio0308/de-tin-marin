import type { Locale } from "@de-tin-marin/config/i18n";
import type messages from "../messages/es.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
