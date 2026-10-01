import { notFound } from "next/navigation";
import Link from "next/link";
import { TestimonialForm } from "./testimonial-form";
import { getPublicForm, parseFormFields, parseFormDesign, trackFormVisit, markInviteOpened } from "./form-data";

export const dynamic = "force-dynamic";

export default async function PublicFormPage(props: {
  params: Promise<{ formSlug: string }>;
  searchParams: Promise<{ i?: string }>;
}) {
  const { formSlug } = await props.params;
  const { i: inviteToken } = await props.searchParams;

  const form = await getPublicForm(formSlug);
  if (!form) notFound();
  if (form.status === "archived") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <h1 className="font-heading text-3xl font-semibold">This form is closed</h1>
          <p className="mt-3 text-muted-foreground">This testimonial form is no longer accepting responses.</p>
        </div>
      </main>
    );
  }

  await Promise.all([trackFormVisit(form.id), markInviteOpened(inviteToken)]);

  const design = parseFormDesign(form);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-6 pt-12 text-center sm:pt-16">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {form.name}
        </h1>
        {form.description && (
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
            {form.description}
          </p>
        )}
      </header>

      <main className="flex flex-1 items-start justify-center px-6 py-10 sm:py-14">
        <div className="w-full max-w-xl">
          <TestimonialForm
            formId={form.id}
            projectId={form.project_id}
            fields={parseFormFields(form)}
            questions={form.questions as Record<string, unknown>[]}
            redirectUrl={form.redirect_url}
            thankYouMessage={design.thankYouMessage}
            wizard={design}
            inviteToken={inviteToken ?? null}
          />
        </div>
      </main>

      <footer className="px-6 pb-10 text-center text-xs text-muted-foreground">
        Powered by{" "}
        <Link href="/" className="underline transition-colors hover:text-foreground">
          [PACK]
        </Link>
      </footer>
    </div>
  );
}
