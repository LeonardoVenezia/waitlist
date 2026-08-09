"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeatureGate } from "@/components/shared/feature-gate";
import { SHOWCASE_CATEGORIES } from "@/lib/showcase";
import type { Plan } from "@/lib/plans";
import {
  createShowcase,
  updateShowcase,
  publishShowcase,
  updateShowcaseStatus,
  uploadShowcaseImage,
  removeShowcaseImage,
  uploadMainImage,
  removeMainImage,
} from "./actions";

interface Props {
  waitlistId: string;
  plan: Plan;
  showcase: ShowcaseData | null;
}

interface ShowcaseData {
  id: string;
  name: string;
  slug: string;
  link: string;
  description: string;
  category_1: string;
  category_2: string | null;
  images: string[];
  video_url: string | null;
  featured_badge: boolean;
  main_type: string;
  main_image: string | null;
  status: string;
  domain_check_passed: boolean;
  spam_check_passed: boolean;
}

function buildFormData(state: {
  name: string; slug: string; link: string; desc: string;
  cat1: string; cat2: string | null; videoUrl: string; featuredB: boolean; mainType: string;
}) {
  const fd = new FormData();
  fd.set("name", state.name);
  fd.set("slug", state.slug);
  fd.set("link", state.link);
  fd.set("description", state.desc);
  fd.set("category_1", state.cat1);
  if (state.cat2) fd.set("category_2", state.cat2);
  if (state.videoUrl) fd.set("video_url", state.videoUrl);
  if (state.featuredB) fd.set("featured_badge", "on");
  fd.set("main_type", state.mainType);
  return fd;
}

export function ShowcaseForm({ waitlistId, plan, showcase }: Props) {
  const router = useRouter();
  const isNew = !showcase;

  const [name, setName] = useState(showcase?.name ?? "");
  const [slug, setSlug] = useState(showcase?.slug ?? "");
  const [link, setLink] = useState(showcase?.link ?? "");
  const [desc, setDesc] = useState(showcase?.description ?? "");
  const [cat1, setCat1] = useState(showcase?.category_1 ?? "");
  const [cat2, setCat2] = useState<string | null>(showcase?.category_2 ?? null);
  const [videoUrl, setVideoUrl] = useState(showcase?.video_url ?? "");
  const [images, setImages] = useState<string[]>(showcase?.images ?? []);
  const [featuredB, setFeaturedB] = useState(showcase?.featured_badge ?? false);
  const [mainType, setMainType] = useState(showcase?.main_type ?? "image");
  const [mainImage, setMainImage] = useState<string | null>(showcase?.main_image ?? null);
  const [status, setStatus] = useState(showcase?.status ?? "draft");

  const [publishing, setPublishing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [removedPaths, setRemovedPaths] = useState<Set<string>>(new Set());
  const [mainUploading, setMainUploading] = useState(false);

  function getAppUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }

  const formState = { name, slug, link, desc, cat1, cat2, videoUrl, featuredB, mainType };

  async function handlePublish(target: "published" | "coming_soon") {
    setPublishing(true);
    setError(null);
    const fd = buildFormData(formState);
    const galleryFd = buildGalleryFormData();
    const toRemove = [...removedPaths];

    if (isNew) {
      const res = await createShowcase(waitlistId, fd);
      if (res.error) { setError(res.error); setPublishing(false); return; }
      const pub = await publishShowcase(waitlistId, res.id!, link, fd, target, galleryFd, toRemove);
      if (pub.error) { setError(pub.error); setPublishing(false); return; }
      setStatus(target);
      setPublishing(false);
      window.location.reload();
      return;
    }

    const pub = await publishShowcase(waitlistId, showcase!.id, link, fd, target, galleryFd, toRemove);
    if (pub.error) { setError(pub.error); setPublishing(false); return; }
    setStatus(target);
    setPublishing(false);
    router.refresh();
  }

  async function handleUpdate() {
    if (!showcase) return;
    setUpdating(true);
    setError(null);
    const fd = buildFormData(formState);
    const galleryFd = buildGalleryFormData();
    const toRemove = [...removedPaths];

    const res = await updateShowcase(waitlistId, showcase.id, fd, galleryFd, toRemove);
    if (res.error) { setError(res.error); setUpdating(false); return; }
    // Update local state with persisted images
    if (res.images) {
      setImages(res.images as string[]);
      setPendingFiles([]);
      setRemovedPaths(new Set());
    }
    setUpdating(false);
    router.refresh();
  }

  function buildGalleryFormData(): FormData | undefined {
    if (pendingFiles.length === 0) return undefined;
    const fd = new FormData();
    for (const f of pendingFiles) fd.append("file", f);
    return fd;
  }

  async function handleUnpublish() {
    if (!showcase) return;
    setStatus("draft");
    const res = await updateShowcaseStatus(waitlistId, showcase.id, "draft");
    if (res.error) setError(res.error);
    router.refresh();
  }

  async function handleGallerySelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - images.length - pendingFiles.length;
    const toAdd = files.slice(0, remaining).filter((f) => {
      if (f.size > 2 * 1024 * 1024) {
        setError(`"${f.name}" supera los 2 MB.`);
        return false;
      }
      if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(f.type)) {
        setError(`"${f.name}" no es JPEG, PNG, WebP o AVIF.`);
        return false;
      }
      return true;
    });
    setPendingFiles((prev) => [...prev, ...toAdd]);
    // Clear input so same file can be re-selected
    e.target.value = "";
  }

  function handleRemovePending(idx: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleMarkRemove(path: string) {
    setRemovedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  async function handleMainUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!showcase) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setMainImage(localUrl);
    setMainUploading(true);

    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadMainImage(showcase.id, fd);

    if (res.error) {
      setMainImage(null);
      setError(res.error);
    } else {
      URL.revokeObjectURL(localUrl);
      setMainImage(res.main_image as string);
    }
    setMainUploading(false);
  }

  async function handleRemoveMain() {
    if (!showcase) return;
    const previous = mainImage;
    setMainImage(null);
    const res = await removeMainImage(showcase.id);
    if (res.error) {
      setMainImage(previous);
      setError(res.error);
    }
  }

  function extractYouTubeId(url: string) {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m?.[1] ?? null;
  }

  const showYTPreview = videoUrl && extractYouTubeId(videoUrl);
  const hasImages = images.length > 0;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      {showcase && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
          <span className="text-muted-foreground">Status:</span>
          <Badge variant={status === "published" ? "default" : status === "rejected" ? "destructive" : status === "coming_soon" ? "building" : "outline"}>
            {status}
          </Badge>
          {(status === "published" || status === "coming_soon") && (
            <a href={`${getAppUrl()}/product/${showcase.slug}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline ml-auto">
              View live →
            </a>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">{isNew ? "Create showcase" : "Edit showcase"}</CardTitle>
          <CardDescription>
            {isNew
              ? "Publicá tu producto en el directorio. Aparecerá en /showcase."
              : "Editá los detalles de tu entrada en el directorio."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product name <span className="text-red-500">*</span></Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My SaaS" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug <span className="text-red-500">*</span></Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-saas" />
              <p className="text-xs text-muted-foreground">
                {getAppUrl()}/showcase/{slug || "my-saas"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Website URL</Label>
            <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com" />
            <p className="text-xs text-muted-foreground">Required for full launch. Not needed for in construction.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="desc">Description <span className="text-red-500">*</span></Label>
              <span className={`text-xs ${desc.length >= 200 ? "text-green-600" : "text-muted-foreground"}`}>
                {desc.length}/200 min
              </span>
            </div>
            <textarea
              id="desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={6}
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-y"
              placeholder="Describe tu producto en al menos 200 caracteres..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cat1">Category 1 <span className="text-red-500">*</span></Label>
              <select
                id="cat1"
                value={cat1}
                onChange={(e) => setCat1(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">Seleccionar...</option>
                {SHOWCASE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat2">Category 2 (optional)</Label>
              <select
                id="cat2"
                value={cat2 ?? ""}
                onChange={(e) => setCat2(e.target.value || null)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">Ninguna</option>
                {SHOWCASE_CATEGORIES.filter((c) => c !== cat1).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Main media: image or video */}
          <div className="space-y-3 pt-2 border-t">
            <Label>Main media</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="main_type_local"
                  checked={mainType === "image"}
                  onChange={() => setMainType("image")}
                />
                <span className="text-sm">Image</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="main_type_local"
                  checked={mainType === "video"}
                  onChange={() => setMainType("video")}
                />
                <span className="text-sm">Video</span>
              </label>
            </div>

            {mainType === "image" && (
              <div className="space-y-2">
                <Label>Main image</Label>
                {mainImage ? (
                  <div className="relative w-48 rounded-lg border overflow-hidden group">
                    <img
                      src={mainImage.startsWith("blob:") ? mainImage : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/showcase-images/${mainImage}`}
                      alt="Main"
                      className="w-full aspect-video object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveMain}
                      className="absolute top-1 right-1 size-4 rounded-full bg-black/40 text-[10px] text-white/80 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-48 aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors">
                    <span className="text-2xl text-muted-foreground">+</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleMainUpload} disabled={mainUploading} />
                  </label>
                )}
                <p className="text-xs text-muted-foreground">Shown large on the directory page and on your product card.</p>
              </div>
            )}

            {mainType === "video" && (
              <div className="space-y-2">
                <Label htmlFor="video">YouTube video</Label>
                <Input id="video" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                {showYTPreview && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted mt-2">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}`}
                      allowFullScreen
                      className="border-0"
                    />
                  </div>
                )}
                {!videoUrl && (
                  <p className="text-xs text-muted-foreground">Add a YouTube video URL above.</p>
                )}
              </div>
            )}
          </div>

          {/* Gallery */}
          <div className="space-y-2">
            <Label>Gallery</Label>
            <p className="text-xs text-muted-foreground">Changes apply when you click Update or Publish.</p>
            <div className="flex flex-wrap gap-3">
              {/* Existing images */}
              {images.filter((p) => !p.startsWith("blob:")).map((path) => {
                const marked = removedPaths.has(path);
                return (
                  <div key={path} className="relative size-24 rounded-lg border overflow-hidden group">
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/showcase-images/${path}`}
                      alt=""
                      className={`size-full object-cover ${marked ? "opacity-30" : ""}`}
                    />
                    {marked && (
                      <span className="absolute bottom-1 left-1 text-[9px] px-1 rounded bg-red-600/80 text-white font-medium">Removed</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleMarkRemove(path)}
                      className="absolute top-1 right-1 size-4 rounded-full bg-black/40 text-[10px] text-white/80 hover:bg-black/60 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              {/* Pending files (blobs) */}
              {pendingFiles.map((file, idx) => (
                <div key={`pending-${idx}`} className="relative size-24 rounded-lg border overflow-hidden group border-primary/30">
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="size-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 text-[9px] px-1 rounded bg-primary/80 text-white font-medium">New</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePending(idx)}
                    className="absolute top-1 right-1 size-4 rounded-full bg-black/40 text-[10px] text-white/80 hover:bg-black/60 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {/* Add more */}
              {images.filter((p) => !p.startsWith("blob:") && !removedPaths.has(p)).length + pendingFiles.length < 5 && (
                <label className="size-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <span className="text-2xl text-muted-foreground">+</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={handleGallerySelect} />
                </label>
              )}
            </div>
          </div>

          {showcase && (
            <FeatureGate plan={plan} feature="remove_branding" waitlistId={waitlistId}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={featuredB}
                  onChange={(e) => setFeaturedB(e.target.checked)}
                  className="rounded"
                />
                Mostrar badge destacado en el directorio
              </label>
            </FeatureGate>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        {isNew ? (
          <>
            <Button onClick={() => handlePublish("published")} disabled={publishing}>
              {publishing ? "Publishing..." : "Full launch"}
            </Button>
            <Button onClick={() => handlePublish("coming_soon")} disabled={publishing} variant="secondary">
              {publishing ? "Publishing..." : "Coming soon"}
            </Button>
          </>
        ) : status === "published" ? (
          <>
            <Button onClick={handleUpdate} disabled={updating} variant="outline">
              {updating ? "Updating..." : "Update"}
            </Button>
            <Button onClick={handleUnpublish} variant="ghost">
              Unpublish
            </Button>
          </>
        ) : status === "coming_soon" ? (
          <>
            <Button onClick={handleUpdate} disabled={updating} variant="outline">
              {updating ? "Updating..." : "Update"}
            </Button>
            <Button onClick={() => handlePublish("published")} disabled={publishing}>
              {publishing ? "Launching..." : "Launch now"}
            </Button>
            <Button onClick={handleUnpublish} variant="ghost">
              Unpublish
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => handlePublish("published")} disabled={publishing}>
              {publishing ? "Publishing..." : "Full launch"}
            </Button>
            <Button onClick={() => handlePublish("coming_soon")} disabled={publishing} variant="secondary">
              {publishing ? "Publishing..." : "Coming soon"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
