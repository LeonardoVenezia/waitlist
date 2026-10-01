import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TestimonialEditor } from "./testimonial-editor";
import { ConsentConfirmation } from "./consent-confirmation";

export default async function TestimonialDetailPage(props: {
  params: Promise<{ id: string; testimonialId: string }>;
}) {
  const { id, testimonialId } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!project) notFound();

  const { data: testimonial } = await supabase
    .from("testimonials")
    .select("*")
    .eq("id", testimonialId)
    .eq("project_id", id)
    .maybeSingle();
  if (!testimonial) notFound();

  const { data: form } = testimonial.form_id
    ? await supabase.from("testimonial_forms").select("name").eq("id", testimonial.form_id).maybeSingle()
    : { data: null };

  const answers = testimonial.answers && typeof testimonial.answers === "object" && !Array.isArray(testimonial.answers)
    ? Object.entries(testimonial.answers as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string")
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/dashboard/projects/${id}/testimonials`} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">← Testimonials</Link>
        <h1 className="mt-4 font-heading text-2xl">Review testimonial</h1>
        <p className="mt-1 text-sm text-muted-foreground">{project.name}</p>
      </div>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="font-heading text-lg">Submitted details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Detail label="Email" value={testimonial.email} />
          <Detail label="Website" value={testimonial.website} />
          <Detail label="Form" value={form?.name ?? (testimonial.form_id ? "Deleted form" : "Added manually")} />
          <Detail label="Source" value={testimonial.source} />
          <Detail label="Consent" value={testimonial.consent === "public" ? (testimonial.consent_confirmed_by ? "Public use · owner-confirmed permission" : "Public use · author choice") : testimonial.consent === "private" ? "Private use · author choice" : "Not recorded"} />
          <Detail label="Permission record" value={testimonial.consent_confirmed_at ? `Owner-confirmed · ${new Date(testimonial.consent_confirmed_at).toLocaleString()}` : null} />
          <Detail label="Featured" value={testimonial.is_featured ? "Yes" : "No"} />
        </div>
        {testimonial.consent === null && (
          <ConsentConfirmation projectId={id} testimonialId={testimonial.id} />
        )}
        {testimonial.private_feedback && (
          <div className="rounded-lg bg-muted/50 p-4">
            <h3 className="text-sm font-semibold">Private feedback</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{testimonial.private_feedback}</p>
          </div>
        )}
        {answers.length > 0 && (
          <dl className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold">Form answers</h3>
            {answers.map(([question, answer]) => (
              <div key={question}>
                <dt className="text-sm font-medium">{question}</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{answer}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <TestimonialEditor
        projectId={id}
        testimonialId={testimonial.id}
        initial={{ name: testimonial.name, company: testimonial.company ?? "", role: testimonial.role ?? "", message: testimonial.message }}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm">{value || "—"}</dd>
    </div>
  );
}
