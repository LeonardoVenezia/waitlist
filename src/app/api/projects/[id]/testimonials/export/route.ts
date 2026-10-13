import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // RLS-protected read: only the project owner can see this row.
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!project) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";
  const status = searchParams.get("status") ?? "";
  const form = searchParams.get("form") ?? "";
  const consent = searchParams.get("consent") ?? "";

  let query = supabase
    .from("testimonials")
    .select("name, email, company, role, rating, message, status, consent, source, tags, website, avatar_url, created_at")
    .eq("project_id", id);

  if (status === "approved" || status === "pending" || status === "rejected") {
    query = query.eq("status", status);
  }
  if (form) query = query.eq("form_id", form);
  if (consent === "public" || consent === "private") {
    query = query.eq("consent", consent);
  }

  query = query.order("created_at", { ascending: false });

  const { data: testimonials } = await query;

  if (!testimonials || testimonials.length === 0) {
    return new NextResponse("No testimonials to export", { status: 404 });
  }

  const rows = testimonials.map((t) => ({
    name: t.name,
    email: t.email ?? "",
    company: t.company ?? "",
    role: t.role ?? "",
    rating: t.rating,
    message: t.message,
    status: t.status,
    consent: t.consent ?? "",
    source: t.source,
    tags: (t.tags ?? []).join("|"),
    website: t.website ?? "",
    avatar_url: t.avatar_url ?? "",
    created_at: t.created_at,
  }));

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Testimonials");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="testimonials.xlsx"`,
      },
    });
  }

  const header =
    "name,email,company,role,rating,message,status,consent,source,tags,website,avatar_url,created_at\n";
  const csv =
    header +
    rows
      .map((r) =>
        [
          escapeCsv(r.name),
          escapeCsv(r.email),
          escapeCsv(r.company),
          escapeCsv(r.role),
          r.rating,
          escapeCsv(r.message),
          r.status,
          r.consent,
          r.source,
          escapeCsv(r.tags),
          escapeCsv(r.website),
          escapeCsv(r.avatar_url),
          r.created_at,
        ].join(","),
      )
      .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="testimonials.csv"`,
    },
  });
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
