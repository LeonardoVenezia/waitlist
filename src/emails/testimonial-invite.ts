import type { EmailBrand } from "@/lib/email-brand";
import {
  emailButton,
  emailFootnote,
  emailHeading,
  emailLink,
  emailP,
  escapeHtml,
  renderEmailDocument,
} from "./layout";

export function renderTestimonialInviteEmail({
  brand,
  productName,
  formUrl,
  senderName,
}: {
  brand: EmailBrand;
  productName: string;
  formUrl: string;
  senderName?: string | null;
}) {
  const from = senderName ? `${escapeHtml(senderName)} de` : "el equipo de";

  return renderEmailDocument({
    brand,
    preheader: `Contanos tu experiencia con ${productName}`,
    content: [
      emailHeading(brand, "¿Nos contás tu experiencia?"),
      emailP(
        brand,
        `${from} <strong>${escapeHtml(productName)}</strong> nos encantaría saber qué te pareció.
    Dejanos un testimonio corto — nos ayuda muchísimo a seguir mejorando y a
    que más personas conozcan el producto.`,
        { preLine: true },
      ),
      emailButton(brand, { label: "Dejar mi testimonio", url: formUrl }),
      emailFootnote(
        brand,
        `Solo toma un minuto. Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>${emailLink(brand, formUrl, escapeHtml(formUrl))}`,
      ),
    ].join("\n"),
  });
}
