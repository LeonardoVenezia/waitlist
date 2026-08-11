import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileName, fileType } = await req.json();
  if (!fileName || !fileType) return NextResponse.json({ error: "Missing fileName or fileType" }, { status: 400 });

  const ext = fileName.split(".").pop() ?? "jpg";
  const path = `page-builder/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("showcase-images")
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ path, signedUrl: data.signedUrl, token: data.token });
}
