import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { TestimonialForm } from "./testimonial-form";

export const dynamic = "force-dynamic";

export default async function PublicFormPage(props: {
  params: Promise<{ formSlug: string }>;
}) {
  const { formSlug } = await props.params;
  const admin = createAdminClient();

  const { data: form } = await admin
    .from("testimonial_forms")
    .select("*, projects!inner(name)")
    .eq("slug", formSlug)
    .eq("status", "published")
    .maybeSingle();

  if (!form) notFound();

  const rawFields = form.fields as unknown;
  const fields: string[] = Array.isArray(rawFields)
    ? (rawFields as Array<unknown>).filter((f): f is string => typeof f === "string")
    : [];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{form.name}</h1>
          {form.description && (
            <p className="text-sm text-muted-foreground mt-2">{form.description}</p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-6">
          <TestimonialForm
            formId={form.id}
            projectId={form.project_id}
            fields={fields}
            questions={form.questions as Record<string, unknown>[]}
            redirectUrl={form.redirect_url}
          />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by{" "}
          <a href="/" className="underline hover:text-foreground transition-colors">
            [PACK]
          </a>
        </p>
      </div>
    </div>
  );
}
