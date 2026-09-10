import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { InvitesClient } from "./invites-client";

export const dynamic = "force-dynamic";

const STATUS_DOT: Record<string, string> = {
  queued: "bg-amber-400",
  sent: "bg-sky-500",
  opened: "bg-violet-500",
  submitted: "bg-emerald-500",
};

export default async function InvitesPage(props: {
  params: Promise<{ id: string; formId: string }>;
}) {
  const { id, formId } = await props.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: form } = await supabase
    .from("testimonial_forms")
    .select("id, name, slug, status, project_id")
    .eq("id", formId)
    .eq("project_id", id)
    .maybeSingle();
  if (!form) notFound();

  const { data: invites } = await supabase
    .from("testimonial_invites")
    .select("*")
    .eq("form_id", formId)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl">
      <Link
        href={`/dashboard/projects/${id}/testimonials/forms/${formId}`}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← {form.name}
      </Link>

      <h1 className="font-heading text-2xl font-semibold mt-3">Invites</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-8">
        Ask customers directly by email. Recipients get a personal link to the form.
      </p>

      <InvitesClient
        projectId={id}
        formId={formId}
        formPublished={form.status === "published"}
        invites={(invites ?? []).map((inv) => ({
          id: inv.id,
          email: inv.email,
          status: inv.status,
          sentAt: inv.sent_at,
        }))}
        statusDots={STATUS_DOT}
      />
    </div>
  );
}
