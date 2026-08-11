import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { fileName, fileType } = await req.json();
  if (!fileName || !fileType) return NextResponse.json({ error: "Missing fileName or fileType" }, { status: 400 });

  const version = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);

  const ext = fileName.split(".").pop() ?? "jpg";
  const path = `page-builder/${version}-${rand}.${ext}`;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("showcase-images")
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ path, signedUrl: data.signedUrl, token: data.token });
}
