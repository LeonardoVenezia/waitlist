import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicWaitlistForm } from "./public-waitlist-form";

export default async function HostedPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const supabase = createAdminClient();

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, name, slug, public_key, settings")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!waitlist) notFound();

  const settings = waitlist.settings as Record<string, unknown>;
  const branding = (settings.branding ?? {}) as Record<string, unknown>;
  const hero = (settings.hero ?? {}) as Record<string, unknown>;
  const primaryColor = (branding.primary_color as string) ?? "#22c563";

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={
        {
          "--wl-primary": primaryColor,
        } as React.CSSProperties
      }
    >
      <div className="w-full max-w-md space-y-6 text-center">
        {(branding.logo_url as string) && (
          <img
            src={branding.logo_url as string}
            alt={waitlist.name}
            className="mx-auto h-12 w-auto"
          />
        )}

        <h1 className="text-3xl font-bold tracking-tight">
          {(hero.title as string) || waitlist.name}
        </h1>

        {(hero.subtitle as string) && (
          <p className="text-muted-foreground">{hero.subtitle as string}</p>
        )}

        <PublicWaitlistForm
          publicKey={waitlist.public_key}
          waitlistId={waitlist.id}
          settings={settings}
          slug={waitlist.slug}
        />
      </div>
    </div>
  );
}
