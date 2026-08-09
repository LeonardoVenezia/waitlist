import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get("bucket");
  const path = req.nextUrl.searchParams.get("path");

  if (!bucket || !path) {
    return NextResponse.json({ error: "Missing bucket or path" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blob = await req.blob();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { upsert: true, contentType: blob.type });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({ path, url: urlData.publicUrl });
}
