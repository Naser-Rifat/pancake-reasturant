import type { Metadata } from "next";
import Image from "next/image";
import { Award, Coffee, Heart, Ticket, Utensils } from "lucide-react";
import { getSite } from "@/lib/api";
import ClubRegistrationForm from "@/components/ClubRegistrationForm";
import styles from "./club.module.css";

export const metadata: Metadata = {
  title: "Join Our Club",
  description:
    "A little more pancake, a little more community. Join The Pancake Club for free and choose whether to hear our latest news.",
  alternates: { canonical: "/join-our-club" },
};

export default async function JoinOurClubPage() {
  const site = await getSite();

  const kicker = site.club_hero_kicker || "The Pancake Club · Geelong West";
  const heading = site.club_hero_heading || "Good food.";
  const script = site.club_hero_script || "Better company.";
  const lead = site.club_hero_lead || "Fluffy homemade stacks, secret tasting invites, and a table always saved for you.";

  const bento1Badge = (site.club_bento_1_badge || "🥞 Fresh Off The Griddle").replace(/[✨✦]/g, "🥞").trim();
  const bento1Img = site.club_bento_1_img || "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80";
  const bento1Title = site.club_bento_1_title || "Signature Stack";
  const bento1Sub = site.club_bento_1_sub || "Whipped butter & maple";

  const bento2Img = site.club_bento_2_img || "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80";
  const bento2Badge = site.club_bento_2_badge || "🥞 Sunday Brunch";
  const bento2Title = site.club_bento_2_title || "Brunch Club";
  const bento2Sub = site.club_bento_2_sub || "Weekend Table";

  const bento3Img = site.club_bento_3_img || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80";
  const bento3Badge = site.club_bento_3_badge || "☕ Geelong West";
  const bento3Title = site.club_bento_3_title || "Our Parlour";
  const bento3Sub = site.club_bento_3_sub || "Open 7 days";

  const passTitle = site.club_pass_title || "FOUNDING MEMBER PASS · NO. 0824";
  const passSub = site.club_pass_sub || "Priority Seasonal Tastings · Secret Drops · Free Forever";
  const passBadge = (site.club_pass_badge || "ALL WELCOME").replace(/[★✦*]/g, "").trim();

  const b1Badge = (site.club_benefit_1_badge || "🥞 SEASONAL TASTES").replace(/[✨✦]/g, "🥞").trim();
  const b1Title = site.club_benefit_1_title || "Seasonal First Tastes";
  const b1Desc = site.club_benefit_1_desc || "Be the first to preview autumn spiced ricotta hotcakes and summer berry compotes before public menu launch.";

  const b2Badge = (site.club_benefit_2_badge || "☕ PARLOUR PERKS").replace(/[✨✦]/g, "☕").trim();
  const b2Title = site.club_benefit_2_title || "Secret Parlour Drops";
  const b2Desc = site.club_benefit_2_desc || "Occasional unlisted griddle specials, birthday stack treats, and intimate tasting invites for Geelong regulars.";

  const b3Badge = site.club_benefit_3_badge || "💛 ZERO STRINGS";
  const b3Title = site.club_benefit_3_title || "Always Your Choice";
  const b3Desc = site.club_benefit_3_desc || "No loyalty cards to scan, no passwords to memorize. Choose your email preference and opt out anytime with one click.";

  return (
    <>
      {/* 1. Master Hero Stage: Cohesive Ambient Presentation */}
      <section className={styles.heroStage}>
        <div className="container">
          <div className={styles.heroBadgeWrap}>
            <span className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} aria-hidden="true">🥞</span>
              <span>{kicker}</span>
            </span>
          </div>
          <h1 id="club-title" className={styles.heroHeading}>
            {heading}{" "}
            <span className={styles.heroScript}>{script}</span>
          </h1>
          <p className={styles.heroLead}>{lead}</p>
        </div>
      </section>

      {/* 2. Main Content Grid: 3-Image Bento Box + Registration Card */}
      <main className={`container ${styles.clubMain}`}>
        {/* Left: The 3-Image Bento Grid Mosaic & Founding Pass */}
        <section className={styles.bentoSection} aria-label="Moments at The Pancake Club">
          <div className={styles.imageBento}>
            {/* Slot 1: Grand Tall Feature Image (Signature Stack) */}
            <div className={styles.bentoSlotTall}>
              <div className={styles.bentoImgFrame}>
                <Image
                  src={bento1Img}
                  alt="Golden buttermilk pancake stack topped with fresh berries, banana and dripping maple syrup"
                  fill
                  sizes="(max-width: 760px) 55vw, (max-width: 1200px) 55vw, 460px"
                  priority
                  className={styles.bentoImg}
                />
              </div>
              <div className={styles.bentoBadge}>
                <span>{bento1Badge}</span>
              </div>
              <div className={styles.bentoCaption}>
                <span className={styles.bentoCaptionTitle}>{bento1Title}</span>
                <span className={styles.bentoCaptionSub}>{bento1Sub}</span>
              </div>
            </div>

            {/* Slot 2: Top Right (Sunday Brunch) */}
            <div className={styles.bentoSlotTopRight}>
              <div className={styles.bentoImgFrame}>
                <Image
                  src={bento2Img}
                  alt="Friends sharing breakfast with fluffy pancakes, eggs and coffee at a wooden café table"
                  fill
                  sizes="(max-width: 760px) 45vw, (max-width: 1200px) 40vw, 320px"
                  priority
                  className={styles.bentoImg}
                />
              </div>
              <div className={styles.bentoBadge}>
                <span>{bento2Badge}</span>
              </div>
              <div className={styles.bentoCaption}>
                <span className={styles.bentoCaptionTitle}>{bento2Title}</span>
                <span className={styles.bentoCaptionSub}>{bento2Sub}</span>
              </div>
            </div>

            {/* Slot 3: Bottom Right (Geelong West Parlour) */}
            <div className={styles.bentoSlotBottomRight}>
              <div className={styles.bentoImgFrame}>
                <Image
                  src={bento3Img}
                  alt="Warm atmospheric interior of The Pancake Club dining room with wooden tables and warm lighting"
                  fill
                  sizes="(max-width: 760px) 45vw, (max-width: 1200px) 40vw, 320px"
                  priority
                  className={styles.bentoImg}
                />
              </div>
              <div className={styles.bentoBadge}>
                <span>{bento3Badge}</span>
              </div>
              <div className={styles.bentoCaption}>
                <span className={styles.bentoCaptionTitle}>{bento3Title}</span>
                <span className={styles.bentoCaptionSub}>{bento3Sub}</span>
              </div>
            </div>
          </div>

          {/* Integrated Founding Member Pass Bar with Brand Doodle Background */}
          <div className={styles.memberPassStrip}>
            <div className={styles.passStripLeft}>
              <span className={styles.passSealSmall}>
                <Award size={18} strokeWidth={2.2} aria-hidden="true" />
              </span>
              <div>
                <strong className={styles.passStripTitle}>{passTitle}</strong>
                <p className={styles.passStripSub}>{passSub}</p>
              </div>
            </div>
            <div className={styles.passStripRight}>
              <span className={styles.passStripBadge}>
                <Ticket size={12} aria-hidden="true" /> {passBadge}
              </span>
            </div>
          </div>
        </section>

        {/* Right: The Parlour Invitation & Registration Card */}
        <section className={styles.card} aria-labelledby="registration-title">
          <div className={styles.cardHeader}>
            <div className={styles.cardBadges}>
              <span className={styles.freePill}>🥞 FREE MEMBERSHIP</span>
              <span className={styles.instantPill}>INSTANT ACCESS</span>
            </div>
            <h2 id="registration-title" className={styles.cardHeading}>
              Join our <span className={styles.headingScript}>Club.</span>
            </h2>
            <p className={styles.cardSub}>
              A shared love of fluffy pancakes. That’s all it takes. Make yourself at home.
            </p>
          </div>

          <div className={styles.cardBody}>
            <ClubRegistrationForm contactEmail={site.email} />
          </div>

          <div className={styles.cardFoot}>
            <span>NO FEES</span>
            <span aria-hidden="true">·</span>
            <span>NO PASSWORDS</span>
            <span aria-hidden="true">·</span>
            <span>CANCEL ANYTIME</span>
          </div>
        </section>
      </main>

      {/* 3. Below: Curated Member Privileges */}
      <section className={`container ${styles.benefits}`} aria-label="Club privileges">
        <div className={styles.benefitCard}>
          <div className={styles.benefitCardHead}>
            <span className={styles.benefitBadge}>{b1Badge}</span>
            <div className={styles.benefitIcon}>
              <Utensils size={18} aria-hidden="true" />
            </div>
          </div>
          <div>
            <h3>{b1Title}</h3>
            <p>{b1Desc}</p>
          </div>
        </div>

        <div className={styles.benefitCard}>
          <div className={styles.benefitCardHead}>
            <span className={styles.benefitBadge}>{b2Badge}</span>
            <div className={styles.benefitIcon}>
              <Coffee size={18} aria-hidden="true" />
            </div>
          </div>
          <div>
            <h3>{b2Title}</h3>
            <p>{b2Desc}</p>
          </div>
        </div>

        <div className={styles.benefitCard}>
          <div className={styles.benefitCardHead}>
            <span className={styles.benefitBadge}>{b3Badge}</span>
            <div className={styles.benefitIcon}>
              <Heart size={18} aria-hidden="true" />
            </div>
          </div>
          <div>
            <h3>{b3Title}</h3>
            <p>{b3Desc}</p>
          </div>
        </div>
      </section>
    </>
  );
}
