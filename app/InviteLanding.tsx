import styles from "./invite.module.css";

type Variant = "restaurant" | "creator";

const COPY: Record<
  Variant,
  { eyebrow: string; titel: string; lead: string; cta: string; href: string; bg: string; wa: string; punten: string[] }
> = {
  restaurant: {
    eyebrow: "Voor restaurants",
    titel: "Boost jouw restaurant met Dinely",
    lead: "Laat creators jouw zaak laten zien aan duizenden lokale volgers. Zet een deal uit, kies je creators en zie de reserveringen binnenkomen.",
    cta: "Aan de slag als restaurant",
    href: "https://business.dinely.nl",
    bg: "/hero.jpg",
    wa: "Ken je Dinely al? Download de app en boost jouw restaurant met creators 🍽️ https://app.dinely.nl/voor-restaurants",
    punten: ["Creators vullen je rustige avonden", "Jij bepaalt de deal en het budget", "Zie per creator wie reserveringen aanbrengt"],
  },
  creator: {
    eyebrow: "Voor creators",
    titel: "Ga betaald bij top restaurants eten",
    lead: "Download de Dinely app, deel content over je bezoek en verdien met deals bij de leukste restaurants bij jou in de buurt.",
    cta: "Download de app",
    href: "https://app.dinely.nl/login",
    bg: "/splash-bg.jpg",
    wa: "Eet betaald bij toprestaurants met Dinely 🤳 Download de app: https://app.dinely.nl/voor-creators",
    punten: ["Gratis of betaald uit eten", "Werk samen met leuke restaurants", "Bouw je profiel en niveau op"],
  },
};

export default function InviteLanding({ variant }: { variant: Variant }) {
  const c = COPY[variant];
  const waHref = `https://wa.me/?text=${encodeURIComponent(c.wa)}`;
  return (
    <div className={styles.wrap}>
      <div className={styles.hero} style={{ backgroundImage: `url(${c.bg})` }}>
        <div className={styles.heroGrad} />
        <div className={styles.brand}>Dine<span>ly</span></div>
      </div>

      <div className={styles.body}>
        <span className={styles.eyebrow}>{c.eyebrow}</span>
        <h1 className={styles.titel}>{c.titel}</h1>
        <p className={styles.lead}>{c.lead}</p>

        <ul className={styles.punten}>
          {c.punten.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>

        <a className={styles.cta} href={c.href}>{c.cta} →</a>
        <a className={styles.wa} href={waHref} target="_blank" rel="noopener noreferrer">
          Deel via WhatsApp
        </a>

        <div className={styles.foot}>Dinely · Amsterdam</div>
      </div>
    </div>
  );
}
