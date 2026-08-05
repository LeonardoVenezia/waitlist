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
  const [status, setStatus] = useState(showcase?.status ?? "draft");

  const [publishing, setPublishing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function getAppUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }

  const formState = { name, slug, link, desc, cat1, cat2, videoUrl, featuredB, mainType };

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    const fd = buildFormData(formState);

    if (isNew) {
      const res = await createShowcase(waitlistId, fd);
      if (res.error) { setError(res.error); setPublishing(false); return; }
      const pub = await publishShowcase(waitlistId, res.id!, link, fd);
      if (pub.error) { setError(pub.error); setPublishing(false); return; }
      setStatus("published");
      setPublishing(false);
      window.location.reload();
      return;
    }

    const pub = await publishShowcase(waitlistId, showcase!.id, link, fd);
    if (pub.error) { setError(pub.error); setPublishing(false); return; }
    setStatus("published");
    setPublishing(false);
    router.refresh();
  }

  async function handleUpdate() {
    if (!showcase) return;
    setUpdating(true);
    setError(null);
    const fd = buildFormData(formState);
    const res = await updateShowcase(waitlistId, showcase.id, fd);
    if (res.error) { setError(res.error); setUpdating(false); return; }
    setUpdating(false);
    router.refresh();
  }

  async function handleUnpublish() {
    if (!showcase) return;
    setStatus("draft");
    const res = await updateShowcaseStatus(waitlistId, showcase.id, "draft");
    if (res.error) setError(res.error);
    router.refresh();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!showcase) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setImages((prev) => [...prev, localUrl]);
    setUploading(true);

    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadShowcaseImage(showcase.id, fd);

    if (res.error) {
      setImages((prev) => prev.filter((u) => u !== localUrl));
      setError(res.error);
    } else {
      const realImages = res.images as string[];
      URL.revokeObjectURL(localUrl);
      setImages(realImages);
    }
    setUploading(false);
  }

  async function handleRemoveImage(path: string) {
    if (!showcase) return;
    const previous = images;
    setImages((prev) => prev.filter((u) => u !== path));

    const res = await removeShowcaseImage(showcase.id, path);
    if (res.error) {
      setImages(previous);
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
          <Badge variant={status === "published" ? "default" : status === "rejected" ? "destructive" : "outline"}>
            {status}
          </Badge>
          {status === "published" && (
            <a href={`${getAppUrl()}/showcase/${showcase.slug}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline ml-auto">
              View live →
            </a>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Create showcase" : "Edit showcase"}</CardTitle>
          <CardDescription>
            {isNew
              ? "Publicá tu producto en el directorio. Aparecerá en /showcase."
              : "Editá los detalles de tu entrada en el directorio."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My SaaS" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-saas" />
              <p className="text-xs text-muted-foreground">
                {getAppUrl()}/showcase/{slug || "my-saas"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Website URL</Label>
            <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com" />
            <p className="text-xs text-muted-foreground">Este link será dofollow en tu página del directorio.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="desc">Description</Label>
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
              <Label htmlFor="cat1">Category 1</Label>
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
              <label className={`flex items-center gap-2 cursor-pointer ${!hasImages ? "opacity-50 cursor-not-allowed" : ""}`}>
                <input
                  type="radio"
                  name="main_type_local"
                  checked={mainType === "image"}
                  onChange={() => setMainType("image")}
                  disabled={!hasImages}
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

          {/* Images */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Gallery ({images.length}/5)</Label>
              {mainType === "image" && images.length === 0 && (
                <span className="text-xs text-muted-foreground">Upload at least one image as main media</span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {images.map((path, idx) => (
                <div key={path} className="relative size-24 rounded-lg border overflow-hidden group">
                  <img
                    src={path.startsWith("blob:") ? path : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/showcase-images/${path}`}
                    alt=""
                    className="size-full object-cover"
                  />
                  {mainType === "image" && idx === 0 && (
                    <span className="absolute bottom-1 left-1 text-[9px] px-1 rounded bg-black/60 text-white font-medium">Main</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(path)}
                    className="absolute top-1 right-1 size-4 rounded-full bg-black/40 text-[10px] text-white/80 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="size-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <span className="text-2xl text-muted-foreground">+</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
              )}
            </div>
            {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
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
          <Button onClick={handlePublish} disabled={publishing}>
            {publishing ? "Publishing..." : "Publish to showcase"}
          </Button>
        ) : status === "published" ? (
          <>
            <Button onClick={handleUpdate} disabled={updating} variant="outline">
              {updating ? "Updating..." : "Update"}
            </Button>
            <Button onClick={handleUnpublish} variant="ghost">
              Unpublish
            </Button>
          </>
        ) : (
          <Button onClick={handlePublish} disabled={publishing}>
            {publishing ? "Publishing..." : "Publish"}
          </Button>
        )}
      </div>
    </div>
  );
}
