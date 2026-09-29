import type { EmailBrand } from "@/lib/email-brand";
import {
  emailButton,
  emailFootnote,
  emailHeading,
  emailP,
  escapeHtml,
  renderEmailDocument,
} from "./layout";

export function renderShowcaseExpiryEmail({
  brand,
  daysLeft,
  productName,
  upgradeUrl,
}: {
  brand: EmailBrand;
  daysLeft: 30 | 7;
  productName: string;
  upgradeUrl: string;
}) {
  const headline =
    daysLeft === 30
      ? "Tu showcase vence en 30 días"
      : "Tu showcase vence en 7 días";

  const message =
    daysLeft === 30
      ? `El producto <strong>${escapeHtml(productName)}</strong> que publicaste en el directorio está por cumplir 1 año. En 30 días lo vamos a retirar automáticamente del showcase público.`
      : `Quedan 7 días antes de que retiremos <strong>${escapeHtml(productName)}</strong> del showcase público. Tus datos quedan guardados, pero el producto deja de ser visible.`;

  const cta = daysLeft === 30 ? "Suscribirme ahora" : "Reactivar mi showcase";

  return renderEmailDocument({
    brand,
    preheader: headline,
    content: [
      emailHeading(brand, headline),
      emailP(brand, message),
      emailP(
        brand,
        `Con el plan <strong>Launch</strong> ($9/mes) tu producto queda publicado sin límite de tiempo, tenés 1.000 emails en la waitlist y acceso a templates de page builder.`,
      ),
      emailButton(brand, { label: cta, url: upgradeUrl }),
      emailFootnote(
        brand,
        `El backlink desde el directorio sigue siendo tuyo mientras el producto esté publicado. Al vencer, perdés esa exposure.`,
      ),
    ].join("\n"),
  });
}
