/*
 * Primitivos de internacionalización compartidos por todas las apps.
 * Fuente única de verdad para la lista de idiomas y el idioma por defecto.
 * v1: solo español; `en` queda declarado para habilitarlo sin refactor.
 */

export const locales = ["es", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
