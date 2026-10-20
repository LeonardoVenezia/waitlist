import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_BUCKETS = ["showcase-images"];
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get("bucket");

  if (!bucket || !ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blob = await req.blob();
  const ext = EXT_MAP[blob.type];
  if (!ext) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }
  if (blob.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  // Path is always scoped to the caller and never overwrites existing files.
  const path = `uploads/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { upsert: false, contentType: blob.type });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({ path, url: urlData.publicUrl });
}
