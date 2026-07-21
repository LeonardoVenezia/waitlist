import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EmbedPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, public_key, slug")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  const widgetCode = `<script async src="${process.env.NEXT_PUBLIC_APP_URL}/widget.js"></script>\n<div class="wl-waitlist" data-key="${waitlist.public_key}"></div>`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Embed</h1>

      <Card>
        <CardHeader>
          <CardTitle>JavaScript widget</CardTitle>
          <CardDescription>
            Add this code to your website where you want the waitlist form to appear.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
            <code>{widgetCode}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hosted page</CardTitle>
          <CardDescription>
            Share this link directly with your audience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">
            {process.env.NEXT_PUBLIC_APP_URL}/p/{waitlist.slug}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom form (no JavaScript)</CardTitle>
          <CardDescription>
            Use this form action for platforms that don&apos;t support JavaScript.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
            <code>{`<form action="${process.env.NEXT_PUBLIC_APP_URL}/api/public/subscribe" method="POST">
  <input type="hidden" name="public_key" value="${waitlist.public_key}" />
  <input type="hidden" name="turnstile_token" value="..." />
  <input type="email" name="email" required />
  <button type="submit">Join the waitlist</button>
</form>`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
