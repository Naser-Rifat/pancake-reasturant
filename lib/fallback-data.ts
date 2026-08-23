import type { ApiGalleryPhoto, ApiMenuItem, ApiOpeningHours, ApiReview } from "./api";

// Snapshot of the seeded backend content. Used when the API is unreachable so
// the storefront still renders — keep in sync with `backend seed_demo`.

export const FALLBACK_MENU: ApiMenuItem[] = [
  { slug: "buttermilk", name: "Classic Buttermilk Stack", description: "Four fluffy buttermilk pancakes with pure maple syrup and whipped butter.", price: "14.00", tag: "sweet", heat: "none", kcal: 680, protein_g: 14, prep_time: "10–12 min", image: "/menu/buttermilk.png", is_featured: true },
  { slug: "berry", name: "Berry Bliss", description: "Blueberries and strawberries piled high with berry compote and vanilla cream.", price: "17.00", tag: "sweet", heat: "none", kcal: 720, protein_g: 15, prep_time: "12–14 min", image: "/menu/berry.png", is_featured: true },
  { slug: "choc", name: "Choc Overload", description: "Chocolate pancakes, hazelnut spread, brownie bits and a warm chocolate drizzle.", price: "18.00", tag: "choc", heat: "hot", kcal: 890, protein_g: 16, prep_time: "12–14 min", image: "/menu/choc.png", is_featured: true },
  { slug: "banana", name: "Banana Caramel", description: "Caramelised banana, salted caramel sauce and crushed roasted pecans.", price: "16.00", tag: "sweet", heat: "none", kcal: 780, protein_g: 13, prep_time: "12–14 min", image: "/menu/banana.png", is_featured: false },
  { slug: "lemon", name: "Lemon Ricotta", description: "Cloud-light ricotta pancakes with lemon curd and a snowfall of icing sugar.", price: "16.00", tag: "sweet", heat: "none", kcal: 640, protein_g: 18, prep_time: "12–15 min", image: "/menu/lemon.png", is_featured: false },
  { slug: "brekkie", name: "Big Brekkie Stack", description: "Savoury stack with crispy bacon, fried eggs and maple butter. Sweet meets salty.", price: "19.00", tag: "savoury", heat: "medium", kcal: 840, protein_g: 32, prep_time: "14–16 min", image: "/menu/brekkie.png", is_featured: false },
];

export const FALLBACK_REVIEWS: ApiReview[] = [
  { name: "Sarah M.", suburb: "Surry Hills", rating: 5, quote: "Best pancakes I've had in Sydney, hands down. The stack is cloud-fluffy and the warm maple butter is addictive.", avatar: "😀" },
  { name: "Daniel K.", suburb: "Parramatta", rating: 5, quote: "Booked online for a birthday brunch — table was ready on the dot, staff were lovely, and the Choc Overload is a monster. We'll be back!", avatar: "🎉" },
  { name: "Priya S.", suburb: "Newtown", rating: 4, quote: "Great vibe, colourful fit-out, quick service. The Lemon Ricotta is genuinely special — light as air and not too sweet.", avatar: "🌱" },
  { name: "Tom B.", suburb: "Manly", rating: 5, quote: "Took the kids on a Tuesday for the special. Fast, friendly, and the banana caramel stack is dangerously good. Our new family regular.", avatar: "👨‍👧" },
  { name: "Jess W.", suburb: "Bondi", rating: 5, quote: "The Big Brekkie Stack lives up to its name. Loved that they do gluten-free batter too — my partner was stoked.", avatar: "🔥" },
];

export const FALLBACK_GALLERY: ApiGalleryPhoto[] = [
  { album: "food", caption: "The Classic Buttermilk, fresh off the griddle", image: "https://images.unsplash.com/photo-1575853121743-60c24f0a7502?w=700&q=70", alt: "Classic buttermilk pancake stack" },
  { album: "food", caption: "Berry Bliss — piled high", image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=700&q=70", alt: "Berry pancake stack" },
  { album: "interior", caption: "Our main dining room", image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=700&q=70", alt: "Restaurant interior" },
  { album: "food", caption: "Honey drizzle in slow motion", image: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=700&q=70", alt: "Pancakes with honey drizzle" },
  { album: "events", caption: "Birthday night at KRUSH", image: "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=700&q=70", alt: "Friends celebrating at dinner" },
  { album: "interior", caption: "Window seats for people-watching", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=700&q=70", alt: "Cosy dining space" },
  { album: "food", caption: "Banana Caramel, salted-caramel heaven", image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=700&q=70", alt: "Banana caramel pancakes" },
  { album: "events", caption: "Cheers to the weekend", image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=700&q=70", alt: "Group toast at the table" },
  { album: "interior", caption: "The bar, ready for service", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=70", alt: "Restaurant bar area" },
  { album: "food", caption: "Choc Overload — no regrets", image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=700&q=70", alt: "Chocolate pancakes" },
  { album: "events", caption: "Family dinners done right", image: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=700&q=70", alt: "Family dining event" },
  { album: "interior", caption: "Warm lights, warmer welcomes", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&q=70", alt: "Restaurant seating area" },
  { album: "food", caption: "The full brekkie spread", image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=700&q=70", alt: "Breakfast pancake spread" },
  { album: "events", caption: "Date night, sorted", image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=700&q=70", alt: "Dinner table for two" },
  { album: "food", caption: "Lemon Ricotta under a snowfall of sugar", image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=700&q=70", alt: "Lemon ricotta pancakes" },
  { album: "interior", caption: "Room for the whole crew", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&q=70", alt: "Large dining area" },
];

export const FALLBACK_HOURS: ApiOpeningHours[] = [
  { label: "Monday – Thursday", opens: "11:00:00", closes: "21:00:00" },
  { label: "Friday – Saturday", opens: "11:00:00", closes: "23:00:00" },
  { label: "Sunday", opens: "11:00:00", closes: "20:00:00" },
  { label: "Public Holidays", opens: "12:00:00", closes: "20:00:00" },
];
