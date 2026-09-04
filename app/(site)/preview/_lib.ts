// Placeholder data for the studio live-preview iframe. Shown only until the
// admin studio's first postMessage sync replaces it with the real content.
import type {
  AdminAnnouncement,
  AdminCertification,
  AdminGalleryPhoto,
  AdminHomeStep,
  AdminMenuItem,
  AdminSiteSettings,
} from "@/lib/admin-api";

export const DEFAULT_DEAL_PHOTO =
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80";

export const DEFAULT_SITE: AdminSiteSettings = {
  hero_heading: "Stack Into",
  hero_script: "Happiness",
  hero_lead: "We flip the best homemade pancakes in Sydney — griddled to order, stacked high, drowned in real maple.",
  hero_image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1400&q=85",
  hero_cutout: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
  about_text: "",
  about_heading: "",
  about_script: "",
  about_image_1: "",
  about_image_2: "",
  about_image_3: "",
  about_points: "",
  cta_heading: "Hungry?",
  cta_script: "Book a Table.",
  cta_lead: "Reserve online in seconds — free, instant confirmation, open 7 days.",
  cta_button_label: "Book a Table",
  cta_button_url: "/booking",
  marquee_words: "",
  footer_tagline: "Fluffy stacks · real maple · est. 1999",
  menu_hero_heading: "Stacks On",
  menu_hero_script: "Stacks.",
  menu_hero_lead: "Handcrafted pancakes made fresh with local dairy and authentic maple.",
  gallery_hero_kicker: "Feast Your Eyes",
  gallery_hero_heading: "The",
  gallery_hero_script: "Gallery.",
  gallery_hero_lead: "Our food, our space, and the good times in between.",
  booking_hero_kicker: "Reserve Online — Free & Instant",
  booking_hero_heading: "Book a",
  booking_hero_script: "Table.",
  booking_hero_lead: "Pick a date, pick a time — we'll have the griddle hot when you arrive.",
  address: "123 Pancake Lane, Sydney",
  phone: "0400000000",
  whatsapp: "",
  email: "hello@thepancakeclub.com.au",
  abn: "",
  map_embed: "",
  instagram_url: "",
  facebook_url: "",
  uber_eats_url: "",
  online_ordering_enabled: true,
  online_ordering_disabled_message: "",
  timezone: "Australia/Sydney",
  theme: "maple",
  custom_primary: "#763a12",
  custom_accent: "#e08600",
};

export const DEFAULT_ANNOUNCEMENT: AdminAnnouncement = {
  id: 1,
  message: "Weekend Brunch Pass — 20% Off All Stacks Before 11am!",
  details: "Saturday & Sunday · early birds enjoy 20% discount",
  link_text: "EXPLORE MENU",
  link_url: "/menu",
  image: DEFAULT_DEAL_PHOTO,
  is_active: true,
  starts_at: null,
  ends_at: null,
};

export const DEFAULT_CERTS: AdminCertification[] = [
  { id: 1, icon: "medal", title: "100% Pure Canadian Maple", subtitle: "Grade A dark amber", is_active: true, sort_order: 0 },
  { id: 2, icon: "leaf", title: "Free Range Eggs", subtitle: "Locally sourced", is_active: true, sort_order: 1 },
  { id: 3, icon: "trophy", title: "Award Winning Stacks", subtitle: "Sydney's favourite 2024", is_active: true, sort_order: 2 },
];

export const DEFAULT_PHOTOS: AdminGalleryPhoto[] = [];

export const DEFAULT_STEPS: AdminHomeStep[] = [
  { id: 1, label: "01", title: "Order Online", text: "Pick your favourite stack and customizations.", image: "", sort_order: 0 },
  { id: 2, label: "02", title: "We Griddle Fresh", text: "Made to order with real maple and fresh dairy.", image: "", sort_order: 1 },
  { id: 3, label: "03", title: "Pick Up Hot", text: "Grab your warm stack right on time.", image: "", sort_order: 2 },
];

export const DEFAULT_DISHES: AdminMenuItem[] = [
  {
    slug: "signature-buttermilk",
    name: "Classic Buttermilk Stack",
    description: "Our signature stack with whipped butter & pure maple.",
    price: "14.00",
    tag: "sweet",
    heat: "none",
    kcal: 480,
    protein_g: 14,
    prep_time: "10m",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
    photo: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
    is_featured: true,
    is_available: true,
    sort_order: 0,
  },
  {
    slug: "berry-bliss",
    name: "Berry Bliss",
    description: "Organic blueberries, strawberries, maple syrup, and chantilly cream.",
    price: "17.00",
    tag: "sweet",
    heat: "none",
    kcal: 520,
    protein_g: 12,
    prep_time: "12m",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
    photo: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
    is_featured: true,
    is_available: true,
    sort_order: 1,
  },
];
