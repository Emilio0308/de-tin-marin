import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "@de-tin-marin/config/i18n";
import messages from "../../messages/es.json";

/*
 * Configuración de request para next-intl SIN routing por URL.
 * v1: siempre resolvemos `defaultLocale` (es) con import estático.
 *
 * Al habilitar más idiomas, resolver el locale real aquí (cookie,
 * header Accept-Language o segmento de ruta) y cargar el catálogo por locale:
 *   messages: (await import(`../../messages/${locale}.json`)).default
 */
export default getRequestConfig(() => ({
  locale: defaultLocale,
  messages,
}));
