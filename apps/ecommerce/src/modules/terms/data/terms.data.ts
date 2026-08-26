/** Contenido legal — contacto se inyecta desde public_business_settings. */

export const TERMS_LAST_UPDATED = "15 de agosto de 2026";

/** Razón social / nombre legal del titular. */
export const TERMS_LEGAL_NAME = "De Tin Marín";

/**
 * Dirección legal registrada.
 * Dejar `null` hasta tener el dato oficial (no se muestra en UI).
 */
export const TERMS_LEGAL_ADDRESS: string | null = null;

export type TermsSectionId =
  | "about"
  | "products"
  | "custom-surprises"
  | "prices"
  | "orders"
  | "payments"
  | "delivery"
  | "receipt"
  | "returns"
  | "promotions"
  | "ip"
  | "site-use"
  | "modifications"
  | "law"
  | "contact";

export interface TermsListBlock {
  lead?: string;
  items: string[];
  notes?: string[];
}

export interface TermsSection {
  id: TermsSectionId;
  title: string;
  paragraphs?: string[];
  list?: TermsListBlock;
  /** Muestra el bloque de contacto (correo / WhatsApp) tras el contenido. */
  showContact?: boolean;
}

export interface TermsContactInfo {
  email: string;
  emailHref: string;
  whatsappDisplay: string;
  whatsappHref: string;
  legalName: string;
  legalAddress: string | null;
}

export interface TermsContent {
  lastUpdated: string;
  introParagraphs: string[];
  sections: TermsSection[];
  contact: TermsContactInfo;
}

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: "about",
    title: "1. Sobre De Tin Marín",
    paragraphs: [
      "De Tin Marín es una tienda especializada en dulces, sorpresas y productos relacionados con celebraciones.",
      "A través de nuestro sitio puedes consultar productos disponibles, realizar compras y, cuando corresponda, personalizar determinadas sorpresas de acuerdo con las opciones disponibles.",
    ],
  },
  {
    id: "products",
    title: "2. Productos y disponibilidad",
    list: {
      lead: "Trabajamos para mantener actualizada la información de nuestros productos, incluyendo:",
      items: [
        "Nombre.",
        "Descripción.",
        "Precio.",
        "Presentación.",
        "Disponibilidad.",
      ],
      notes: [
        "Sin embargo, la disponibilidad puede cambiar debido a variaciones de inventario.",
        "En caso de que un producto adquirido no esté disponible, nos comunicaremos contigo para ofrecerte una alternativa, realizar el cambio correspondiente o gestionar la solución que corresponda.",
        "Las imágenes tienen carácter referencial cuando así se indique.",
      ],
    },
  },
  {
    id: "custom-surprises",
    title: "3. Sorpresas personalizables",
    paragraphs: [
      "Algunos productos permiten seleccionar los dulces que formarán parte de una sorpresa.",
      "La personalización estará limitada a las opciones, cantidades y condiciones mostradas durante el proceso de compra.",
      "Una vez confirmada la personalización, el pedido será preparado de acuerdo con la selección realizada por el cliente.",
      "Por tratarse de productos preparados especialmente para cada pedido, algunas condiciones de cambio o cancelación pueden diferir de las aplicables a productos estándar.",
    ],
  },
  {
    id: "prices",
    title: "4. Precios",
    paragraphs: [
      "Todos los precios publicados en nuestro sitio se muestran en soles peruanos (S/) e incluyen los impuestos correspondientes cuando así se indique.",
      "El precio aplicable será el mostrado al momento de confirmar la compra.",
      "De Tin Marín puede modificar precios, promociones o condiciones comerciales en cualquier momento. Estos cambios no afectarán las compras que ya hayan sido confirmadas, salvo que exista un error manifiesto o una situación que legalmente permita su modificación.",
    ],
  },
  {
    id: "orders",
    title: "5. Pedidos",
    paragraphs: [
      "Para realizar una compra debes proporcionar información correcta y actualizada.",
      "Una vez recibido tu pedido, podremos enviarte una confirmación mediante los canales disponibles.",
      "La confirmación del pedido no necesariamente implica que el pedido haya sido entregado; significa que hemos recibido y procesado tu solicitud de compra.",
    ],
  },
  {
    id: "payments",
    title: "6. Pagos",
    paragraphs: [
      "Los medios de pago disponibles serán mostrados durante el proceso de compra.",
      "Los pagos pueden ser procesados mediante proveedores externos especializados.",
      "De Tin Marín podrá cancelar o solicitar verificación adicional de una operación cuando existan indicios razonables de fraude, error o uso no autorizado del medio de pago.",
    ],
  },
  {
    id: "delivery",
    title: "7. Entregas",
    paragraphs: [
      "Las entregas se realizan en las zonas y condiciones indicadas durante el proceso de compra.",
      "Para realizar una entrega correctamente, el cliente debe proporcionar información precisa sobre la dirección y datos de contacto.",
    ],
    list: {
      lead: "Los tiempos de entrega pueden variar según:",
      items: [
        "Zona de destino.",
        "Disponibilidad del producto.",
        "Fecha y hora del pedido.",
        "Demanda.",
        "Condiciones externas que puedan afectar el servicio.",
      ],
      notes: [
        "Cuando un pedido contenga una sorpresa personalizada, el tiempo de preparación puede ser diferente al de un producto individual.",
      ],
    },
  },
  {
    id: "receipt",
    title: "8. Recepción del pedido",
    paragraphs: [
      "Recomendamos revisar el pedido al momento de recibirlo.",
      "Si detectas un problema relacionado con los productos recibidos, comunícate con nosotros lo antes posible proporcionando el número de pedido y, cuando sea necesario, fotografías que permitan evaluar el caso.",
      "Evaluaremos cada incidencia de acuerdo con las condiciones aplicables y la legislación peruana.",
    ],
  },
  {
    id: "returns",
    title: "9. Cambios, cancelaciones y devoluciones",
    paragraphs: [
      "Las solicitudes de cambio, cancelación o devolución estarán sujetas a la naturaleza del producto, el estado del pedido y la legislación peruana aplicable.",
      "Los productos personalizados o preparados específicamente según las indicaciones del cliente pueden estar sujetos a condiciones especiales.",
      "Para solicitar asistencia:",
    ],
    showContact: true,
  },
  {
    id: "promotions",
    title: "10. Promociones",
    list: {
      lead: "Las promociones pueden tener condiciones particulares, incluyendo:",
      items: [
        "Vigencia.",
        "Stock disponible.",
        "Productos participantes.",
        "Límites por cliente.",
        "Zonas de aplicación.",
      ],
      notes: [
        "Estas condiciones serán informadas junto con cada promoción.",
        "Las promociones no son acumulables cuando así se indique.",
      ],
    },
  },
  {
    id: "ip",
    title: "11. Propiedad intelectual",
    list: {
      lead: "Los elementos presentes en el sitio web, incluyendo:",
      items: [
        "Logotipo.",
        "Nombre De Tin Marín.",
        "Fotografías.",
        "Ilustraciones.",
        "Diseños.",
        "Textos.",
        "Gráficos.",
        "Elementos visuales.",
      ],
      notes: [
        "son propiedad de De Tin Marín o se utilizan con las autorizaciones correspondientes.",
        "No está permitido copiar, reproducir, modificar o utilizar estos elementos con fines comerciales sin autorización previa.",
      ],
    },
  },
  {
    id: "site-use",
    title: "12. Uso del sitio web",
    paragraphs: [
      "El usuario se compromete a utilizar el sitio de manera legítima y responsable.",
    ],
    list: {
      lead: "No está permitido:",
      items: [
        "Intentar acceder a áreas restringidas.",
        "Interferir con el funcionamiento del sitio.",
        "Utilizar información de otros usuarios sin autorización.",
        "Realizar actividades fraudulentas.",
        "Utilizar el sitio para actividades ilegales.",
      ],
    },
  },
  {
    id: "modifications",
    title: "13. Modificaciones",
    paragraphs: [
      "De Tin Marín puede actualizar estos Términos y Condiciones cuando sea necesario.",
      "Los cambios serán publicados en esta página indicando la fecha de actualización correspondiente.",
    ],
  },
  {
    id: "law",
    title: "14. Legislación aplicable",
    paragraphs: [
      "Estos términos se interpretan de acuerdo con la legislación vigente de la República del Perú.",
      "Cualquier controversia será atendida conforme a los mecanismos y autoridades competentes establecidos por la legislación peruana.",
    ],
  },
  {
    id: "contact",
    title: "15. Contacto",
    paragraphs: [
      "¿Tienes alguna duda sobre una compra o estos términos?",
      "Estamos aquí para ayudarte.",
    ],
  },
];

export const TERMS_INTRO_PARAGRAPHS = [
  "Bienvenido a De Tin Marín.",
  "Estos Términos y Condiciones regulan el acceso y uso de nuestro sitio web, así como la compra de nuestros productos y sorpresas.",
  "Al navegar por nuestro sitio o realizar una compra, aceptas estos términos. Si no estás de acuerdo con alguno de ellos, te recomendamos no utilizar nuestros servicios.",
];

export function buildTermsContent(
  contact: Omit<TermsContactInfo, "legalName" | "legalAddress">,
): TermsContent {
  return {
    lastUpdated: TERMS_LAST_UPDATED,
    introParagraphs: TERMS_INTRO_PARAGRAPHS,
    sections: TERMS_SECTIONS,
    contact: {
      ...contact,
      legalName: TERMS_LEGAL_NAME,
      legalAddress: TERMS_LEGAL_ADDRESS,
    },
  };
}
