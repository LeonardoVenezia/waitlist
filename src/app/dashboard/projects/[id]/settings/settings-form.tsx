"use client";

import { useActionState, useState } from "react";
import type { Database } from "@/lib/supabase/types";
import { updateProjectSettings, inviteTeamMember, removeTeamMember } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type TeamMember = {
  id: string;
  user_id: string;
  role: string;
  profiles: { email: string; full_name: string | null } | { email: string; full_name: string | null }[] | null;
};
type State = { error?: string; success?: boolean } | null;

// ── ColorInput helper ──
function ColorInput({ id, name, defaultValue, label }: { id: string; name: string; defaultValue: string; label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input id={id} name={name} type="color" defaultValue={defaultValue} className="w-14 p-1" />
        <Input defaultValue={defaultValue} className="flex-1 font-mono text-xs" readOnly />
      </div>
    </div>
  );
}

// ── ToggleRow ──
function ToggleRow({ id, name, label, description, defaultChecked, disabled }: {
  id: string; name: string; label: string; description?: string; defaultChecked?: boolean; disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor={id}>{label}</Label>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div>
        <Switch id={id} name={name} defaultChecked={defaultChecked} disabled={disabled} />
        <input type="hidden" name={name} value="off" disabled={disabled} />
      </div>
    </div>
  );
}

// ── SocialInput ──
function SocialInput({ id, name, label, placeholder, defaultValue }: {
  id: string; name: string; label: string; placeholder: string; defaultValue: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} defaultValue={defaultValue} placeholder={placeholder} />
    </div>
  );
}

// ── Upgrade Badge ──
function UpgradeBadge({ plan }: { plan: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
      <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
      {plan}
    </span>
  );
}

// ── Tab list ──
const TABS = [
  "Branding", "Hero", "Thank You", "Submissions", "Post-signup", "Email", "Notifications", "Team", "Block",
] as const;

// ── Milestones Editor ──
function MilestonesEditor({ defaultMilestones }: { defaultMilestones: Array<{ count: number; reward: string }> }) {
  const [milestones, setMilestones] = useState(defaultMilestones);

  return (
    <div className="space-y-2">
      <input type="hidden" name="referral.milestones" value={JSON.stringify(milestones)} />
      {milestones.map((m, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">At</span>
          <input
            type="number"
            value={m.count}
            min={1}
            onChange={(e) => {
              const next = [...milestones];
              next[i] = { ...next[i], count: Number(e.target.value) };
              setMilestones(next);
            }}
            className="w-16 rounded-lg border border-input bg-transparent px-2 py-1 text-xs text-center"
            placeholder="5"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">referrals →</span>
          <input
            type="text"
            value={m.reward}
            onChange={(e) => {
              const next = [...milestones];
              next[i] = { ...next[i], reward: e.target.value };
              setMilestones(next);
            }}
            className="flex-1 rounded-lg border border-input bg-transparent px-2 py-1 text-xs"
            placeholder="Unlock premium badge"
          />
          <button type="button" onClick={() => setMilestones(milestones.filter((_, j) => j !== i))} className="text-xs text-destructive hover:underline shrink-0">✕</button>
        </div>
      ))}
      <button type="button" onClick={() => setMilestones([...milestones, { count: 5, reward: "" }])} className="text-xs text-primary hover:underline">
        + Add milestone
      </button>
    </div>
  );
}

// ── Post-signup Editor ──
interface PostSignupQuestion {
  type: "text" | "textarea" | "select";
  label: string;
  required: boolean;
  options: string[];
}

function PostSignupEditor({ defaultPostSignup }: { defaultPostSignup: { enabled?: boolean; title?: string; questions?: PostSignupQuestion[] } }) {
  const [enabled, setEnabled] = useState(defaultPostSignup.enabled ?? false);
  const [title, setTitle] = useState(defaultPostSignup.title ?? "");
  const [questions, setQuestions] = useState<PostSignupQuestion[]>(defaultPostSignup.questions ?? []);

  function updateQuestion(idx: number, patch: Partial<PostSignupQuestion>) {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  const serialized = JSON.stringify({ enabled, title, questions });

  return (
    <div className="space-y-4">
      <input type="hidden" name="post_signup" value={serialized} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="rounded" />
        Enable post-signup questions
      </label>
      {enabled && (
        <>
          <div className="space-y-1">
            <Label htmlFor="ps_title">Step title</Label>
            <Input id="ps_title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tell us a bit more" />
          </div>
          <div className="space-y-2">
            <Label>Questions</Label>
            {questions.map((q, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(i, { type: e.target.value as PostSignupQuestion["type"], options: e.target.value === "select" ? q.options : [] })}
                    className="w-24 rounded-lg border border-input bg-transparent px-2 py-1 text-xs"
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select</option>
                  </select>
                  <input
                    type="text"
                    value={q.label}
                    onChange={(e) => updateQuestion(i, { label: e.target.value })}
                    className="flex-1 rounded-lg border border-input bg-transparent px-2 py-1 text-xs"
                    placeholder="What's your role?"
                  />
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                    <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(i, { required: e.target.checked })} className="rounded" />
                    Required
                  </label>
                  <button type="button" onClick={() => setQuestions(questions.filter((_, j) => j !== i))} className="text-xs text-destructive hover:underline shrink-0">✕</button>
                </div>
                {q.type === "select" && (
                  <textarea
                    value={(q.options ?? []).join("\n")}
                    onChange={(e) => updateQuestion(i, { options: e.target.value.split("\n").filter(Boolean) })}
                    className="w-full rounded-lg border border-input bg-transparent px-2 py-1 text-xs"
                    rows={3}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setQuestions([...questions, { type: "text", label: "", required: false, options: [] }])}
              className="text-xs text-primary hover:underline"
            >
              + Add question
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main ──
export function SettingsForm({ project, members, emailFrom }: { project: Project; members: TeamMember[]; emailFrom?: string }) {
  const settings = project.settings as Record<string, unknown>;
  const branding = (settings.branding ?? {}) as Record<string, unknown>;
  const hero = (settings.hero ?? {}) as Record<string, unknown>;
  const thankYou = (settings.thank_you ?? {}) as Record<string, unknown>;
  const referral = (settings.referral ?? {}) as Record<string, unknown>;
  const notifications = (settings.notifications ?? {}) as Record<string, unknown>;
  const email = (settings.email ?? {}) as Record<string, unknown>;
  const blockedEmails = (settings.blocked_emails as string[]) ?? [];

  const [tab, setTab] = useState<string>("Branding");

  const [teamState, teamAction, teamPending] = useActionState<State, FormData>(
    async (_prev, formData) => inviteTeamMember(project.id, formData),
    null,
  );

  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => updateProjectSettings(project.id, null, formData),
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="active_tab" value={tab} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Settings</h1>
          <p className="text-sm text-muted-foreground">Customize your waitlist page and widget.</p>
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save changes"}</Button>
      </div>

      {state?.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">Settings saved.</div>
      )}
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{state.error}</div>
      )}

      {/* Tab selector */}
      <div className="flex items-center gap-1 overflow-x-auto noscroll pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-card border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── BRANDING ── */}
      {tab === "Branding" && (
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Customize the look and feel of your project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project name</Label>
              <Input id="name" name="name" defaultValue={project.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" defaultValue={project.slug} required />
              <p className="text-xs text-muted-foreground">Your page is at /p/{project.slug}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branding.logo_url">Logo URL</Label>
              <Input id="branding.logo_url" name="branding.logo_url" defaultValue={(branding.logo_url as string) ?? ""} placeholder="https://example.com/logo.png" />
            </div>
            <ColorInput id="branding.primary_color" name="branding.primary_color" defaultValue={(branding.primary_color as string) ?? "#22c563"} label="Primary color" />
          </CardContent>
        </Card>
      )}

      {/* ── HERO ── */}
      {tab === "Hero" && (
        <Card>
          <CardHeader>
            <CardTitle>Hero</CardTitle>
            <CardDescription>The main section of your waitlist page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero.title">Title</Label>
              <Input id="hero.title" name="hero.title" defaultValue={(hero.title as string) ?? ""} placeholder="Join the waitlist" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero.subtitle">Subtitle</Label>
              <Input id="hero.subtitle" name="hero.subtitle" defaultValue={(hero.subtitle as string) ?? ""} placeholder="Be the first to know when we launch" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero.cta_label">CTA button text</Label>
              <Input id="hero.cta_label" name="hero.cta_label" defaultValue={(hero.cta_label as string) ?? "Join the waitlist"} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── THANK YOU ── */}
      {tab === "Thank You" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Thank You Page <UpgradeBadge plan="Launch" /></CardTitle>
              <CardDescription>What subscribers see after signing up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="thank_you.message">Custom message</Label>
                <Input id="thank_you.message" name="thank_you.message" defaultValue={(thankYou.message as string) ?? ""} placeholder="You're on the list!" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thank_you.title">Title</Label>
                <Input id="thank_you.title" name="thank_you.title" defaultValue={(thankYou.title as string) ?? ""} placeholder="You're on the waitlist!" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thank_you.subtitle">Subtitle</Label>
                <Input id="thank_you.subtitle" name="thank_you.subtitle" defaultValue={(thankYou.subtitle as string) ?? ""} placeholder="Want to get access sooner?" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thank_you.description">Reward description</Label>
                <Input id="thank_you.description" name="thank_you.description" defaultValue={(thankYou.description as string) ?? ""} placeholder="Move up the waitlist by sharing..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thank_you.position_text">Position text <span className="text-xs text-muted-foreground">(use {"{POSITION}"} and {"{TOTAL}"})</span></Label>
                <Input id="thank_you.position_text" name="thank_you.position_text" defaultValue={(thankYou.position_text as string) ?? ""} placeholder="Your current position is #{POSITION}" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thank_you.referred_text">Referred text <span className="text-xs text-muted-foreground">(use {"{REFERRED}"})</span></Label>
                <Input id="thank_you.referred_text" name="thank_you.referred_text" defaultValue={(thankYou.referred_text as string) ?? ""} placeholder="You have referred {REFERRED} friends" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thank_you.social_message">Social share message</Label>
                <Input id="thank_you.social_message" name="thank_you.social_message" defaultValue={(thankYou.social_message as string) ?? ""} placeholder="I just joined the waitlist!" />
              </div>
              <div>
                <Label>Social share buttons</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {["twitter", "threads", "whatsapp", "facebook", "linkedin", "reddit", "telegram", "vk", "email"].map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="thank_you.social_buttons" value={s} defaultChecked={((thankYou.social_buttons as string[]) ?? []).includes(s)} />
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <ColorInput id="thank_you.brand_color" name="thank_you.brand_color" defaultValue={(thankYou.brand_color as string) ?? "#0ea5e9"} label="Background color" />
              <div className="space-y-2">
                <Label htmlFor="thank_you.cta_label">CTA button text</Label>
                <Input id="thank_you.cta_label" name="thank_you.cta_label" defaultValue={(thankYou.cta_label as string) ?? ""} placeholder="Back to site" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thank_you.cta_url">CTA button URL</Label>
                <Input id="thank_you.cta_url" name="thank_you.cta_url" defaultValue={(thankYou.cta_url as string) ?? ""} placeholder="https://example.com" />
              </div>

              {/* Social links */}
              <div className="border-t pt-4 mt-4">
                <Label className="mb-2 block">Social links</Label>
                <div className="grid grid-cols-2 gap-3">
                  <SocialInput id="thank_you.social_twitter" name="thank_you.social_twitter" label="X/Twitter" placeholder="https://twitter.com/username" defaultValue={(thankYou.social_twitter as string) ?? ""} />
                  <SocialInput id="thank_you.social_instagram" name="thank_you.social_instagram" label="Instagram" placeholder="https://instagram.com/username" defaultValue={(thankYou.social_instagram as string) ?? ""} />
                  <SocialInput id="thank_you.social_threads" name="thank_you.social_threads" label="Threads" placeholder="https://threads.net/@username" defaultValue={(thankYou.social_threads as string) ?? ""} />
                  <SocialInput id="thank_you.social_linkedin" name="thank_you.social_linkedin" label="LinkedIn" placeholder="https://linkedin.com/in/username" defaultValue={(thankYou.social_linkedin as string) ?? ""} />
                  <SocialInput id="thank_you.social_facebook" name="thank_you.social_facebook" label="Facebook" placeholder="https://facebook.com/username" defaultValue={(thankYou.social_facebook as string) ?? ""} />
                  <SocialInput id="thank_you.social_reddit" name="thank_you.social_reddit" label="Reddit" placeholder="https://reddit.com/s/name" defaultValue={(thankYou.social_reddit as string) ?? ""} />
                  <SocialInput id="thank_you.social_telegram" name="thank_you.social_telegram" label="Telegram" placeholder="https://t.me/username" defaultValue={(thankYou.social_telegram as string) ?? ""} />
                  <SocialInput id="thank_you.social_whatsapp" name="thank_you.social_whatsapp" label="WhatsApp" placeholder="https://wa.me/phone" defaultValue={(thankYou.social_whatsapp as string) ?? ""} />
                  <SocialInput id="thank_you.social_tiktok" name="thank_you.social_tiktok" label="TikTok" placeholder="https://tiktok.com/@username" defaultValue={(thankYou.social_tiktok as string) ?? ""} />
                  <SocialInput id="thank_you.social_youtube" name="thank_you.social_youtube" label="YouTube" placeholder="https://youtube.com/channel/name" defaultValue={(thankYou.social_youtube as string) ?? ""} />
                  <SocialInput id="thank_you.social_discord" name="thank_you.social_discord" label="Discord" placeholder="https://discord.gg/name" defaultValue={(thankYou.social_discord as string) ?? ""} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thank_you.tracking_code">Tracking code <span className="text-xs text-muted-foreground">(JS, before &lt;/head&gt;)</span></Label>
                <textarea id="thank_you.tracking_code" name="thank_you.tracking_code" rows={3} defaultValue={(thankYou.tracking_code as string) ?? ""} className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" placeholder="Google Analytics, Ads, etc." />
              </div>

              <ToggleRow id="thank_you.show_position" name="thank_you.show_position" label="Show position" defaultChecked={(thankYou.show_position as boolean) ?? true} />
              <ToggleRow id="thank_you.show_referral_link" name="thank_you.show_referral_link" label="Show referral link" defaultChecked={(thankYou.show_referral_link as boolean) ?? true} />
              <ToggleRow id="thank_you.show_leaderboard" name="thank_you.show_leaderboard" label="Show leaderboard" defaultChecked={(thankYou.show_leaderboard as boolean) ?? true} />
              <ToggleRow id="thank_you.hide_confetti" name="thank_you.hide_confetti" label="Hide confetti" defaultChecked={(thankYou.hide_confetti as boolean) ?? false} />
              <ToggleRow id="thank_you.hide_referral" name="thank_you.hide_referral" label="Hide referral" defaultChecked={(thankYou.hide_referral as boolean) ?? false} />
              <ToggleRow id="thank_you.hide_branding" name="thank_you.hide_branding" label="Hide powered by" disabled={project.plan !== "grow"} defaultChecked={(thankYou.hide_branding as boolean) ?? false} />
              {project.plan !== "grow" && <p className="text-xs text-primary">Upgrade to Grow to hide branding</p>}
              <ToggleRow id="thank_you.hide_until_verified" name="thank_you.hide_until_verified" label="Hide success until verified" defaultChecked={(thankYou.hide_until_verified as boolean) ?? false} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── SUBMISSIONS ── */}
      {tab === "Submissions" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Submissions <UpgradeBadge plan="Launch" /></CardTitle>
            <CardDescription>Manage submission behavior.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="submissions.initial_position">Initial position <span className="text-xs text-muted-foreground">(inflate ranking)</span></Label>
              <Input id="submissions.initial_position" name="submissions.initial_position" type="number" defaultValue={(referral.starting_position_offset as number) ?? 0} min={0} disabled={project.plan === "free"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="submissions.position_to_move">Positions per referral</Label>
              <Input id="submissions.position_to_move" name="submissions.position_to_move" type="number" defaultValue={(referral.positions_per_referral as number) ?? 10} min={1} disabled={project.plan === "free"} />
              <p className="text-xs text-muted-foreground">How many spots a subscriber climbs for each referral.</p>
            </div>
            <ToggleRow id="referral.enabled" name="referral.enabled" label="Enable referrals" defaultChecked={(referral.enabled as boolean) ?? true} />
            <div className="space-y-2">
              <Label htmlFor="referral.reward_text">Reward text</Label>
              <Input id="referral.reward_text" name="referral.reward_text" defaultValue={(referral.reward_text as string) ?? ""} placeholder="Refer friends to climb the leaderboard!" />
            </div>
            {/* Referral milestones */}
            <div className="border-t pt-4 mt-4">
              <Label className="mb-2 block">Referral milestones</Label>
              <p className="text-xs text-muted-foreground mb-3">Set rewards that unlock at specific referral counts. These appear on the thank-you page.</p>
              <MilestonesEditor defaultMilestones={(referral.milestones as Array<{ count: number; reward: string }>) ?? []} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── POST-SIGNUP ── */}
      {tab === "Post-signup" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Post-signup questions <UpgradeBadge plan="Launch" /></CardTitle>
            <CardDescription>Ask follow-up questions after a subscriber joins (e.g. role, interests).</CardDescription>
          </CardHeader>
          <CardContent>
            <PostSignupEditor defaultPostSignup={(settings.post_signup as { enabled?: boolean; title?: string; questions?: PostSignupQuestion[] }) ?? {}} />
          </CardContent>
        </Card>
      )}

      {/* ── EMAIL ── */}
      {tab === "Email" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Email Settings <UpgradeBadge plan="Launch" /></CardTitle>
              <CardDescription>How emails are sent to subscribers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow id="email.welcome_email" name="email.welcome_email" label="Send welcome email" defaultChecked={(email.welcome_email as boolean) ?? true} />
              <div className="space-y-2">
                <Label htmlFor="email.welcome_subject">Welcome email subject</Label>
                <Input id="email.welcome_subject" name="email.welcome_subject" defaultValue={(email.welcome_subject as string) ?? ""} disabled={project.plan === "free"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email.welcome_message">Welcome email message</Label>
                <textarea id="email.welcome_message" name="email.welcome_message" rows={3} defaultValue={(email.welcome_message as string) ?? ""} className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" disabled={project.plan === "free"} />
              </div>
              <ToggleRow id="email.hide_welcome_cta" name="email.hide_welcome_cta" label="Hide CTA on welcome mail" defaultChecked={(email.hide_welcome_cta as boolean) ?? false} disabled={project.plan === "free"} />
              <ToggleRow id="email.customize_welcome_cta" name="email.customize_welcome_cta" label="Customize CTA URL" defaultChecked={(email.customize_welcome_cta as boolean) ?? false} disabled={project.plan === "free"} />
              <div className="space-y-2">
                <Label htmlFor="email.welcome_cta_url">CTA destination URL</Label>
                <Input id="email.welcome_cta_url" name="email.welcome_cta_url" defaultValue={(email.welcome_cta_url as string) ?? ""} disabled={project.plan === "free"} />
              </div>
              <ToggleRow id="email.welcome_after_verification" name="email.welcome_after_verification" label="Send welcome after verification" defaultChecked={(email.welcome_after_verification as boolean) ?? false} disabled={project.plan === "free"} />
              <ToggleRow id="email.verify_email" name="email.verify_email" label="Send verification email" defaultChecked={(email.verify_email as boolean) ?? project.plan !== "free"} disabled={project.plan === "free"} />
              <div className="space-y-2">
                <Label htmlFor="email.verify_message">Verification message</Label>
                <textarea id="email.verify_message" name="email.verify_message" rows={2} defaultValue={(email.verify_message as string) ?? ""} className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" disabled={project.plan === "free"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email.signature">Email signature</Label>
                <textarea id="email.signature" name="email.signature" rows={2} defaultValue={(email.signature as string) ?? ""} className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" disabled={project.plan === "free"} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email.reply_to_name">Reply-to name</Label>
                  <Input id="email.reply_to_name" name="email.reply_to_name" defaultValue={(email.reply_to_name as string) ?? ""} disabled={project.plan === "free"} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email.reply_to_email">Reply-to email</Label>
                  <Input id="email.reply_to_email" name="email.reply_to_email" type="email" defaultValue={(email.reply_to_email as string) ?? ""} disabled={project.plan === "free"} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Send from</Label>
                <p className="text-xs text-muted-foreground">
                  {emailFrom || "LaunchList <hola@leovenezia.dev>"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab === "Notifications" && (
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Get notified about new signups.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow id="notifications.email_on_signup" name="notifications.email_on_signup" label="Email on new signup" defaultChecked={(notifications.email_on_signup as boolean) ?? true} />
            <div className="space-y-2">
              <Label htmlFor="notifications.slack_webhook_url">Slack webhook URL</Label>
              <Input id="notifications.slack_webhook_url" name="notifications.slack_webhook_url" defaultValue={(notifications.slack_webhook_url as string) ?? ""} placeholder="https://hooks.slack.com/services/..." disabled={project.plan === "free"} />
              {project.plan === "free" && <p className="text-xs text-primary">Upgrade to Launch to enable Slack notifications</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TEAM ── */}
      {tab === "Team" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <CardDescription>Invite members to manage this project.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={teamAction} className="flex items-end gap-3">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="team-email">Email</Label>
                  <Input id="team-email" name="email" type="email" placeholder="colleague@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-role">Role</Label>
                  <select id="team-role" name="role" defaultValue="member" className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                </div>
                <Button type="submit" disabled={teamPending}>{teamPending ? "Inviting..." : "Invite"}</Button>
              </form>
              {teamState?.error && <p className="text-sm text-destructive mt-2">{teamState.error}</p>}
              {teamState?.success && <p className="text-sm text-green-600 mt-2">Member invited!</p>}
            </CardContent>
          </Card>
          {/* Members list */}
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1">No team members yet.</p>
          ) : (
            <div className="rounded-lg border divide-y">
              {members.map((m) => {
                const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                return (
                  <div key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <span className="font-medium">{profile?.email ?? m.user_id}</span>
                      <span className="ml-2 text-xs text-muted-foreground capitalize">{m.role}</span>
                    </div>
                    <form action={async () => {
                      await removeTeamMember(project.id, m.id);
                    }}>
                      <Button variant="ghost" size="xs" type="submit">Remove</Button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── BLOCK ── */}
      {tab === "Block" && (
        <Card>
          <CardHeader>
            <CardTitle>Block list</CardTitle>
            <CardDescription>Block specific emails or domains from signing up. Comma-separated.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blocked_emails">Blocked emails/domains</Label>
              <textarea id="blocked_emails" name="blocked_emails" rows={4} defaultValue={blockedEmails.join(", ")} className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" placeholder="spam@example.com, spammer.com" />
              <p className="text-xs text-muted-foreground">Separate entries with commas. You can block full domains too (e.g. mailinator.com).</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Language */}
      {tab === "Branding" && (
        <Card>
          <CardHeader>
            <CardTitle>Language</CardTitle>
            <CardDescription>Choose the language for your waitlist page.</CardDescription>
          </CardHeader>
          <CardContent>
            <select id="language" name="language" defaultValue={(settings.language as string) ?? "en"} className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="pt">Portuguese</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save changes"}</Button>
      </div>
    </form>
  );
}
