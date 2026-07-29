import { CATALOG_PLACEHOLDER_IMAGE } from "@/modules/catalog/constants";

/** Contacto — editar aquí para actualizar WhatsApp, email y redes. */
export const ABOUT_WHATSAPP_E164 = "51968860348";
export const ABOUT_WHATSAPP_DISPLAY = "+51 968 860 348";
export const ABOUT_WHATSAPP_HREF = `https://wa.me/${ABOUT_WHATSAPP_E164}`;

export const ABOUT_EMAIL = "detinmarindulcesyconfiteria@gmail.com";
export const ABOUT_EMAIL_HREF = `mailto:${ABOUT_EMAIL}`;

export const ABOUT_INSTAGRAM_HREF = "#";
export const ABOUT_FACEBOOK_HREF = "#";
export const ABOUT_TIKTOK_HREF = "#";

export const ABOUT_STORY_IMAGE_URL = CATALOG_PLACEHOLDER_IMAGE;

/** Contenido de marca — editar aquí para cambiar misión, visión, historia y valores. */
export const ABOUT_STORY_EYEBROW = "Desde el corazón del Perú";

export const ABOUT_STORY_BODY =
  "Todo comenzó con un sueño bañado en azúcar y el deseo de convertir cada regalo en un momento mágico. De Tin Marín nació de la pasión por los detalles artesanales y la alegría de ver sonreír a quienes más queremos. Lo que empezó en una pequeña cocina familiar hoy se ha convertido en el puente de dulzura que une a miles de corazones.";

export const ABOUT_MISSION_BODY =
  "Endulzar la vida de nuestros clientes con golosinas de excelente calidad, ofreciendo experiencias que inspiren alegría, creatividad y satisfacción absoluta en cada compra";

export const ABOUT_VISION_BODY =
  "Ser la dulcería líder en nuestra región, reconocida por ofrecer experiencias únicas a través de una amplia variedad de dulces de alta calidad, y un excelente servicio al cliente.";

export type AboutValueId = "quality" | "creativity" | "closeness";

export interface AboutValue {
  id: AboutValueId;
  title: string;
  description: string;
}

export const ABOUT_VALUES: AboutValue[] = [
  {
    id: "quality",
    title: "Calidad Artesanal",
    description: "Ingredientes de primera y manos expertas.",
  },
  {
    id: "creativity",
    title: "Creatividad Sin Límites",
    description: "Diseños que sorprenden a primera vista.",
  },
  {
    id: "closeness",
    title: "Cercanía",
    description: "Atención cálida y personalizada siempre.",
  },
];

export interface AboutContactLinks {
  whatsappHref: string;
  whatsappDisplay: string;
  emailHref: string;
  email: string;
  instagramHref: string;
  facebookHref: string;
  tiktokHref: string;
}

export const ABOUT_CONTACT_LINKS: AboutContactLinks = {
  whatsappHref: ABOUT_WHATSAPP_HREF,
  whatsappDisplay: ABOUT_WHATSAPP_DISPLAY,
  emailHref: ABOUT_EMAIL_HREF,
  email: ABOUT_EMAIL,
  instagramHref: ABOUT_INSTAGRAM_HREF,
  facebookHref: ABOUT_FACEBOOK_HREF,
  tiktokHref: ABOUT_TIKTOK_HREF,
};

export interface AboutBrandContent {
  storyEyebrow: string;
  storyBody: string;
  missionBody: string;
  visionBody: string;
  values: AboutValue[];
  storyImageUrl: string;
}

export const ABOUT_BRAND_CONTENT: AboutBrandContent = {
  storyEyebrow: ABOUT_STORY_EYEBROW,
  storyBody: ABOUT_STORY_BODY,
  missionBody: ABOUT_MISSION_BODY,
  visionBody: ABOUT_VISION_BODY,
  values: ABOUT_VALUES,
  storyImageUrl: ABOUT_STORY_IMAGE_URL,
};
