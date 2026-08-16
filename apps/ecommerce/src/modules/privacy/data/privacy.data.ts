import {
  ABOUT_EMAIL,
  ABOUT_EMAIL_HREF,
  ABOUT_WHATSAPP_DISPLAY,
  ABOUT_WHATSAPP_HREF,
} from "@/modules/about/data/about.data";

/** Contacto y datos legales — editar aquí para actualizar la política. */
export const PRIVACY_LAST_UPDATED = "15 de agosto de 2026";

export const PRIVACY_EMAIL = ABOUT_EMAIL;
export const PRIVACY_EMAIL_HREF = ABOUT_EMAIL_HREF;

export const PRIVACY_WHATSAPP_DISPLAY = ABOUT_WHATSAPP_DISPLAY;
export const PRIVACY_WHATSAPP_HREF = ABOUT_WHATSAPP_HREF;

/** Razón social / nombre legal del titular. */
export const PRIVACY_LEGAL_NAME = "De Tin Marín";

/**
 * Dirección legal registrada.
 * Dejar `null` hasta tener el dato oficial (no se muestra en UI).
 */
export const PRIVACY_LEGAL_ADDRESS: string | null = null;

export type PrivacySectionId =
  | "collect"
  | "use"
  | "share"
  | "protect"
  | "cookies"
  | "marketing"
  | "rights"
  | "retention"
  | "changes"
  | "contact";

export interface PrivacyListBlock {
  lead?: string;
  items: string[];
  notes?: string[];
}

export interface PrivacySection {
  id: PrivacySectionId;
  title: string;
  paragraphs?: string[];
  list?: PrivacyListBlock;
}

export interface PrivacyContactInfo {
  email: string;
  emailHref: string;
  whatsappDisplay: string;
  whatsappHref: string;
  legalName: string;
  legalAddress: string | null;
}

export interface PrivacyContent {
  lastUpdated: string;
  introParagraphs: string[];
  sections: PrivacySection[];
  contact: PrivacyContactInfo;
}

export const PRIVACY_CONTACT: PrivacyContactInfo = {
  email: PRIVACY_EMAIL,
  emailHref: PRIVACY_EMAIL_HREF,
  whatsappDisplay: PRIVACY_WHATSAPP_DISPLAY,
  whatsappHref: PRIVACY_WHATSAPP_HREF,
  legalName: PRIVACY_LEGAL_NAME,
  legalAddress: PRIVACY_LEGAL_ADDRESS,
};

export const PRIVACY_CONTENT: PrivacyContent = {
  lastUpdated: PRIVACY_LAST_UPDATED,
  introParagraphs: [
    "En De Tin Marín respetamos tu privacidad y estamos comprometidos con proteger la información personal que compartes con nosotros.",
    "Esta Política de Privacidad explica qué datos recopilamos cuando utilizas nuestro sitio web, realizas una compra, personalizas una sorpresa o te comunicas con nosotros, así como los fines para los que utilizamos dicha información.",
    "Al utilizar nuestro sitio web o realizar una compra, aceptas las prácticas descritas en esta política.",
  ],
  sections: [
    {
      id: "collect",
      title: "1. ¿Qué información recopilamos?",
      list: {
        lead: "Podemos recopilar información necesaria para brindarte nuestros productos y servicios, como:",
        items: [
          "Nombre y apellidos.",
          "Número de teléfono.",
          "Correo electrónico.",
          "Dirección o información necesaria para la entrega.",
          "Información relacionada con tus pedidos.",
          "Datos necesarios para personalizar tus sorpresas.",
          "Información que nos proporciones cuando te comuniques con nosotros.",
        ],
        notes: [
          "Cuando realizas un pago, la información de tu tarjeta u otros medios de pago puede ser procesada directamente por nuestros proveedores de servicios de pago. De Tin Marín no almacena los datos completos de tu tarjeta, salvo que se indique expresamente lo contrario.",
          "También podemos recopilar información técnica relacionada con tu navegación, como dispositivo, navegador, dirección IP y datos de interacción con nuestro sitio web.",
        ],
      },
    },
    {
      id: "use",
      title: "2. ¿Para qué utilizamos tu información?",
      list: {
        lead: "Utilizamos tu información para:",
        items: [
          "Procesar y gestionar tus pedidos.",
          "Preparar y personalizar tus sorpresas.",
          "Coordinar las entregas.",
          "Comunicarnos contigo sobre tus compras.",
          "Brindarte atención y soporte.",
          "Mejorar nuestros productos, servicios y sitio web.",
          "Prevenir actividades fraudulentas o no autorizadas.",
          "Cumplir obligaciones legales.",
          "Enviarte comunicaciones promocionales cuando corresponda y de acuerdo con tus preferencias.",
        ],
        notes: [
          "Nuestro objetivo es utilizar tus datos únicamente para fines legítimos y relacionados con nuestra relación contigo.",
        ],
      },
    },
    {
      id: "share",
      title: "3. ¿Compartimos tu información?",
      list: {
        lead: "Podemos compartir información estrictamente necesaria con proveedores que nos ayudan a operar nuestro negocio, por ejemplo:",
        items: [
          "Procesadores de pago.",
          "Servicios de entrega y logística.",
          "Proveedores tecnológicos.",
          "Servicios de comunicación.",
        ],
        notes: [
          "Estos proveedores solo deberían utilizar la información necesaria para prestar los servicios correspondientes.",
          "No vendemos tus datos personales.",
        ],
      },
    },
    {
      id: "protect",
      title: "4. ¿Cómo protegemos tu información?",
      paragraphs: [
        "Aplicamos medidas técnicas y organizativas razonables para proteger la información personal frente a accesos no autorizados, pérdida, alteración o uso indebido.",
        "Sin embargo, ningún sistema de almacenamiento o transmisión de información por Internet puede garantizar seguridad absoluta.",
      ],
    },
    {
      id: "cookies",
      title: "5. Cookies",
      list: {
        lead: "Nuestro sitio puede utilizar cookies y tecnologías similares para:",
        items: [
          "Mantener el funcionamiento del sitio.",
          "Recordar determinadas preferencias.",
          "Comprender cómo se utiliza nuestra plataforma.",
          "Mejorar la experiencia de navegación.",
        ],
        notes: [
          "Puedes configurar o limitar el uso de cookies desde las opciones de tu navegador.",
        ],
      },
    },
    {
      id: "marketing",
      title: "6. Comunicaciones comerciales",
      paragraphs: [
        "Podemos enviarte información sobre promociones, novedades, productos o campañas cuando tengamos una base válida para hacerlo.",
        "Puedes solicitar dejar de recibir comunicaciones comerciales en cualquier momento siguiendo las instrucciones incluidas en ellas o comunicándote con nosotros.",
      ],
    },
    {
      id: "rights",
      title: "7. Tus derechos",
      list: {
        lead: "Puedes solicitar información sobre los datos personales que tenemos sobre ti y, cuando corresponda, solicitar su:",
        items: [
          "Acceso.",
          "Rectificación.",
          "Actualización.",
          "Cancelación o eliminación.",
          "Oposición o limitación de determinados usos.",
        ],
        notes: [
          "Las solicitudes serán atendidas de acuerdo con la legislación peruana aplicable.",
        ],
      },
      paragraphs: [
        "Para ejercer tus derechos, puedes comunicarte con nosotros a través de los datos de contacto indicados al final de esta página.",
      ],
    },
    {
      id: "retention",
      title: "8. Conservación de la información",
      paragraphs: [
        "Conservaremos tus datos durante el tiempo necesario para cumplir con las finalidades descritas en esta política, atender obligaciones legales y resolver posibles reclamos o controversias.",
      ],
    },
    {
      id: "changes",
      title: "9. Cambios en esta política",
      paragraphs: [
        "Podemos actualizar esta Política de Privacidad cuando sea necesario para reflejar cambios en nuestros servicios, procesos o requisitos legales.",
        "Cuando realicemos cambios importantes, actualizaremos la fecha de modificación indicada al inicio de esta página.",
      ],
    },
    {
      id: "contact",
      title: "10. Contacto",
      paragraphs: [
        "Si tienes alguna pregunta sobre el tratamiento de tus datos personales, estamos para ayudarte.",
      ],
    },
  ],
  contact: PRIVACY_CONTACT,
};
