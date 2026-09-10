import { notFound } from "next/navigation";
import { TestimonialForm } from "./testimonial-form";
import { getPublicForm, parseFormFields, parseThankYouMessage, trackFormVisit, markInviteOpened } from "./form-data";

export const dynamic = "force-dynamic";

export default async function PublicFormPage(props: {
  params: Promise<{ formSlug: string }>;
  searchParams: Promise<{ i?: string }>;
}) {
  const { formSlug } = await props.params;
  const { i: inviteToken } = await props.searchParams;

  const form = await getPublicForm(formSlug);
  if (!form) notFound();

  await Promise.all([trackFormVisit(form.id), markInviteOpened(inviteToken)]);

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
            fields={parseFormFields(form)}
            questions={form.questions as Record<string, unknown>[]}
            redirectUrl={form.redirect_url}
            thankYouMessage={parseThankYouMessage(form)}
            inviteToken={inviteToken ?? null}
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
