export function renderShowcaseExpiryEmail({
  daysLeft,
  productName,
  upgradeUrl,
}: {
  daysLeft: 30 | 7
  productName: string
  upgradeUrl: string
}) {
  const headline =
    daysLeft === 30
      ? "Tu showcase vence en 30 días"
      : "Tu showcase vence en 7 días"

  const message =
    daysLeft === 30
      ? `El producto <strong>${productName}</strong> que publicaste en el directorio está por cumplir 1 año. En 30 días lo vamos a retirar automáticamente del showcase público.`
      : `Quedan 7 días antes de que retiremos <strong>${productName}</strong> del showcase público. Tus datos quedan guardados, pero el producto deja de ser visible.`

  const cta = daysLeft === 30 ? "Suscribirme ahora" : "Reactivar mi showcase"

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px;max-width:480px;margin:0 auto;color:#111;">
  <h1 style="font-size:20px;font-weight:600;margin:0 0 8px;">${headline}</h1>
  <p style="font-size:14px;color:#555;margin:0 0 16px;line-height:1.5;">${message}</p>
  <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.5;">
    Con el plan <strong>Launch</strong> ($9/mes) tu producto queda publicado sin límite de tiempo, tenés 1.000 emails en la waitlist y acceso a templates de page builder.
  </p>
  <a href="${upgradeUrl}" style="display:inline-block;background:#22c563;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:500;">${cta}</a>
  <p style="font-size:12px;color:#888;margin:24px 0 0;line-height:1.5;">
    El backlink desde el directorio sigue siendo tuyo mientras el producto esté publicado. Al vencer, perdés esa exposure.
  </p>
</body>
</html>`
}
