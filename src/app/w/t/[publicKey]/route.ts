import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasFeature } from "@/lib/plans";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ publicKey: string }> },
) {
  const { publicKey } = await params;
  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("id, status, plan")
    .eq("public_key", publicKey)
    .eq("status", "active")
    .maybeSingle();

  if (!project) return new NextResponse("Not found", { status: 404 });

  const { data: testimonials } = await admin
    .from("testimonials")
    .select("name, company, role, message, rating, avatar_url, created_at")
    .eq("project_id", project.id)
    .eq("status", "approved")
    .eq("consent", "public")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);

  const cards = (testimonials ?? []).map((testimonial) => {
    const avatar = resolveAvatar(testimonial.avatar_url);
    const author = [testimonial.role, testimonial.company].filter(Boolean).join(" · ");
    return `<article class="testimonial">
      <div class="author">
        ${avatar ? `<img src="${escapeHtml(avatar)}" alt="" />` : ""}
        <div><strong>${escapeHtml(testimonial.name)}</strong>${author ? `<span>${escapeHtml(author)}</span>` : ""}</div>
        <span class="rating" aria-label="${testimonial.rating} out of 5 stars">${"★".repeat(testimonial.rating)}${"☆".repeat(5 - testimonial.rating)}</span>
      </div>
      <p>${escapeHtml(testimonial.message)}</p>
    </article>`;
  }).join("\n");

  const branding = hasFeature(project.plan, "remove_branding")
    ? ""
    : '<a class="brand" href="https://waitlist.leovenezia.dev" target="_blank" rel="dofollow">Made with Startpack</a>';

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; color: #14110d; font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 16px; }
    .testimonial { min-width: 0; border: 1px solid #d8d3cc; border-radius: 12px; padding: 20px; background: #fcfcfa; }
    .author { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .author img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
    .author div { display: grid; min-width: 0; }
    .author strong, .author span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .author strong { font-size: 14px; }
    .author div span { color: #5a554c; font-size: 12px; }
    .rating { margin-left: auto; color: #9d3e00; white-space: nowrap; font-size: 13px; }
    .testimonial p { margin: 14px 0 0; color: #5a554c; white-space: pre-wrap; overflow-wrap: anywhere; }
    .empty { margin: 0; padding: 24px; text-align: center; color: #5a554c; }
    .brand { display: block; margin-top: 12px; color: #5a554c; font-size: 11px; text-align: center; text-decoration: none; opacity: .75; }
  </style>
</head>
<body>${cards ? `<main class="list">${cards}</main>` : '<p class="empty">No public testimonials yet.</p>'}${branding}</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]!);
}

function resolveAvatar(value: string | null) {
  if (!value) return null;
  if (value.startsWith("https://")) return value;
  if (value.startsWith("testimonials/")) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return base ? `${base}/storage/v1/object/public/showcase-images/${value}` : null;
  }
  return null;
}
