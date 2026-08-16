import {
  buildEmailHref,
  buildWhatsappHref,
  formatWhatsappDisplay,
  type PublicBusinessSettings,
} from "@de-tin-marin/validations/business-settings";

export type StorefrontContactLinks = {
  whatsappHref: string;
  whatsappDisplay: string;
  emailHref: string;
  email: string;
};

export type LegalContactInfo = {
  email: string;
  emailHref: string;
  whatsappDisplay: string;
  whatsappHref: string;
};

export function buildStorefrontContactLinks(
  settings: PublicBusinessSettings,
): StorefrontContactLinks {
  return {
    whatsappHref: buildWhatsappHref(settings.whatsappE164),
    whatsappDisplay: formatWhatsappDisplay(settings.whatsappE164),
    emailHref: buildEmailHref(settings.email),
    email: settings.email,
  };
}

export function buildLegalContactInfo(
  settings: PublicBusinessSettings,
): LegalContactInfo {
  const contact = buildStorefrontContactLinks(settings);
  return {
    email: contact.email,
    emailHref: contact.emailHref,
    whatsappDisplay: contact.whatsappDisplay,
    whatsappHref: contact.whatsappHref,
  };
}
