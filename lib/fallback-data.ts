import type {
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

export const FALLBACK_MENU: ApiMenuItem[] = [
  { slug: "buttermilk", name: "Classic Buttermilk Stack", description: "Four fluffy buttermilk pancakes with pure maple syrup and whipped butter.", price: "14.00", tag: "sweet", heat: "none", kcal: 680, protein_g: 14, prep_time: "10–12 min", image: "/menu/buttermilk-stack.png", photo: "", photos: [], is_featured: true },
  { slug: "berry", name: "Berry Bliss", description: "Blueberries and strawberries piled high with berry compote and vanilla cream.", price: "17.00", tag: "sweet", heat: "none", kcal: 720, protein_g: 15, prep_time: "12–14 min", image: "/menu/berry.png", photo: "", photos: [], is_featured: true },
  { slug: "choc", name: "Choc Overload", description: "Chocolate pancakes, hazelnut spread, brownie bits and a warm chocolate drizzle.", price: "18.00", tag: "choc", heat: "hot", kcal: 890, protein_g: 16, prep_time: "12–14 min", image: "/menu/choc.png", photo: "", photos: [], is_featured: true },
  { slug: "banana", name: "Banana Caramel", description: "Caramelised banana, salted caramel sauce and crushed roasted pecans.", price: "16.00", tag: "sweet", heat: "none", kcal: 780, protein_g: 13, prep_time: "12–14 min", image: "/menu/banana.png", photo: "", photos: [], is_featured: false },
  { slug: "lemon", name: "Lemon Ricotta", description: "Cloud-light ricotta pancakes with lemon curd and a snowfall of icing sugar.", price: "16.00", tag: "sweet", heat: "none", kcal: 640, protein_g: 18, prep_time: "12–15 min", image: "/menu/lemon.png", photo: "", photos: [], is_featured: false },
  { slug: "brekkie", name: "Big Brekkie Stack", description: "Savoury stack with crispy bacon, fried eggs and maple butter. Sweet meets salty.", price: "19.00", tag: "savoury", heat: "medium", kcal: 840, protein_g: 32, prep_time: "14–16 min", image: "/menu/brekkie.png", photo: "", photos: [], is_featured: false },
];

export const FALLBACK_REVIEWS: ApiReview[] = [
  { name: "Sarah M.", suburb: "Surry Hills", rating: 5, quote: "Best pancakes I've had in Sydney, hands down. The stack is cloud-fluffy and the warm maple butter is addictive.", avatar: "😀" },
  { name: "Daniel K.", suburb: "Parramatta", rating: 5, quote: "Booked online for a birthday brunch — table was ready on the dot, staff were lovely, and the Choc Overload is a monster. We'll be back!", avatar: "🎉" },
  { name: "Priya S.", suburb: "Newtown", rating: 4, quote: "Great vibe, colourful fit-out, quick service. The Lemon Ricotta is genuinely special — light as air and not too sweet.", avatar: "🌱" },
  { name: "Tom B.", suburb: "Manly", rating: 5, quote: "Took the kids on a Tuesday for the special. Fast, friendly, and the banana caramel stack is dangerously good. Our new family regular.", avatar: "👨‍👧" },
  { name: "Jess W.", suburb: "Bondi", rating: 5, quote: "The Big Brekkie Stack lives up to its name. Loved that they do gluten-free batter too — my partner was stoked.", avatar: "🔥" },
];

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

export const FALLBACK_CERTS: ApiCertification[] = [
  { icon: "shield", title: "Food Safety Certified", subtitle: "NSW Food Authority" },
  { icon: "star", title: "5-Star Hygiene Rating", subtitle: "Local Council Inspection" },
  { icon: "trophy", title: "Best Pancakes — Sydney 2025", subtitle: "Local Eats Awards" },
  { icon: "check", title: "HACCP Compliant", subtitle: "Certified Kitchen" },
  { icon: "leaf", title: "Local Produce Partner", subtitle: "NSW Farmers' Network" },
];

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
  hero_heading: "Stack Into",
  hero_script: "Happiness",
  hero_lead:
    "We flip the best homemade pancakes in Sydney — griddled to order, stacked high, drowned in real maple.",
  about_heading: "Fluffy. Golden.",
  about_script: "Fully Stacked.",
  about_image_1: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=75",
  about_image_2: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=75",
  about_image_3: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&q=75",
  about_points:
    "Batter whisked fresh every morning\n100% pure Canadian maple — never syrup-flavoured\nBerries & fruit from local NSW growers\nCloud-light ricotta & buttermilk stacks",
  cta_heading: "Hungry?",
  cta_script: "Book a Table.",
  cta_lead: "Reserve online in seconds — free, instant confirmation, open 7 days.",
  cta_button_label: "Book a Table",
  cta_button_url: "/booking",
  marquee_words: "Fluffy Stacks\nReal Maple\nEst. 1999\nFresh Berries\nZero Guilt\nGriddled Daily",
  footer_tagline: "Fluffy stacks · real maple · est. 1999",
  hero_image: "https://images.unsplash.com/photo-1620991565081-82743a5a499c?w=1200&q=80",
  hero_cutout: "/menu/hero-stack.png",
  about_text:
    "G'day! Every pancake at The Pancake Club is ladled to order onto a buttered griddle, flipped at exactly the right bubble, and stacked warm with real maple. No shortcuts, no pre-mix — just food that feels good.",
  address: "123 George Street, Sydney NSW 2000",
  phone: "(02) 5550 1234",
  whatsapp: "",
  email: "hello@thepancakeclub.com.au",
  abn: "ABN 00 000 000 000",
  map_embed: "https://www.google.com/maps?q=George%20Street%20Sydney%20NSW&output=embed",
  instagram_url: "",
  facebook_url: "",
  timezone: "Australia/Sydney",
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
