"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket: string;
  folder: string;
}

export function AvatarUpload({ value, onChange, bucket, folder }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) return;

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const res = await fetch(`/api/upload?bucket=${bucket}&path=${encodeURIComponent(path)}`, {
        method: "POST",
        body: file,
      });

      if (!res.ok) throw new Error("Upload failed");
      onChange(path);
    } catch {
      setPreview(value);
    } finally {
      setUploading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative size-16 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0 transition-colors",
        "hover:border-primary/50",
        preview ? "border-transparent" : "border-muted-foreground/30",
      )}
    >
      {preview ? (
        <img src={preview} alt="" className="size-full object-cover rounded-full" />
      ) : (
        <svg className="size-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-background/60 rounded-full flex items-center justify-center">
          <svg className="size-5 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </button>
  );
}
