import { Candy, Cookie, Gift, Lollipop, PartyPopper } from "lucide-react";
import type {
  HomeBundle,
  HomeCategory,
  HomeNavLink,
  HomeProduct,
} from "@/modules/home/types/home.types";

/*
 * Datos estáticos de presentación para la landing.
 * Placeholder mientras no existe el dominio de catálogo (repositories/services);
 * cuando exista, esta seed se reemplaza por datos servidos vía service.
 */

export const HOME_NAV_LINKS: HomeNavLink[] = [
  { label: "Sweets", href: "#sweets" },
  { label: "Surprises", href: "#surprises" },
  { label: "About Us", href: "#about" },
];

export const HOME_CATEGORIES: HomeCategory[] = [
  { id: "caramelos", label: "Caramelos", icon: Candy },
  { id: "chocolates", label: "Chocolates", icon: Cookie },
  { id: "gomitas", label: "Gomitas", icon: Lollipop },
  { id: "kits-fiesta", label: "Kits Fiesta", icon: PartyPopper },
  { id: "sorpresa", label: "Sorpresa", icon: Gift },
];

export const HOME_PRODUCTS: HomeProduct[] = [
  {
    id: "paleta-arcoiris",
    name: "Paleta Arcoiris Gigante",
    price: 5.5,
    badge: "Nuevo",
    imageAlt: "Paleta arcoíris gigante",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBO2NJsDRkxfFT4SmAm7ptKvm4B1_DrjOHKk_pqesNGVNeDh6YDoQ1oLCaeicCt5Jk-CSfem5QmDJFbzpFdtFo5Zi_8dLl1_NxYfXZIGUgVnReWvd73kGlbQn0i2doUv_44uttBcNFSfybrVDpwSJQ4VKtR7rTQe89Ufxe2y8Ort0fiJpL3AcId8zl-bMiC1tC8gASrC8ZbDNBk_j-wuWIJJ9SrxUE5T9rhMjLU6BMFXDaPo0bJg1q6BrZmrkH1miydTq01qY33pgE",
  },
  {
    id: "trufas-belgas",
    name: "Trufas Belgas (6u)",
    price: 12,
    imageAlt: "Caja de trufas belgas",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAnAvYiHPLAIgPmcNOGd1gMjNSFQPgl5TYGGBPNfKcpVMkMiIAuoFF-KYhtoQQp4we9JLLYP-0Ro4I9LTcPnBFTQGlfkmVYLmgb64det-27sIetEHITAAGHVIl5wLIdCn6N0Yj2gbfs3UlRSm7AxyWBoCRB_DAGzIyKCp_GmIrE0gNYYQmaY6xnvvyCDADy_CY6suIOuO0Hza5FZ8B7lKVsQJnaaCbBRK6FnNCMvZKe4Sx8JJSN3FcEz2ofG78OFmN_NNb3h8aYfBI",
  },
  {
    id: "gomitas-acidas",
    name: "Jar de Gomitas Ácidas",
    price: 8.9,
    imageAlt: "Frasco de gomitas ácidas",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB1rpyjjwn4Cthqjn13cdoAzlAH24B3PY6yYxS2vzN7LzTF2yPuSrOEOeQo7EG2laVkTU2mj6uUwFWHySgxi54scmPhWrzB2y6mo3bXp_jCoZZNehj8qyi_eQiMprlxVJdZEgr-FXQtckv0iJqWD8s-fPmot9DshDAe1OTDSE6CI5-Ue1HSYllvkcQN8E5BCg-iLqGUoJcm2nAeb6niAmmEBg34s1w_u9qzJyXLJboAftQ5cHS8vO0LETZiakjJY9E5PiFNxFc3ewQ",
  },
  {
    id: "choco-amor",
    name: "Sorpresa 'Choco-Amor'",
    price: 25,
    imageAlt: "Caja sorpresa Choco-Amor",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAIbSIt5-6XJfBETQo-9rdO9PRbNMB5tUtFgP9HBocGfR-o-FFs9e2BupAMG-KS_xE7jFe5z8sh6eeEdMyflHXh0luyVmcSgrEcKyHg_b8P5LccmCNZ5h03NTJacZ-HJl-73d9lmp9sm0gCdPvHc9Trlze8TIGkGi2Mqjvflxo9KOwlNolM762as_MRFzHui0LfYdPykh-FN5FiinDvpmj85SI3hORkO5VXraNevTe-3CnllaRQdKE54G3ba8-rLC3K3vUJb-draRc",
  },
];

export const HOME_BUNDLES: HomeBundle[] = [
  {
    id: "combo-fiesta-pro",
    name: "Combo Fiesta Pro",
    price: 45,
    imageAlt: "Kit de fiesta con globos, pastel y dulces",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB6VHhb00nJZRbvQtk0l0ewOIG7_nidODkUdYjL-UVz1dNQyb9wWu_Xjh2JO45Qt6CFaZBcEDWzApqtb6U8pVt0_8dgFw3C9cGnZpY5yMhXpx1FvJRNwqJrDAKEgISt2H2LSoq7fV54geQeh-mDoq2EKHaGdJgEQtSppGrHAxAyw7Vwg1o8zgLTQhmn_J4YYZq2Ek8twI1h6f8or8hRTB6wJZnoQBjvhrDABcHiNXYsCBDi29HkyX4kkUwfGeG0VotBame1KmZiajY",
    features: [
      { id: "dulces", label: "24 Dulces variados" },
      { id: "caja", label: "Caja de regalo Premium" },
      { id: "globo", label: "Globo personalizado" },
    ],
  },
  {
    id: "momento-dulce",
    name: "Momento Dulce",
    price: 32,
    imageAlt: "Caja regalo con mug, café y chocolates",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAdt7zmWWWLCl63P2WLW2ocwXwcREyKDUVpjLKcaTKNbqNiBSeu8G5HOnjV-OTIZIyDAV-Ht9qmFrrLF7S7-27binMSdGyJOhaP15KwX2CRf5wLBqEIdqkd0-KuWr14EiPnHcFB3IRTIec3XpqROmLzUpjb0g0ex-KbhBf70ySM6hJr9_l-58CPhvTe5xdbW8H-WVd6aXnx_IP__hk3cJsLg46cNu1MlN4lhxEjaUToB6VCkkQO06SxXz13LF0pGh34d80UTorfZVk",
    features: [
      { id: "mug", label: "Mug personalizado" },
      { id: "frutos", label: "Mezcla de frutos dulces" },
      { id: "tarjeta", label: "Tarjeta dedicatoria" },
    ],
  },
];
