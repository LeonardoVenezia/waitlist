/**
 * Renders the embeddable testimonials widget as a self-contained HTML document
 * (served by `/w/t/[publicKey]` and mounted in an iframe by `public/widget.js`).
 *
 * Variants share the same card markup; only the container/CSS changes.
 */

export type TestimonialWidgetVariant = "grid" | "carousel" | "marquee" | "quote";

export const TESTIMONIAL_WIDGET_VARIANTS: TestimonialWidgetVariant[] = [
  "grid",
  "carousel",
  "marquee",
  "quote",
];

export function isTestimonialWidgetVariant(value: string): value is TestimonialWidgetVariant {
  return (TESTIMONIAL_WIDGET_VARIANTS as string[]).includes(value);
}

export interface WidgetTestimonial {
  name: string;
  company: string | null;
  role: string | null;
  message: string;
  rating: number;
  avatar_url: string | null;
  is_featured?: boolean;
}

/** How many rows each variant should pull from the database. */
export const VARIANT_LIMIT: Record<TestimonialWidgetVariant, number> = {
  grid: 20,
  carousel: 12,
  marquee: 20,
  quote: 1,
};

const BRAND_URL = "https://waitlist.leovenezia.dev";

const BASE_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; color: #14110d; font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .testimonial { min-width: 0; border: 1px solid #d8d3cc; border-radius: 12px; padding: 20px; background: #fcfcfa; }
  .author { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .author img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
  .author div { display: grid; min-width: 0; }
  .author strong, .author span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .author strong { font-size: 14px; }
  .author div span { color: #5a554c; font-size: 12px; }
  .rating { margin-left: auto; color: #9d3e00; white-space: nowrap; font-size: 13px; }
  .testimonial p { margin: 14px 0 0; color: #5a554c; white-space: pre-wrap; overflow-wrap: anywhere; }
  .empty { margin: 0; padding: 24px; text-align: center; color: #5a554c; }
  .brand { display: block; margin-top: 12px; color: #5a554c; font-size: 11px; text-align: center; text-decoration: none; opacity: .75; }`;

const VARIANT_CSS: Record<TestimonialWidgetVariant, string> = {
  grid: `
  .list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 16px; }`,
  carousel: `
  .carousel { position: relative; }
  .track { display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; scrollbar-width: thin; }
  .track .testimonial { flex: 0 0 min(85%, 320px); scroll-snap-align: start; }
  .nav { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
  .nav button { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #d8d3cc; background: #fcfcfa; color: #14110d; cursor: pointer; font-size: 15px; line-height: 1; }
  .nav button:hover { background: #f0ece6; }`,
  marquee: `
  .marquee { overflow: hidden; -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); }
  .marquee .track { display: flex; gap: 16px; width: max-content; animation: wl-scroll 45s linear infinite; }
  .marquee .track:hover { animation-play-state: paused; }
  .marquee .testimonial { flex: 0 0 320px; }
  @keyframes wl-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`,
  quote: `
  .quote { display: flex; justify-content: center; }
  .quote .testimonial { max-width: 640px; width: 100%; padding: 32px; }
  .quote .testimonial p { margin-top: 20px; color: #14110d; font-size: 20px; line-height: 1.5; }
  .quote .author img { width: 48px; height: 48px; }`,
};

export function buildTestimonialWidgetHtml(opts: {
  testimonials: WidgetTestimonial[];
  variant: TestimonialWidgetVariant;
  showBranding: boolean;
}): string {
  const { testimonials, variant, showBranding } = opts;
  const branding = showBranding
    ? `<a class="brand" href="${BRAND_URL}" target="_blank" rel="noopener">Made with Startpack</a>`
    : "";

  const card = (t: WidgetTestimonial) => {
    const avatar = resolveAvatar(t.avatar_url);
    const author = [t.role, t.company].filter(Boolean).join(" · ");
    const filled = Math.max(0, Math.min(5, t.rating));
    return `<article class="testimonial">
      <div class="author">
        ${avatar ? `<img src="${escapeHtml(avatar)}" alt="" />` : ""}
        <div><strong>${escapeHtml(t.name)}</strong>${author ? `<span>${escapeHtml(author)}</span>` : ""}</div>
        <span class="rating" aria-label="${filled} out of 5 stars">${"★".repeat(filled)}${"☆".repeat(5 - filled)}</span>
      </div>
      <p>${escapeHtml(t.message)}</p>
    </article>`;
  };

  if (testimonials.length === 0) {
    return page(variant, `<p class="empty">No public testimonials yet.</p>${branding}`);
  }

  let body: string;
  switch (variant) {
    case "carousel": {
      const items = testimonials.map(card).join("\n");
      body = `<div class="carousel">
        <div class="track" id="wl-track">${items}</div>
        <div class="nav">
          <button type="button" id="wl-prev" aria-label="Previous">‹</button>
          <button type="button" id="wl-next" aria-label="Next">›</button>
        </div>
      </div>
      <script>
        (function () {
          var track = document.getElementById("wl-track");
          if (!track) return;
          function step(dir) { track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: "smooth" }); }
          document.getElementById("wl-prev").addEventListener("click", function () { step(-1); });
          document.getElementById("wl-next").addEventListener("click", function () { step(1); });
        })();
      </script>`;
      break;
    }
    case "marquee": {
      // Duplicate the items so the -50% translate loops seamlessly.
      const items = testimonials.map(card).join("\n");
      body = `<div class="marquee"><div class="track">${items}${items}</div></div>`;
      break;
    }
    case "quote": {
      const featured = testimonials.find((t) => t.is_featured) ?? testimonials[0];
      body = `<div class="quote">${card(featured)}</div>`;
      break;
    }
    default: {
      body = `<main class="list">${testimonials.map(card).join("\n")}</main>`;
    }
  }

  return page(variant, `${body}${branding}`);
}

function page(variant: TestimonialWidgetVariant, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>${BASE_CSS}
${VARIANT_CSS[variant]}
  </style>
</head>
<body>${body}</body>
</html>`;
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]!);
}

export function resolveAvatar(value: string | null) {
  if (!value) return null;
  if (value.startsWith("https://")) return value;
  if (value.startsWith("testimonials/")) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return base ? `${base}/storage/v1/object/public/showcase-images/${value}` : null;
  }
  return null;
}
