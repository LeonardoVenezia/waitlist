"use client";

import { useRef, useState } from "react";

interface ImageUploadProps {
  value: string;
  onChange: (path: string) => void;
  onRemove: () => void;
}

export function ImageUpload({ value, onChange, onRemove }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) { setError("Max 2 MB"); return; }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    setError(null);

    try {
      const urlRes = await fetch("/api/page-builder/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");

      const { path, signedUrl } = await urlRes.json();

      const upRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!upRes.ok) throw new Error("Upload failed");

      onChange(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/showcase-images/${value}`;
    return (
      <div className="space-y-2">
        <div className="relative rounded-lg overflow-hidden border bg-muted">
          <img src={publicUrl} alt="" className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
            <button type="button" onClick={() => inputRef.current?.click()} className="px-2 py-1 text-xs bg-black/60 text-white rounded hover:bg-black/80">
              Replace
            </button>
            <button type="button" onClick={onRemove} className="px-2 py-1 text-xs bg-black/60 text-white rounded hover:bg-black/80">
              Remove
            </button>
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="w-full h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <svg className="size-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <>
            <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Upload image
          </>
        )}
      </button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      {preview && uploading && (
        <img src={preview} alt="" className="mt-2 rounded-lg w-full h-24 object-cover" />
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}
