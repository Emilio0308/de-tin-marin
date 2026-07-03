import { MessageCircle } from "lucide-react";

export function HelpFab() {
  return (
    <button
      type="button"
      aria-label="¿Necesitas ayuda?"
      className="bg-secondary text-on-secondary group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
    >
      <MessageCircle className="h-7 w-7" />
      <span className="bg-on-surface font-label text-on-secondary pointer-events-none absolute right-16 whitespace-nowrap rounded-lg px-3 py-1 text-sm opacity-0 transition-opacity group-hover:opacity-100">
        ¿Necesitas ayuda?
      </span>
    </button>
  );
}
