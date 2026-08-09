import { createAdminClient } from "@/lib/supabase/admin";
import { TestimonialCard } from "@/components/testimonials/testimonial-card";

export async function ProductTestimonials({
  projectId,
  plan,
}: {
  projectId: string;
  plan: string;
}) {
  const admin = createAdminClient();

  const { data: featured } = await admin
    .from("testimonials")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "approved")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(10);

  // If no featured, fallback to all approved
  let testimonials = featured && featured.length > 0 ? featured : null;

  if (!testimonials) {
    const { data: approved } = await admin
      .from("testimonials")
      .select("*")
      .eq("project_id", projectId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(4);

    testimonials = approved;
  }

  if (!testimonials || testimonials.length === 0) return null;

  const hasCarousel = plan !== "free";

  return (
    <div className="mb-12">
      <h2 className="font-heading text-lg font-semibold mb-4">Testimonials</h2>

      {hasCarousel ? (
        <div className="relative">
          <div
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            {testimonials.map((t) => (
              <div key={t.id} className="snap-start shrink-0 w-[300px]">
                <TestimonialCard
                  name={t.name}
                  company={t.company}
                  role={t.role}
                  message={t.message}
                  rating={t.rating}
                  avatarUrl={t.avatar_url}
                  date={t.created_at}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {testimonials.slice(0, 4).map((t) => (
            <TestimonialCard
              key={t.id}
              name={t.name}
              company={t.company}
              role={t.role}
              message={t.message}
              rating={t.rating}
              avatarUrl={t.avatar_url}
              date={t.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
