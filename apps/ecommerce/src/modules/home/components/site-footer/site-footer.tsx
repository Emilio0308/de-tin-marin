import { Send } from "lucide-react";

const EXPLORE_LINKS = [
  { label: "Sweets", href: "#sweets" },
  { label: "Surprises", href: "#surprises" },
  { label: "Bundles", href: "#bundles" },
];

const HELP_LINKS = [
  { label: "Order Tracking", href: "#tracking" },
  { label: "Contact Us", href: "#contact" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "#privacy" },
  { label: "Terms of Service", href: "#terms" },
];

export function SiteFooter() {
  return (
    <footer className="bg-surface-container-high">
      <div className="container-max px-gutter py-stack-lg">
        <div className="mb-stack-md gap-stack-md border-outline-variant/30 pb-stack-md flex flex-col items-start justify-between border-b md:flex-row">
          <div className="space-y-4">
            <div className="font-display text-headline-md text-primary">
              De Tin Marín
            </div>
            <p className="font-body text-body-md text-tertiary max-w-xs">
              Endulzamos cada mañana de cumpleaños con magia y sabor.
            </p>
          </div>

          <div className="gap-stack-md grid grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-label text-label-bold text-on-surface">
                Explora
              </h3>
              <div className="flex flex-col gap-2">
                {EXPLORE_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="font-label text-label-bold text-on-surface-variant hover:text-secondary transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-label text-label-bold text-on-surface">
                Ayuda
              </h3>
              <div className="flex flex-col gap-2">
                {HELP_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="font-label text-label-bold text-on-surface-variant hover:text-secondary transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-label text-label-bold text-on-surface">
              Suscríbete
            </h3>
            <form className="flex">
              <input
                type="email"
                placeholder="Tu email"
                aria-label="Correo para suscripción"
                className="bg-surface-container-lowest focus:ring-primary w-48 rounded-l-full border-none px-4 py-2 focus:outline-none focus:ring-2"
              />
              <button
                type="submit"
                aria-label="Suscribirse"
                className="press-down bg-primary text-on-primary rounded-r-full px-4 py-2"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="font-body text-body-md text-on-surface-variant text-center md:text-left">
            © 2024 De Tin Marín. Endulzando cada mañana de cumpleaños.
          </p>
          <div className="gap-stack-md flex">
            {LEGAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-label text-label-bold text-on-surface-variant hover:text-secondary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
