import Script from "next/script";
import { TURNSTILE_ENABLED } from "@/lib/turnstile";

export default function HostedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {TURNSTILE_ENABLED && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
