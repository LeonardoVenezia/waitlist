import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as XLSX from "xlsx";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // RLS-protected read: only the project owner can see this row
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
  const search = searchParams.get("search") ?? "";
  const verified = searchParams.get("verified") ?? "";
  const dateFrom = searchParams.get("date_from") ?? "";
  const dateUntil = searchParams.get("date_until") ?? "";
  const emailStatus = searchParams.get("email_status") ?? "";

  const admin = createAdminClient();

  let query = admin
    .from("subscribers")
    .select("id, email, name, country, referral_code, referral_count, referred_by, status, verified, email_status, metadata, created_at")
    .eq("waitlist_id", id)
    .eq("status", "active");

  if (search) query = query.ilike("email", `%${search}%`);
  if (verified === "verified") query = query.eq("verified", true);
  else if (verified === "unverified") query = query.eq("verified", false);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateUntil) query = query.lte("created_at", dateUntil + "T23:59:59.999Z");
  if (emailStatus) query = query.eq("email_status", emailStatus);

  query = query.order("created_at", { ascending: false });

  const { data: subscribers } = await query;

  if (!subscribers || subscribers.length === 0) {
    return new NextResponse("No subscribers to export", { status: 404 });
  }

  const rows = subscribers.map((s) => {
    const meta = (s.metadata ?? {}) as Record<string, unknown>;
    return {
      email: s.email,
      name: s.name ?? "",
      country: s.country ?? (meta.country as string) ?? "",
      referral_code: s.referral_code,
      referral_count: s.referral_count,
      referred_by: s.referred_by ?? "",
      status: s.status,
      verified: s.verified ? "Yes" : "No",
      email_status: s.email_status ?? "",
      created_at: s.created_at,
    };
  });

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subscribers");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="subscribers.xlsx"`,
      },
    });
  }

  const header = "email,name,country,referral_code,referral_count,referred_by,status,verified,email_status,created_at\n";
  const csv = header + rows
    .map((r) => [
      escapeCsv(r.email), escapeCsv(r.name), escapeCsv(r.country),
      r.referral_code, r.referral_count, escapeCsv(r.referred_by),
      r.status, r.verified, r.email_status, r.created_at,
    ].join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="subscribers.csv"`,
    },
  });
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
