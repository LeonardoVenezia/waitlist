import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as XLSX from "xlsx";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";

  const supabase = createAdminClient();

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select(
      "id, email, referral_code, referral_count, referred_by, status, metadata, created_at",
    )
    .eq("waitlist_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (!subscribers || subscribers.length === 0) {
    return new NextResponse("No subscribers to export", { status: 404 });
  }

  const rows = subscribers.map((s) => {
    const meta = (s.metadata ?? {}) as Record<string, unknown>;
    return {
      email: s.email,
      referral_code: s.referral_code,
      referral_count: s.referral_count,
      referred_by: s.referred_by ?? "",
      status: s.status,
      country: (meta.country as string) ?? "",
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
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="subscribers.xlsx"`,
      },
    });
  }

  // CSV (default)
  const header =
    "email,referral_code,referral_count,referred_by,status,country,created_at\n";
  const csv =
    header +
    rows
      .map((r) =>
        [
          escapeCsv(r.email),
          r.referral_code,
          r.referral_count,
          escapeCsv(r.referred_by),
          r.status,
          escapeCsv(r.country),
          r.created_at,
        ].join(","),
      )
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
