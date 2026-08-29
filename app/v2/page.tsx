import Link from "next/link";
import Image from "next/image";
import LogoMark from "@/components/LogoMark";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import FavouritesRail from "@/components/FavouritesRail";
import {
  TAG_LABEL,
  formatTime,
  getAnnouncement,
  getCertifications,
  getGallery,
  getHours,
  getMenuWithStatus,
  getReviews,
  getSite,
  telHref,
  type ApiMenuItem,
} from "@/lib/api";

export const dynamic = "force-dynamic";

const TAG_ORDER: ApiMenuItem["tag"][] = ["sweet", "savoury", "choc"];
const PILL_COLORS = ["gold", "sky", "lav", "peach"];
const MARQUEE = ["Real Maple", "Est. 1999", "Fresh Berries", "Zero Guilt", "Griddled Daily", "Fluffy Stacks"];

/* ---------- line-art doodles (reference style) ---------- */
const Steam = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 18" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M4 16 C2 12, 6 10, 4 6" /><path d="M12 17 C10 12, 14 10, 12 4" /><path d="M20 16 C18 12, 22 10, 20 6" />
  </svg>
);
const Crumbs = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 34 16" className={className} fill="currentColor" aria-hidden="true">
    <circle cx="4" cy="12" r="2" /><circle cx="14" cy="5" r="2.4" /><circle cx="24" cy="10" r="1.8" /><circle cx="31" cy="4" r="1.6" />
  </svg>
);
const CookieDoodle = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 34" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <circle cx="16" cy="18" r="11" fill="currentColor" stroke="none" opacity="0.9" />
    <path d="M32 8 L37 3" /><path d="M34 16 L40 14" /><path d="M30 24 L36 27" />
  </svg>
);
const Signal = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
    <path d="M8 32 a24 24 0 0 1 0 -24" opacity="0" /><path d="M22 30 a10 10 0 0 0 8 -12" /><path d="M18 38 a18 18 0 0 0 14 -22" />
  </svg>
);
const Wheat = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 60 120" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M30 118 V30" />
    <path d="M30 44 C18 40, 14 30, 16 20 C26 22, 32 32, 30 44 Z" />
    <path d="M30 44 C42 40, 46 30, 44 20 C34 22, 28 32, 30 44 Z" />
    <path d="M30 72 C18 68, 14 58, 16 48 C26 50, 32 60, 30 72 Z" />
    <path d="M30 72 C42 68, 46 58, 44 48 C34 50, 28 60, 30 72 Z" />
  </svg>
);
const Smiley = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <circle cx="16" cy="16" r="13" /><circle cx="11" cy="13" r="1.4" fill="currentColor" stroke="none" /><circle cx="21" cy="13" r="1.4" fill="currentColor" stroke="none" /><path d="M10 20 C13 24, 19 24, 22 20" />
  </svg>
);
const Squiggle = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 130 14" className={className} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" aria-hidden="true">
    <path d="M3 10 C 13 2, 23 12, 33 6 S 53 2, 63 8 S 83 12, 93 6 S 113 2, 127 8" />
  </svg>
);
const Dash = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 56 56" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="5 7" strokeLinecap="round" aria-hidden="true">
    <circle cx="28" cy="28" r="24" />
  </svg>
);
const StackLine = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 90 72" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
    <ellipse cx="45" cy="17" rx="26" ry="9" />
    <path d="M19 17 v13 a26 9 0 0 0 52 0 v-13" />
    <path d="M19 30 v13 a26 9 0 0 0 52 0 v-13" />
    <path d="M33 22 q3 5 0 9" /><path d="M45 25 q3 5 0 9" /><path d="M57 22 q3 5 0 9" />
  </svg>
);
/* hand-drawn characters (Doughwey-style naive line art) */
const Peeker = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 110 100" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="74" cy="26" r="15" />
    <path d="M62 15 q6 -9 13 -3 q6 -6 11 1 q6 -2 6 6" />
    <circle cx="69" cy="24" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="78" cy="24" r="1.7" fill="currentColor" stroke="none" />
    <path d="M70 32 q4 3.5 9 0" />
    <path d="M68 41 C56 50 42 56 24 58" />
    <path d="M74 41 C70 58 68 72 68 86" />
    <path d="M68 86 l-9 10 M68 86 l8 10" />
    <path d="M56 48 C46 44 40 38 36 30" />
  </svg>
);
const Carrier = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 96 132" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="48" cy="40" r="15" />
    <path d="M36 29 q6 -9 13 -3 q6 -6 11 1 q5 -2 5 6" />
    <circle cx="43" cy="38" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="52" cy="38" r="1.7" fill="currentColor" stroke="none" />
    <path d="M44 46 q4 3.5 9 0" />
    <path d="M40 54 C38 74 38 88 42 104" />
    <path d="M56 54 C58 74 58 88 54 104" />
    <path d="M42 104 l-10 18 M54 104 l10 18" />
    <path d="M38 50 C26 42 20 32 22 18" />
    <path d="M58 50 C70 42 76 32 74 18" />
  </svg>
);
const Swirl = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 54 60" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M40 6 c10 4 8 16 -2 17 c-8 1 -12 -8 -5 -12 c10 -5 20 4 17 16 c-3 12 -14 20 -26 22" />
    <path d="M18 42 l6 7 M24 49 l-9 3" />
  </svg>
);
const Ring = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 72 72" className={className} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" aria-hidden="true">
    <circle cx="36" cy="36" r="30" opacity="0.9" />
  </svg>
);
const HomeIc = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 11 L12 4 L20 11" /><path d="M6.5 10 V19 H17.5 V10" />
  </svg>
);
const Bag = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 7 h12 l1.5 13 a1.5 1.5 0 0 1 -1.5 1.7 H6 a1.5 1.5 0 0 1 -1.5 -1.7 Z" /><path d="M9 10 V6 a3 3 0 0 1 6 0 v4" />
  </svg>
);

function SpinBadge() {
  return (
    <div className="v2-spin" aria-hidden="true">
      <svg viewBox="0 0 120 120" className="ring">
        <defs>
          <path id="v2ring" d="M60,60 m-48,0 a48,48 0 1,1 96,0 a48,48 0 1,1 -96,0" />
        </defs>
        <text><textPath href="#v2ring">open 7 days • est. 1999 • fresh daily •</textPath></text>
      </svg>
      <span className="v2-spin-center"><LogoMark size={26} /></span>
    </div>
  );
}

export default async function V2Home() {
  const [site, menu, gallery, reviews, certs, hours, announcement] = await Promise.all([
    getSite(),
    getMenuWithStatus(),
    getGallery(),
    getReviews(),
    getCertifications(),
    getHours(),
    getAnnouncement(),
  ]);

  const items = menu.items;
  const featured = items.find((i) => i.is_featured) ?? items[0];
  const collageCut = items.find((i) => i.slug !== featured?.slug && i.image) ?? featured;
  const counts = TAG_ORDER.map((tag) => ({
    tag,
    label: TAG_LABEL[tag],
    count: items.filter((i) => i.tag === tag).length,
  })).filter((c) => c.count > 0);

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;
  const quote = reviews[0];
  const interior = gallery.find((g) => g.album === "interior") ?? gallery[0];
  const miniPhoto = gallery.find((g) => g.album === "food") ?? gallery[1];
  const chefPhoto = gallery.find((g) => g.album === "events") ?? gallery[2];

  // hero headline: "STACK [tag] INTO / HAPPINESS [tag]" — reference's inline-pill trick
  const headingWords = site.hero_heading.split(" ");
  const firstWord = headingWords[0];
  const restWords = headingWords.slice(1).join(" ");

  return (
    <>
      {/* ---------- violet announcement bar ---------- */}
      {announcement && (
        <div className="v2-annc">
          <div className="v2-wrap v2-annc-row">
            <span className="seg">✦ {announcement.message}</span>
            <span className="seg mid">
              {announcement.link_url
                ? <Link href={announcement.link_url}>{announcement.link_text || announcement.message}</Link>
                : announcement.message}
            </span>
            <span className="seg">✦ {announcement.message}</span>
          </div>
        </div>
      )}

      {/* ---------- nav ---------- */}
      <header className="v2-nav">
        <div className="v2-wrap v2-nav-inner">
          <Link href="/v2" className="v2-logo" aria-label="The Pancake Club — home">
            <Image src="/logo.png" alt="The Pancake Club" width={529} height={226} priority />
          </Link>
          <ul className="v2-nav-links">
            <li><Link href="/v2" className="active">Home</Link></li>
            <li><Link href="/menu">Menu</Link></li>
            <li><Link href="/gallery">Gallery</Link></li>
            <li><Link href="/booking">Contact</Link></li>
          </ul>
          <div className="v2-nav-cta">
            <Link href="/booking" className="v2-btn small">Book a Table</Link>
            <Link href="/menu" className="v2-cart" aria-label="Order pickup"><Bag /><span className="v2-cart-dot" /></Link>
          </div>
        </div>
      </header>

      <main className="v2-wrap">
        {/* ---------- hero: white card, inline-pill headline, photo on gold blob ---------- */}
        <section className="v2-hero">
          <div className="v2-hero-card">
            <h1 className="v2-h1">
              <span className="word">{firstWord}<Steam className="v2-steam" /></span>
              <span className="v2-tag lime">Fluffy</span> {restWords} {site.hero_script}
              <span className="v2-tag orange r">Tasty</span>
            </h1>
            <div className="v2-hero-grid">
              <div className="v2-hero-copy">
                <p className="v2-sub">
                  Homemade stacks made from scratch <span className="v2-tag lav dot">Fresh</span>
                </p>
                <p>{site.hero_lead}</p>
                <div className="v2-hero-actions">
                  <Crumbs className="v2-crumbs" />
                  <Link href="/menu" className="v2-btn">Order Now</Link>
                  <Link href="/booking" className="v2-textlink">Book a Table →</Link>
                </div>
              </div>
              <div className="v2-hero-art">
                <div className="v2-hero-blob"><StackLine className="v2-blob-doodle" /></div>
                <div className="v2-hero-cutbox">
                  <Image
                    className="v2-hero-cut"
                    src={site.hero_cutout || "/menu/hero-stack.png"}
                    alt="Our signature stack, fresh off the griddle"
                    fill
                    priority
                    sizes="(min-width: 1024px) 34vw, (min-width: 768px) 48vw, 80vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- marquee strip (V1 energy) ---------- */}
        <div className="v2-marquee" aria-hidden="true">
          <div className="v2-marquee-track">
            <span>{MARQUEE.map((m) => <i key={m}>✦ {m}</i>)}</span>
            <span>{MARQUEE.map((m) => <i key={m}>✦ {m}</i>)}</span>
          </div>
        </div>

        {/* ---------- campaign banner (admin: Site content → Announcement) ---------- */}
        {announcement?.image && (
          <section className="v2-campaign reveal">
            <div>
              <span className="v2-kicker">Right Now At The Club</span>
              <h2>{announcement.message}</h2>
              {announcement.link_url && (
                <Link href={announcement.link_url} className="v2-btn">
                  {announcement.link_text || "Check It Out"}
                </Link>
              )}
            </div>
            <div className="v2-campaign-art">
              <Image src={announcement.image} alt={announcement.message} width={640} height={420} sizes="(min-width: 768px) 44vw, 92vw" />
            </div>
          </section>
        )}

        {/* ---------- featured delight ---------- */}
        {featured && (
          <section className="v2-delight">
            <div className="v2-delight-grid reveal">
              <div className="v2-delight-art">
                <div className="v2-delight-blob">
                  <Image src={featured.image} alt={`${featured.name} pancakes`} width={500} height={500} sizes="340px" />
                </div>
                <SpinBadge />
                <Peeker className="v2-peeker" />
              </div>
              <div>
                <span className="v2-kicker-scr">house favourite —</span>
                <h2>Your Only <CookieDoodle className="v2-inline-doodle" /><br />Dose of Delight</h2>
                <p className="v2-featured-label">Featured Item -</p>
                <div className="v2-item-row">
                  <Image src={featured.image} alt="" width={64} height={64} />
                  <div>
                    <div className="v2-item-name">{featured.name}</div>
                    <div className="v2-item-sub">{TAG_LABEL[featured.tag]}{featured.prep_time ? ` · ${featured.prep_time}` : ""}</div>
                  </div>
                  <div className="v2-item-price">${parseFloat(featured.price)}</div>
                </div>
                <p className="desc">{featured.description}</p>
                <div className="v2-delight-meta">
                  <Link href="/menu" className="v2-btn">Add To Order</Link>
                  {featured.kcal != null && <span className="v2-mchip">🔥 {featured.kcal} kcal</span>}
                  {featured.prep_time && <span className="v2-mchip">⏱ {featured.prep_time}</span>}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ---------- our favourites: category pills + editorial rail ---------- */}
        <section className="v2-favs reveal">
          <FavouritesRail
            items={items}
            variant="v2"
            title={<h2>What We Stack Here Daily<Swirl className="v2-swirl" /></h2>}
            middle={
              <div className="v2-band-head sub">
                <div>
                  <h2>Our Favourites</h2>
                  <p className="v2-favs-sub">Top picks that&apos;ll make you smile</p>
                </div>
                <Link href="/menu" className="v2-btn small">View Full Menu</Link>
              </div>
            }
          />
        </section>

        {/* ---------- dark story panel ---------- */}
        <section className="v2-story reveal">
          <span className="v2-dots" aria-hidden="true" />
          <div className="v2-story-photo">
            <Image src={interior?.image ?? site.hero_image} alt={interior?.alt ?? "Inside The Pancake Club"} width={700} height={600} sizes="(min-width: 768px) 40vw, 90vw" />
            <Signal className="v2-signal" />
          </div>
          <div>
            <h2>Why Is Pancaking Considered An Art Form?</h2>
            <p>{site.about_text}</p>
            <p className="v2-promise">
              From the first ladle to the last drizzle — every stack is hand-flipped,
              hand-stacked, and heart-approved.
            </p>
            <Link href="/menu" className="v2-btn on-dark">See The Menu</Link>
          </div>
          <Wheat className="v2-wheat" />
        </section>

        {/* ---------- why special: collage ---------- */}
        <section className="v2-special">
          <div className="v2-special-head reveal">
            <h2>
              Why The Club&apos;s <Smiley className="v2-inline-doodle" /> Stacks Are So Special{" "}
              <Squiggle className="v2-squiggle inline" /> To Customers?
            </h2>
            <span className="v2-shopnow"><span className="line" /><Link href="/menu" className="v2-btn small">Shop Now</Link></span>
          </div>

          <div className="v2-collage reveal">
            <div className="v2-cut">
              <Dash className="v2-dash" />
              {collageCut && <Image src={collageCut.image} alt={`${collageCut.name} pancakes`} width={500} height={500} sizes="360px" />}
            </div>
            <div className="v2-mini">
              <span className="v2-mini-ic"><HomeIc /></span>
              <div>
                {miniPhoto && <Image src={miniPhoto.image} alt={miniPhoto.alt} width={400} height={300} sizes="260px" />}
              </div>
            </div>
            {featured && (
              <div className="v2-brown-tile">
                <b>Taste the real {featured.name}.</b>
                <span className="price">${parseFloat(featured.price)}</span>
                {collageCut && <Image className="v2-brown-photo" src={collageCut.image} alt="" width={110} height={110} />}
              </div>
            )}
            <div className="v2-chef">
              <span className="v2-tag lime r">House Fave</span>
              <div className="ph">
                {chefPhoto && <Image src={chefPhoto.image} alt={chefPhoto.alt} width={500} height={600} sizes="(min-width: 768px) 30vw, 90vw" />}
              </div>
            </div>
            {quote && (
              <div className="v2-quote">
                <div className="mark">&ldquo;</div>
                <p>{quote.quote}</p>
                <div className="who">— {quote.name}{quote.suburb ? `, ${quote.suburb}` : ""}</div>
              </div>
            )}
          </div>

          {certs.length > 0 && (
            <div className="v2-certs reveal">
              {certs.map((c) => (
                <span className="v2-cert" key={c.title}>{c.icon} {c.title}</span>
              ))}
            </div>
          )}
        </section>

        {/* ---------- wavy brand strip (Doughwey move) ---------- */}
        <div className="v2-wave reveal" aria-hidden="true">
          <Carrier className="v2-wave-char" />
          <svg viewBox="0 0 1200 190" className="v2-wave-svg">
            <defs>
              <path id="v2wavepath" d="M20,130 C280,40 560,175 860,80 C1010,32 1130,66 1185,50" fill="none" />
            </defs>
            <text><textPath href="#v2wavepath" startOffset="8%">Fluffy. Golden. Always Stacked.</textPath></text>
          </svg>
          <Image className="v2-wave-cut" src="/menu/hero-stack.png" alt="" width={220} height={205} />
        </div>

        {/* ---------- gallery band (V1 lavender) ---------- */}
        {gallery.length > 0 && (
          <section className="v2-gal-band reveal">
            <div className="v2-band-head">
              <h2>From Our Gallery</h2>
              <Link href="/gallery" className="v2-btn small">See Full Gallery</Link>
            </div>
            <div className="v2-gal-grid">
              {gallery.slice(0, 6).map((g) => (
                <div className="ph" key={g.image}>
                  <Image src={g.image} alt={g.alt} width={420} height={320} sizes="(min-width: 768px) 30vw, 45vw" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------- rating strip ---------- */}
        <section className="v2-rate reveal">
          {featured && (
            <div className="v2-rate-corner">
              <Image src={featured.image} alt="" width={140} height={140} />
            </div>
          )}
          <div className="v2-rate-copy">
            <Ring className="v2-ring-doodle" />
            <h2>With Enough Maple, Anything Is Good!</h2>
            <p className="tagline">
              <span className="v2-avatar"><LogoMark size={16} /></span>
              Fluffy stacks · real maple · est. 1999 — <Link href="/menu">What are we stacking?</Link>
            </p>
          </div>
          {avgRating != null && (
            <div className="v2-score">
              <span className="num">{avgRating}</span>
              <div>
                <div className="stars">{"★".repeat(Math.round(avgRating))}</div>
                <div className="cnt">Based on {reviews.length} review{reviews.length === 1 ? "" : "s"}</div>
              </div>
            </div>
          )}
          <div className="v2-rate-pills">
            {items.slice(0, 6).map((i) => <span key={i.slug}>{i.name}</span>)}
          </div>
          {reviews.length > 0 && (
            <div className="v2-rev-cards">
              {reviews.slice(0, 3).map((r) => (
                <div className="v2-rev-card" key={r.name + r.quote.slice(0, 12)}>
                  <div className="stars">{"★".repeat(r.rating)}</div>
                  <p>&ldquo;{r.quote}&rdquo;</p>
                  <div className="who">{r.avatar} {r.name}{r.suburb ? ` · ${r.suburb}` : ""}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---------- hours & location (V1 mint band) ---------- */}
        <section className="v2-hours-band reveal">
          <div>
            <h2>Hours &amp; Location</h2>
            <p className="addr">{site.address}</p>
            <a href={telHref(site.phone)} className="v2-btn small">Call {site.phone}</a>
          </div>
          <div className="v2-hours-rows">
            {hours.map((h) => (
              <div className="row" key={h.label}>
                <span>{h.label}</span>
                <span className="t">{formatTime(h.opens)} – {formatTime(h.closes)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- big lavender CTA (V1 band) ---------- */}
        <section className="v2-cta-band reveal">
          <h2>Hungry? Book a Table</h2>
          <p>Reserve online in seconds — free, instant confirmation, open 7 days.</p>
          <Link href="/booking" className="v2-btn">Book a Table</Link>
        </section>
      </main>

      {/* ---------- footer ---------- */}
      <footer className="v2-footer">
        <div className="v2-wrap">
          <div className="v2-footer-top">
            <div className="v2-logo">the pancake club<span className="dot">.</span></div>
            <ul className="v2-footer-links">
              <li><Link href="/v2">Home</Link></li>
              <li><Link href="/menu">Menu</Link></li>
              <li><Link href="/gallery">Gallery</Link></li>
              <li><Link href="/booking">Book a Table</Link></li>
              <li><a href={telHref(site.phone)}>{site.phone}</a></li>
            </ul>
          </div>
          <div className="v2-footer-mark" aria-hidden="true">The Pancake Club</div>
          <small>Design V2 preview · {site.address} · {site.abn}</small>
        </div>
      </footer>
      {site.whatsapp && <WhatsAppFloat phone={site.whatsapp} />}
    </>
  );
}
