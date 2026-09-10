export function renderTestimonialInviteEmail({
  productName,
  formUrl,
  senderName,
}: {
  productName: string;
  formUrl: string;
  senderName?: string | null;
}) {
  const from = senderName ? `${senderName} de` : "el equipo de";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px;max-width:480px;margin:0 auto;color:#111;">
  <h1 style="font-size:20px;font-weight:600;margin:0 0 8px;">¿Nos contás tu experiencia?</h1>
  <p style="font-size:14px;color:#555;margin:0 0 16px;line-height:1.5;">
    ${from} <strong>${productName}</strong> nos encantaría saber qué te pareció.
    Dejanos un testimonio corto — nos ayuda muchísimo a seguir mejorando y a
    que más personas conozcan el producto.
  </p>
  <a href="${formUrl}" style="display:inline-block;background:#7a3325;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:500;">Dejar mi testimonio</a>
  <p style="font-size:12px;color:#888;margin:24px 0 0;line-height:1.5;">
    Solo toma un minuto. Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>
    <a href="${formUrl}" style="color:#7a3325;">${formUrl}</a>
  </p>
</body>
</html>`;
}
