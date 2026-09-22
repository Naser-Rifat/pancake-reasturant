import type {
  ApiAnnouncement,
  ApiCategory,
  ApiHomeStep,
  ApiCertification,
  ApiGalleryPhoto,
  ApiMenuItem,
  ApiOpeningHours,
  ApiReview,
  ApiSiteSettings,
} from "./api";

// Snapshot of the seeded backend content. Used when the API is unreachable so
// the storefront still renders — keep in sync with `backend seed_demo`.

export const FALLBACK_CATEGORIES: ApiCategory[] = [
  { id: 1, name: "Sweet Favourites", slug: "sweet-favourites", icon: "🍯", description: "Fluffy dessert pancakes", sort_order: 1, is_active: true, dish_count: 4 },
  { id: 2, name: "Chocolate Blasts", slug: "chocolate-blasts", icon: "🍫", description: "Rich chocolate indulgences", sort_order: 2, is_active: true, dish_count: 2 },
  { id: 3, name: "Savoury Creations", slug: "savoury-creations", icon: "🥑", description: "Hearty savoury stacks", sort_order: 3, is_active: true, dish_count: 2 },
  { id: 4, name: "Drinks & Ice Creams", slug: "drinks-ice-creams", icon: "🍨", description: "Artisan shakes and cold-pressed juices", sort_order: 4, is_active: true, dish_count: 2 },
  { id: 5, name: "Brunch", slug: "brunch", icon: "🥞", description: "Gourmet daytime brunch classics", sort_order: 5, is_active: true, dish_count: 1 },
  { id: 6, name: "Dinner", slug: "dinner", icon: "🍽️", description: "Evening savoury plates and loaded stacks", sort_order: 6, is_active: true, dish_count: 1 },
  { id: 7, name: "Coffee", slug: "coffee", icon: "☕", description: "Victorian specialty roasted espresso and brews", sort_order: 7, is_active: true, dish_count: 1 },
  { id: 8, name: "Kids", slug: "kids", icon: "🧒", description: "Mini stackers and treats for little clubbers", sort_order: 8, is_active: true, dish_count: 1 },
];

// Never advertise an offer when the API cannot prove it is still active.
export const FALLBACK_CAMPAIGNS: ApiAnnouncement[] = [];

export const FALLBACK_MENU: ApiMenuItem[] = [
  { slug: "buttermilk", name: "Classic Buttermilk Stack", description: "Four fluffy buttermilk pancakes with pure maple syrup and whipped butter.", price: "14.00", tag: "sweet-favourites", category_name: "Sweet Favourites", category_slug: "sweet-favourites", category_icon: "🍯", heat: "none", kcal: 680, protein_g: 14, prep_time: "10–12 min", image: "/menu/buttermilk-stack.png", photo: "", photos: [], is_featured: true },
  { slug: "berry", name: "Berry Bliss", description: "Blueberries and strawberries piled high with berry compote and vanilla cream.", price: "17.00", tag: "sweet-favourites", category_name: "Sweet Favourites", category_slug: "sweet-favourites", category_icon: "🍯", heat: "none", kcal: 720, protein_g: 15, prep_time: "12–14 min", image: "/menu/berry.png", photo: "", photos: [], is_featured: true },
  { slug: "choc", name: "Choc Overload", description: "Chocolate pancakes, hazelnut spread, brownie bits and a warm chocolate drizzle.", price: "18.00", tag: "chocolate-blasts", category_name: "Chocolate Blasts", category_slug: "chocolate-blasts", category_icon: "🍫", heat: "hot", kcal: 890, protein_g: 16, prep_time: "12–14 min", image: "/menu/choc.png", photo: "", photos: [], is_featured: true },
  { slug: "banana", name: "Banana Caramel", description: "Caramelised banana, salted caramel sauce and crushed roasted pecans.", price: "16.00", tag: "sweet-favourites", category_name: "Sweet Favourites", category_slug: "sweet-favourites", category_icon: "🍯", heat: "none", kcal: 780, protein_g: 13, prep_time: "12–14 min", image: "/menu/banana.png", photo: "", photos: [], is_featured: false },
  { slug: "lemon", name: "Lemon Ricotta", description: "Cloud-light ricotta pancakes with lemon curd and a snowfall of icing sugar.", price: "16.00", tag: "sweet-favourites", category_name: "Sweet Favourites", category_slug: "sweet-favourites", category_icon: "🍯", heat: "none", kcal: 640, protein_g: 18, prep_time: "12–15 min", image: "/menu/lemon.png", photo: "", photos: [], is_featured: false },
  { slug: "brekkie", name: "Big Brekkie Stack", description: "Savoury stack with crispy bacon, fried eggs and maple butter. Sweet meets salty.", price: "19.00", tag: "savoury-creations", category_name: "Savoury Creations", category_slug: "savoury-creations", category_icon: "🥑", heat: "medium", kcal: 840, protein_g: 32, prep_time: "14–16 min", image: "/menu/brekkie.png", photo: "", photos: [], is_featured: false },
  { slug: "iced-shake", name: "Artisan Milkshake & Thickshakes", description: "Hand-spun gelato milkshakes with double whipped cream and waffle crunch.", price: "9.00", tag: "drinks-ice-creams", category_name: "Drinks & Ice Creams", category_slug: "drinks-ice-creams", category_icon: "🍨", heat: "none", kcal: 480, protein_g: 8, prep_time: "5–7 min", image: "/menu/banana.png", photo: "", photos: [], is_featured: false },
  { slug: "cold-juice", name: "Cold Pressed Sunshine Juice", description: "Freshly squeezed Valencia oranges, crushed strawberries, and Valencia mint.", price: "7.50", tag: "drinks-ice-creams", category_name: "Drinks & Ice Creams", category_slug: "drinks-ice-creams", category_icon: "🍨", heat: "none", kcal: 160, protein_g: 2, prep_time: "3–5 min", image: "/menu/berry.png", photo: "", photos: [], is_featured: false },
  { slug: "avo-brunch", name: "Avocado & Poached Eggs Brunch", description: "Smashed Hass avocado, two golden free-range poached eggs, crumbled feta & dukkah on toasted sourdough.", price: "18.50", tag: "brunch", category_name: "Brunch", category_slug: "brunch", category_icon: "🥞", heat: "none", kcal: 590, protein_g: 19, prep_time: "10–12 min", image: "/menu/brekkie.png", photo: "", photos: [], is_featured: false },
  { slug: "maple-chicken", name: "Crispy Maple Fried Chicken Stack", description: "Crispy golden buttermilk fried chicken tenders layered between fluffy stacks with spiced maple butter.", price: "21.00", tag: "dinner", category_name: "Dinner", category_slug: "dinner", category_icon: "🍽️", heat: "medium", kcal: 960, protein_g: 38, prep_time: "14–16 min", image: "/menu/brekkie.png", photo: "", photos: [], is_featured: false },
  { slug: "espresso-brew", name: "Specialty Flat White & Batch Brew", description: "Double-shot Victorian roasted specialty espresso with silky textured milk.", price: "5.00", tag: "coffee", category_name: "Coffee", category_slug: "coffee", category_icon: "☕", heat: "none", kcal: 140, protein_g: 6, prep_time: "3–5 min", image: "/menu/buttermilk-stack.png", photo: "", photos: [], is_featured: false },
  { slug: "kids-mini-stack", name: "Little Stackers Mini Pancakes", description: "Three palm-sized fluffy pancakes, pure maple drizzle, fresh strawberries, and vanilla ice cream.", price: "10.00", tag: "kids", category_name: "Kids", category_slug: "kids", category_icon: "🧒", heat: "none", kcal: 390, protein_g: 8, prep_time: "7–9 min", image: "/menu/berry.png", photo: "", photos: [], is_featured: false },
];

// Reviews are trust claims. An outage must not publish demo testimonials or
// generate an aggregateRating in structured data.
export const FALLBACK_REVIEWS: ApiReview[] = [];

export const FALLBACK_GALLERY: ApiGalleryPhoto[] = [
  { album: "food", focus: "center" as const, caption: "The Classic Buttermilk, fresh off the griddle", image: "https://images.unsplash.com/photo-1575853121743-60c24f0a7502?w=700&q=70", alt: "Classic buttermilk pancake stack" },
  { album: "food", focus: "center" as const, caption: "Berry Bliss — piled high", image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=700&q=70", alt: "Berry pancake stack" },
  { album: "interior", focus: "center" as const, caption: "Our main dining room", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=700&q=70", alt: "Bright cafe dining room" },
  { album: "food", focus: "center" as const, caption: "Honey drizzle in slow motion", image: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=700&q=70", alt: "Pancakes with honey drizzle" },
  { album: "events", focus: "center" as const, caption: "Sunday brunch club", image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=700&q=70", alt: "Brunch table spread with waffles and juice" },
  { album: "interior", focus: "center" as const, caption: "Window seats for people-watching", image: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=700&q=70", alt: "Sunny window table with coffee" },
  { album: "food", focus: "center" as const, caption: "Banana Caramel, salted-caramel heaven", image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=700&q=70", alt: "Banana caramel pancakes" },
  { album: "food", focus: "center" as const, caption: "Weekend special — cinnamon swirls", image: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=700&q=70", alt: "Cinnamon scrolls dusted with sugar" },
  { album: "interior", focus: "center" as const, caption: "The brew bar, ready for service", image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=700&q=70", alt: "Pour-over coffee being brewed" },
  { album: "food", focus: "center" as const, caption: "Choc Overload — no regrets", image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=700&q=70", alt: "Chocolate pancakes" },
  { album: "events", focus: "center" as const, caption: "Birthday parties welcome", image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=700&q=70", alt: "Pastel party balloons" },
  { album: "interior", focus: "center" as const, caption: "Sunny seats out the front", image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=700&q=70", alt: "Street-side cafe tables with flowers" },
  { album: "food", focus: "center" as const, caption: "The full brekkie spread", image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=700&q=70", alt: "Breakfast pancake spread" },
  { album: "events", focus: "center" as const, caption: "Coffee dates welcome", image: "https://images.unsplash.com/photo-1543269664-56d93c1b41a6?w=700&q=70", alt: "Guest laughing over coffee" },
  { album: "food", focus: "center" as const, caption: "Lemon Ricotta under a snowfall of sugar", image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=700&q=70", alt: "Lemon ricotta pancakes" },
  { album: "interior", focus: "center" as const, caption: "Room for the whole crew", image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=700&q=70", alt: "Long communal tables in the cafe" },
];

// Certifications and awards are hidden until the backend returns records that
// staff have verified and deliberately activated.
export const FALLBACK_CERTS: ApiCertification[] = [];

export const FALLBACK_HOME_STEPS: ApiHomeStep[] = [
  { id: 1, label: "Step 1", title: "Order online",
    text: "Pick your stacks on the menu — pay nothing until you collect.",
    image: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800&q=75", sort_order: 0 },
  { id: 2, label: "Step 2", title: "We griddle fresh",
    text: "Your order hits the griddle the moment it lands — never before.",
    image: "https://images.unsplash.com/photo-1590137876181-2a5a7e340308?w=800&q=75", sort_order: 1 },
  { id: 3, label: "Step 3", title: "Pick up hot",
    text: "Ready in about 15 minutes. Grab it warm and get stuck in.",
    image: "https://images.unsplash.com/photo-1620991565081-82743a5a499c?w=800&q=75", sort_order: 2 },
];

export const FALLBACK_SITE: ApiSiteSettings = {
  hero_heading: "Welcome to",
  hero_script: "The Club",
  hero_lead:
    "We pour our hearts into every stack, so you can enjoy fresh pancakes with the people you love.",
  about_heading: "Fluffy. Golden.",
  about_script: "Fully Stacked.",
  about_image_1: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=75",
  about_image_2: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=75",
  about_image_3: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&q=75",
  about_points:
    "Made to order on the griddle\nSweet and savoury choices\nDine in or order pickup\nFreshly prepared for every guest",
  cta_heading: "HUNGRY",
  cta_script: "Book a table now!",
  cta_lead: "Brunch with friends, a family catch-up or a late-night craving",
  cta_button_label: "BOOK A TABLE",
  cta_button_url: "/booking",
  marquee_words: "Fluffy Stacks\nSweet & Savoury\nMade to Order\nBrunch Together\nPickup Ready",
  footer_tagline: "Fluffy stacks · made to order",
  menu_hero_heading: "Pick your",
  menu_hero_script: "Favourites",
  menu_hero_lead: "Freshly made and served with love",
  gallery_hero_kicker: "Feast Your Eyes",
  gallery_hero_heading: "The",
  gallery_hero_script: "Gallery.",
  gallery_hero_lead: "Our food, our space, and the good times in between.",
  booking_hero_kicker: "Request Online — Free & Easy",
  booking_hero_heading: "Book a",
  booking_hero_script: "Table.",
  booking_hero_lead: "Pick a date, pick a time — we'll have the griddle hot when you arrive.",
  club_hero_kicker: "The Pancake Club",
  club_hero_heading: "Good food.",
  club_hero_script: "Better company.",
  club_hero_lead: "Fluffy homemade stacks, secret tasting invites, and a table always saved for you.",
  club_bento_1_img: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80",
  club_bento_1_badge: "🥞 Fresh Off The Griddle",
  club_bento_1_title: "Signature Stack",
  club_bento_1_sub: "Warm from the griddle",
  club_bento_2_img: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80",
  club_bento_2_badge: "🥞 Sunday Brunch",
  club_bento_2_title: "Brunch Club",
  club_bento_2_sub: "Weekend Table",
  club_bento_3_img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
  club_bento_3_badge: "☕ Our local parlour",
  club_bento_3_title: "Our Parlour",
  club_bento_3_sub: "Open 7 days",
  club_pass_title: "FOUNDING MEMBER PASS · NO. 0824",
  club_pass_sub: "Priority Seasonal Tastings · Secret Drops · Free Forever",
  club_pass_badge: "ALL WELCOME",
  club_benefit_1_badge: "🥞 SEASONAL TASTES",
  club_benefit_1_title: "Seasonal First Tastes",
  club_benefit_1_desc: "Be the first to preview autumn spiced ricotta hotcakes and summer berry compotes before public menu launch.",
  club_benefit_2_badge: "☕ PARLOUR PERKS",
  club_benefit_2_title: "Secret Parlour Drops",
  club_benefit_2_desc: "Occasional unlisted griddle specials, birthday stack treats, and intimate tasting invites for local regulars.",
  club_benefit_3_badge: "💛 ZERO STRINGS",
  club_benefit_3_title: "Always Your Choice",
  club_benefit_3_desc: "No loyalty cards to scan, no passwords to memorize. Choose your email preference and opt out anytime with one click.",
  hero_image: "https://images.unsplash.com/photo-1620991565081-82743a5a499c?w=1200&q=80",
  hero_cutout: "/menu/hero-stack.png",
  about_text:
    "G'day! The Pancake Club is a place for warm stacks, relaxed catch-ups, and good food.",
  address: "",
  phone: "+61 452 135 499",
  whatsapp: "",
  email: "hello@thepancakeclub.com.au",
  abn: "",
  map_embed: "",
  transit_badges: "",
  show_transit_badges: false,
  instagram_url: "",
  facebook_url: "",
  uber_eats_url: "",
  online_ordering_enabled: true,
  online_ordering_disabled_message: "Online ordering is temporarily paused. Please visit us or call to place an order.",
  order_prep_time: "15–20 mins",
  timezone: "Australia/Melbourne",
  theme: "maple",
  custom_primary: "#efbf38",
  custom_accent: "#e08600",
};

export const FALLBACK_HOURS: ApiOpeningHours[] = [
  { label: "Monday – Thursday", opens: "11:00:00", closes: "21:00:00" },
  { label: "Friday – Saturday", opens: "11:00:00", closes: "23:00:00" },
  { label: "Sunday", opens: "11:00:00", closes: "20:00:00" },
  { label: "Public Holidays", opens: "12:00:00", closes: "20:00:00" },
];
