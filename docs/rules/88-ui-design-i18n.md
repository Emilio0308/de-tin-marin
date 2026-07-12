# 88 — UI, diseño responsive, i18n y datos reales

> **Alcance:** maquetación y front en `apps/admin` y `apps/ecommerce`.
> **Paleta:** tokens en `apps/*/src/app/globals.css` (`--color-*`).

## Diseño responsive

- Mobile-first: probar en viewport estrecho antes de desktop.
- Layouts con Tailwind responsive (`sm:`, `md:`, `lg:`) — evitar anchos fijos que rompan en móvil.
- Tablas densas: scroll horizontal o vista apilada en pantallas pequeñas.
- Touch targets mínimos ~44px en acciones primarias.

## Textos en i18n

- **Prohibido** hardcodear copy de UI en español/inglés en JSX (títulos, labels, botones, empty states, errores visibles).
- **Nunca pasar labels como props** — cada componente gestiona sus textos con `useTranslations` y su namespace (`catalog.wizard.componentList`, etc.).
- Admin: `apps/admin/messages/es.json`. Ecommerce: `apps/ecommerce/messages/es.json`.
- Config compartida: `@de-tin-marin/config/i18n` (DECISIONS #23).

```tsx
// ❌ hardcode + inyección de labels
<h1>Productos</h1>
<ProductList labels={{ title: t("title") }} />

// ✅ el componente que renderiza el copy llama useTranslations
function ProductList() {
  const t = useTranslations("products");
  return <h1>{t("title")}</h1>;
}
```

## Validar textos e iconos

- Antes de dar por cerrada una pantalla: revisar ortografía, truncado, overflow y estados vacíos/error/carga.
- Iconos: tamaño y color coherentes con la paleta; `aria-label` o texto visible si el icono es la única acción.
- No dejar placeholders (`Lorem`, `TODO`, `TBD`) en UI entregable.

## Paleta de colores (estricta)

- Usar **solo** tokens CSS del tema (`bg-primary`, `text-on-surface`, `border-outline`, etc.) o variables `--color-*` definidas en `globals.css`.
- **Prohibido** hex/rgb sueltos en componentes (`#b60058`, `text-zinc-600` para marca) salvo excepción documentada en el design system.
- Estados semánticos: `error`, `primary`, `secondary`, `surface` — no inventar grises ad hoc para CTAs.

## No mockear si ya existe el servicio

- Si hay Server Action + service + repository implementados, el **container** debe consumirlos (TanStack Query → action).
- **Prohibido** arrays fake en producción cuando `listProductsAction`, `listCategoriesAction`, etc. ya existen.

```tsx
// ❌ maquetación con datos inventados en container final
const products = [{ id: "1", name: "Fake" }];

// ✅
const productsQuery = useQuery({
  queryKey: ["products"],
  queryFn: async () => {
    const result = await listProductsAction();
    if (!result.ok) throw new Error(result.error);
    return result.data;
  },
});
```

- Mocks solo en **tests** (`*.test.tsx`) o prototipos explícitos marcados como temporales — no mezclar con features ya cableadas a backend.

## Enforcement

| Regla            | Tipo                 |
| ---------------- | -------------------- |
| i18n en UI       | Review + lint futuro |
| Sin labels props | Review               |
| Paleta tokens    | Review + Prettier    |
| Sin mock en prod | Review               |
| Responsive       | Review + Playwright  |

Ver también [`85-react-components.md`](85-react-components.md) · [`coding-guidelines.md`](../coding-guidelines.md).
