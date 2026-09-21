import { notFound } from "next/navigation";
import { TestimonialForm } from "../testimonial-form";
import { getPublicForm, parseFormFields, parseFormDesign, trackFormVisit } from "../form-data";

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

  const design = parseFormDesign(form);

  return (
    <div className="flex justify-center bg-transparent px-4 py-8">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-normal tracking-tight">{form.name}</h1>
          {form.description && (
            <p className="mt-2 text-sm text-muted-foreground">{form.description}</p>
          )}
        </div>

        <TestimonialForm
          formId={form.id}
          projectId={form.project_id}
          fields={parseFormFields(form)}
          questions={form.questions as Record<string, unknown>[]}
          redirectUrl={form.redirect_url}
          thankYouMessage={design.thankYouMessage}
          wizard={design}
          inviteToken={null}
        />
      </div>
    </div>
  );
}
