"use client";

import { useState, useRef } from "react";
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
  runQualityChecks,
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
  status: string;
  domain_check_passed: boolean;
  spam_check_passed: boolean;
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
  const [status, setStatus] = useState(showcase?.status ?? "draft");
  const [domainOk, setDomainOk] = useState(showcase?.domain_check_passed ?? false);
  const [spamOk, setSpamOk] = useState(showcase?.spam_check_passed ?? false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [checksRunning, setChecksRunning] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  function getAppUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }

  async function save(shouldPublish = false) {
    setSaving(true);
    setError(null);

    const fd = new FormData();
    fd.set("name", name);
    fd.set("slug", slug);
    fd.set("link", link);
    fd.set("description", desc);
    fd.set("category_1", cat1);
    if (cat2) fd.set("category_2", cat2);
    if (videoUrl) fd.set("video_url", videoUrl);
    if (featuredB) fd.set("featured_badge", "on");

    if (isNew) {
      fd.set("waitlist_id", waitlistId);
      const res = await createShowcase(waitlistId, fd);
      if (res.error) { setError(res.error); setSaving(false); return; }
      router.refresh();
      // We need to re-create so we can publish or run checks
      // For now, reload to get new ID
      setSaving(false);
      window.location.reload();
      return;
    }

    const res = await updateShowcase(waitlistId, showcase!.id, fd);
    if (res.error) { setError(res.error); setSaving(false); return; }

    if (shouldPublish) {
      const pub = await publishShowcase(waitlistId, showcase!.id);
      if (pub.error) { setError(pub.error); setSaving(false); return; }
      setStatus("published");
    }

    router.refresh();
    setSaving(false);
  }

  async function runChecks() {
    if (!showcase) return;
    setChecksRunning(true);
    const res = await runQualityChecks(showcase.id, link);
    if (res.error) { setError(res.error); setChecksRunning(false); return; }
    setDomainOk(res.domain_ok as boolean);
    setSpamOk(res.spam_ok as boolean);
    setChecksRunning(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!showcase) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadShowcaseImage(showcase.id, fd);
    if (res.error) { setError(res.error); setUploading(false); return; }
    setImages(res.images as string[]);
    setUploading(false);
  }

  async function handleRemoveImage(path: string) {
    if (!showcase) return;
    const res = await removeShowcaseImage(showcase.id, path);
    if (res.error) { setError(res.error); return; }
    setImages(res.images as string[]);
  }

  function extractYouTubeId(url: string) {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m?.[1] ?? null;
  }

  const publishReady = domainOk && spamOk;
  const showYTPreview = videoUrl && extractYouTubeId(videoUrl);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      {/* Status bar (existing showcase) */}
      {showcase && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
          <span className="text-muted-foreground">Status:</span>
          <Badge variant={status === "published" ? "default" : status === "rejected" ? "destructive" : "outline"}>
            {status}
          </Badge>
          {status === "draft" && (
            <span className="text-xs text-muted-foreground">
              {publishReady ? "Ready to publish" : "Run quality checks before publishing"}
            </span>
          )}
          {status === "published" && (
            <a href={`${getAppUrl()}/showcase/${showcase.slug}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline ml-auto">
              View live →
            </a>
          )}
        </div>
      )}

      {/* Main form */}
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
              ref={descRef}
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
                onChange={(e) => setCat2(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">Ninguna</option>
                {SHOWCASE_CATEGORIES.filter((c) => c !== cat1).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video">YouTube video (optional)</Label>
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
          </div>

          {/* Images */}
          {showcase && (
            <div className="space-y-2">
              <Label>Images ({images.length}/5)</Label>
              <div className="flex flex-wrap gap-3">
                {images.map((path) => (
                  <div key={path} className="relative size-24 rounded-lg border overflow-hidden">
                    <img src={`${getAppUrl()}/storage/v1/object/public/showcase-images/${path}`} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(path)}
                      className="absolute top-1 right-1 size-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center hover:bg-destructive/90"
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
          )}

          {/* Featured badge (gated) */}
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

      {/* Quality checks */}
      {showcase && (
        <Card>
          <CardHeader>
            <CardTitle>Quality checks</CardTitle>
            <CardDescription>El dominio debe responder y pasar chequeo anti-spam para publicar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className={domainOk ? "text-green-600" : "text-muted-foreground"}>
                {domainOk ? "✓" : "○"}
              </span>
              Domain active (HTTP 200)
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={spamOk ? "text-green-600" : "text-muted-foreground"}>
                {spamOk ? "✓" : "○"}
              </span>
              Anti-spam check
            </div>
            <Button variant="outline" size="sm" onClick={runChecks} disabled={checksRunning || !link}>
              {checksRunning ? "Running checks..." : "Run checks"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {isNew ? (
          <Button onClick={() => save(false)} disabled={saving}>
            {saving ? "Creating..." : "Create showcase"}
          </Button>
        ) : (
          <>
            <Button onClick={() => save(false)} disabled={saving} variant="outline">
              {saving ? "Saving..." : "Save"}
            </Button>
            {status === "draft" && publishReady && (
              <Button onClick={() => save(true)} disabled={saving}>
                {saving ? "Publishing..." : "Publish"}
              </Button>
            )}
            {status === "published" && (
              <Button onClick={() => updateShowcaseStatus(waitlistId, showcase.id, "draft")} variant="ghost">
                Unpublish
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
