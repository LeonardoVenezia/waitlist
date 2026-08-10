import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.formData();
  const path = body.get("path") as string;

  const res = NextResponse.redirect(new URL(path, req.url));
  res.cookies.set("onboarding-dismissed", "true", {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
  });

  return res;
}
