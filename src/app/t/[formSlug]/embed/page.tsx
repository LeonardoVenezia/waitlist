import { notFound } from "next/navigation";
import { TestimonialForm } from "../testimonial-form";
import { getPublicForm, parseFormFields, parseThankYouMessage, trackFormVisit } from "../form-data";

export const dynamic = "force-dynamic";

/**
 * Embeddable version of the public form for iframes. Bare layout: no header,
 * no footer, transparent background so it blends into the host page.
 */
export default async function EmbedFormPage(props: {
  params: Promise<{ formSlug: string }>;
}) {
  const { formSlug } = await props.params;

  const form = await getPublicForm(formSlug);
  if (!form) notFound();

  await trackFormVisit(form.id);

  return (
    <div className="bg-transparent flex items-center justify-center p-2">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <h1 className="font-heading text-xl font-semibold tracking-tight">{form.name}</h1>
          {form.description && (
            <p className="text-xs text-muted-foreground mt-1">{form.description}</p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4">
          <TestimonialForm
            formId={form.id}
            projectId={form.project_id}
            fields={parseFormFields(form)}
            questions={form.questions as Record<string, unknown>[]}
            redirectUrl={form.redirect_url}
            thankYouMessage={parseThankYouMessage(form)}
            inviteToken={null}
          />
        </div>
      </div>
    </div>
  );
}
