import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.formData();
  const raw = body.get("path");
  // Same-site relative paths only (no open redirect).
  const path = typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";

  const res = NextResponse.redirect(new URL(path, req.url));
  res.cookies.set("onboarding-dismissed", "true", {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
  });

  return res;
}
