import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { fileType?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fileType = body.fileType;
  if (typeof fileType !== "string" || !(fileType in EXT_MAP)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  // The extension comes from the validated MIME type, never from the client.
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `page-builder/${user.id}/${Date.now()}-${rand}.${EXT_MAP[fileType]}`;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("showcase-images")
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ path, signedUrl: data.signedUrl, token: data.token });
}
