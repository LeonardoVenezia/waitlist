"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, ToggleRow } from "@/components/dashboard/settings-fields";
import { toHexColor } from "@/lib/color";
import {
  THANK_YOU_EXPERIENCES,
  resolveThankYouConfig,
} from "@/lib/thank-you-experiences";
import { Embajadores } from "@/components/thank-you/embajadores";
import type { SubscribeResult } from "@/components/templates/use-waitlist-subscribe";
import type { Plan } from "@/lib/plans";
import { saveThankYouSettings } from "./actions";

const SHARE_PLATFORMS = [
  "whatsapp",
  "x",
  "linkedin",
  "facebook",
  "telegram",
  "reddit",
  "email",
  "threads",
  "vk",
] as const;

const SOCIAL_LINKS: Array<[key: string, label: string, placeholder: string]> = [
  ["social_twitter", "X/Twitter", "https://twitter.com/username"],
  ["social_instagram", "Instagram", "https://instagram.com/username"],
  ["social_threads", "Threads", "https://threads.net/@username"],
  ["social_linkedin", "LinkedIn", "https://linkedin.com/in/username"],
  ["social_facebook", "Facebook", "https://facebook.com/username"],
  ["social_reddit", "Reddit", "https://reddit.com/s/name"],
  ["social_telegram", "Telegram", "https://t.me/username"],
  ["social_whatsapp", "WhatsApp", "https://wa.me/phone"],
  ["social_tiktok", "TikTok", "https://tiktok.com/@username"],
  ["social_youtube", "YouTube", "https://youtube.com/channel/name"],
  ["social_discord", "Discord", "https://discord.gg/name"],
];

export function ThankYouClient({
  waitlistId,
  slug,
  plan,
  initialThankYou,
  language,
  branding,
  milestones,
}: {
  waitlistId: string;
  slug: string;
  plan: Plan;
  initialThankYou: Record<string, unknown>;
  language: string;
  branding: Record<string, unknown>;
  milestones: Array<{ count: number; reward: string }>;
}) {
  const router = useRouter();
  const [thankYou, setThankYou] = useState<Record<string, unknown>>(initialThankYou);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const snapshot = JSON.stringify(thankYou);
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot);
  const dirty = snapshot !== savedSnapshot;
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = useCallback((key: string, value: unknown) => {
    setThankYou((prev) => ({ ...prev, [key]: value }));
  }, []);

  const str = (key: string) => (thankYou[key] as string) ?? "";
  const bool = (key: string, fallback = true) =>
    typeof thankYou[key] === "boolean" ? (thankYou[key] as boolean) : fallback;
  const list = (key: string) =>
    Array.isArray(thankYou[key]) ? (thankYou[key] as string[]) : [];

  const save = useCallback(async () => {
    setSaveState("saving");
    setSaveError(null);
    const result = await saveThankYouSettings(waitlistId, slug, thankYou);
    if (result?.error) {
      setSaveError(result.error);
      setSaveState("error");
      return;
    }
    setSavedSnapshot(JSON.stringify(thankYou));
    setSaveState("saved");
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveState("idle"), 2000);
    router.refresh();
  }, [waitlistId, slug, thankYou, router]);

  const config = resolveThankYouConfig({ thank_you: thankYou, language, branding });
  const previewResult: SubscribeResult = {
    id: "preview",
    email: "you@example.com",
    position: 482,
    referral_code: "preview",
    referral_link: `/p/${slug}?ref=preview`,
    referral_count: 5,
    total: 2314,
    milestones: milestones.length > 0 ? milestones : undefined,
  };
  const accentSwatch = toHexColor(config.accent) ?? "#9D3E00";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Thank You</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The screen people see right after they join your waitlist.
          </p>
        </div>
        <a
          href={`/p/${slug}`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Open live
        </a>
      </div>

      {/* Save + status */}
      <div className="flex items-center gap-2">
        {saveState === "saved" && (
          <span className="text-sm font-medium text-green-600">✓ Saved</span>
        )}
        {saveState === "error" && saveError && (
          <span className="text-sm font-medium text-destructive">{saveError}</span>
        )}
        {saveState === "idle" && dirty && (
          <span className="text-sm text-muted-foreground">Unsaved changes</span>
        )}
        <Button size="sm" onClick={save} disabled={saveState === "saving"}>
          {saveState === "saving" ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: settings */}
        <div className="space-y-4 lg:col-span-5">
          <section className="space-y-3 rounded-xl border bg-card p-5">
            <div>
              <h3 className="text-sm font-semibold">Experience</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Classic keeps the screen that ships with your landing template. Embajadores replaces
                it with a referral hub.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.values(THANK_YOU_EXPERIENCES).map((def) => {
                const active = config.experience === def.id;
                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => update("experience", def.id)}
                    className={`w-full overflow-hidden rounded-xl border text-left transition ${
                      active ? "border-primary bg-primary/5" : "hover:bg-muted"
                    }`}
                  >
                    <div
                      className={`flex h-16 items-center justify-center px-3 ${def.thumbnail.bg} ${def.thumbnail.text}`}
                    >
                      <span className="truncate font-heading text-base">{def.name}</span>
                    </div>
                    <p className="px-3 py-2 text-xs text-muted-foreground">{def.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4 rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold">Confirmation</h3>
            <Field label="Message" htmlFor="thank_you.message" hint="Falls back to the built-in greeting.">
              <Input
                id="thank_you.message"
                value={str("message")}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Your spot is saved."
              />
            </Field>
            <Field label="Title" htmlFor="thank_you.title">
              <Input
                id="thank_you.title"
                value={str("title")}
                onChange={(e) => update("title", e.target.value)}
                placeholder="You're in"
              />
            </Field>
            <Field label="Subtitle" htmlFor="thank_you.subtitle">
              <Input
                id="thank_you.subtitle"
                value={str("subtitle")}
                onChange={(e) => update("subtitle", e.target.value)}
                placeholder="Share your link to move up."
              />
            </Field>
          </section>

          <section className="space-y-4 rounded-xl border bg-card p-5">
            <div>
              <h3 className="text-sm font-semibold">Referral</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Used by the classic screen. Landing templates render their own referral block.
              </p>
            </div>
            <Field label="Referral prompt" htmlFor="thank_you.description">
              <Input
                id="thank_you.description"
                value={str("description")}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Share your referral link to climb the ranks:"
              />
            </Field>
            <Field
              label="Position text"
              htmlFor="thank_you.position_text"
              hint="Tokens: {POSITION} and {TOTAL}."
            >
              <Input
                id="thank_you.position_text"
                value={str("position_text")}
                onChange={(e) => update("position_text", e.target.value)}
                placeholder="Your position: #{POSITION}"
              />
            </Field>
            <Field label="Referred text" htmlFor="thank_you.referred_text" hint="Token: {REFERRED}. No consumer yet.">
              <Input
                id="thank_you.referred_text"
                value={str("referred_text")}
                onChange={(e) => update("referred_text", e.target.value)}
                placeholder="You have referred {REFERRED} friends"
              />
            </Field>
          </section>

          <section className="space-y-4 rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold">Sharing</h3>
            <Field label="Share message" htmlFor="thank_you.social_message">
              <Input
                id="thank_you.social_message"
                value={str("social_message")}
                onChange={(e) => update("social_message", e.target.value)}
                placeholder="I just joined the waitlist!"
              />
            </Field>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Share buttons</p>
              <div className="grid grid-cols-3 gap-2">
                {SHARE_PLATFORMS.map((platform) => (
                  <Checkbox
                    key={platform}
                    checked={list("social_buttons").includes(platform)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...list("social_buttons"), platform]
                        : list("social_buttons").filter((p) => p !== platform);
                      update("social_buttons", next);
                    }}
                    label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Empty means WhatsApp, X and LinkedIn. Platforms without a share URL are skipped.
              </p>
            </div>
            <div className="space-y-3 border-t pt-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Profile links</p>
                <p className="text-xs text-muted-foreground">Saved, but nothing renders them yet.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SOCIAL_LINKS.map(([key, label, placeholder]) => (
                  <Input
                    key={key}
                    aria-label={label}
                    value={str(key)}
                    onChange={(e) => update(key, e.target.value)}
                    placeholder={placeholder}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold">Style &amp; tracking</h3>
            <Field label="Brand color" htmlFor="thank_you.brand_color" hint="Falls back to the project's primary color.">
              <div className="flex gap-2">
                <input
                  type="color"
                  aria-label="Brand color"
                  value={accentSwatch}
                  onChange={(e) => update("brand_color", e.target.value)}
                  className="w-14 rounded-lg border border-input p-1"
                />
                <Input
                  id="thank_you.brand_color"
                  value={str("brand_color")}
                  onChange={(e) => update("brand_color", e.target.value)}
                  className="flex-1 font-mono text-xs"
                  placeholder="Leave empty to use your brand color"
                />
              </div>
            </Field>
            <Field
              label="Tracking code"
              htmlFor="thank_you.tracking_code"
              hint="Injected before </head>. No consumer yet."
            >
              <textarea
                id="thank_you.tracking_code"
                value={str("tracking_code")}
                onChange={(e) => update("tracking_code", e.target.value)}
                rows={3}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                placeholder="Google Analytics, Ads, etc."
              />
            </Field>
            <Field label="Secondary CTA" htmlFor="thank_you.cta_label" hint="Label and URL, no consumer yet.">
              <div className="flex gap-2">
                <Input
                  id="thank_you.cta_label"
                  value={str("cta_label")}
                  onChange={(e) => update("cta_label", e.target.value)}
                  placeholder="Back to site"
                />
                <Input
                  aria-label="Secondary CTA URL"
                  value={str("cta_url")}
                  onChange={(e) => update("cta_url", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </Field>
          </section>

          <section className="space-y-4 rounded-xl border bg-card p-5">
            <div>
              <h3 className="text-sm font-semibold">Visibility</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Position, referral link and leaderboard apply to the classic screen.
              </p>
            </div>
            <ToggleRow
              id="thank_you.show_position"
              label="Show position"
              checked={bool("show_position")}
              onCheckedChange={(v) => update("show_position", v)}
            />
            <ToggleRow
              id="thank_you.show_referral_link"
              label="Show referral link"
              checked={bool("show_referral_link")}
              onCheckedChange={(v) => update("show_referral_link", v)}
            />
            <ToggleRow
              id="thank_you.show_leaderboard"
              label="Show leaderboard"
              checked={bool("show_leaderboard")}
              onCheckedChange={(v) => update("show_leaderboard", v)}
            />
            <ToggleRow
              id="thank_you.hide_confetti"
              label="Hide confetti"
              description="No consumer yet"
              checked={bool("hide_confetti", false)}
              onCheckedChange={(v) => update("hide_confetti", v)}
            />
            <ToggleRow
              id="thank_you.hide_referral"
              label="Hide referral"
              description="No consumer yet"
              checked={bool("hide_referral", false)}
              onCheckedChange={(v) => update("hide_referral", v)}
            />
            <ToggleRow
              id="thank_you.hide_until_verified"
              label="Hide success until verified"
              description="No consumer yet"
              checked={bool("hide_until_verified", false)}
              onCheckedChange={(v) => update("hide_until_verified", v)}
            />
            <ToggleRow
              id="thank_you.hide_branding"
              label="Hide powered by"
              checked={bool("hide_branding", false)}
              onCheckedChange={(v) => update("hide_branding", v)}
              disabled={plan !== "launch"}
            />
            {plan !== "launch" && (
              <p className="text-xs text-primary">Upgrade to Launch to hide branding</p>
            )}
          </section>
        </div>

        {/* Right: preview */}
        <div className="lg:col-span-7">
          <div className="sticky top-24 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b px-5 py-3.5">
              <div>
                <h3 className="text-sm font-semibold">Post-signup preview</h3>
                <p className="text-xs text-muted-foreground">Example numbers</p>
              </div>
            </div>
            <div className="flex items-center border-b bg-muted/50 px-4 py-2">
              <span className="mr-1.5 size-2.5 rounded-full bg-red-400/70" />
              <span className="mr-1.5 size-2.5 rounded-full bg-yellow-400/70" />
              <span className="mr-3 size-2.5 rounded-full bg-green-400/70" />
              <span className="truncate font-mono text-[11px] text-muted-foreground">
                /p/{slug}
              </span>
            </div>
            <div className="max-h-[700px] min-h-[500px] overflow-y-auto">
              {config.experience === "embajadores" ? (
                <Embajadores config={config} result={previewResult} layout="inline" />
              ) : (
                <div className="flex min-h-[500px] items-center justify-center p-8 text-center">
                  <p className="max-w-sm text-sm text-muted-foreground">
                    With <strong className="text-foreground">Classic</strong>, the post-signup
                    screen belongs to your landing template. Pick a template and preview it in the
                    Page Builder.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
