"use client";

import { useActionState } from "react";
import type { Database } from "@/lib/supabase/types";
import { updateWaitlistSettings } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


type Waitlist = Database["public"]["Tables"]["waitlists"]["Row"];

type State = { error?: string; success?: boolean } | null;

export function SettingsForm({ waitlist }: { waitlist: Waitlist }) {
  const settings = waitlist.settings as Record<string, unknown>;
  const branding = settings.branding as Record<string, unknown> || {};
  const hero = settings.hero as Record<string, unknown> || {};
  const form = settings.form as Record<string, unknown> || {};
  const thankYou = settings.thank_you as Record<string, unknown> || {};
  const referral = settings.referral as Record<string, unknown> || {};
  const notifications = settings.notifications as Record<string, unknown> || {};

  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => updateWaitlistSettings(waitlist.id, null, formData),
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Customize your waitlist page and widget.
          </p>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>

      {state?.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Settings saved successfully.
        </div>
      )}
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Customize the look and feel of your waitlist.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Waitlist name</Label>
            <Input id="name" name="name" defaultValue={waitlist.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" defaultValue={waitlist.slug} required />
            <p className="text-xs text-muted-foreground">Your page is at /p/{waitlist.slug}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="branding.logo_url">Logo URL</Label>
            <Input
              id="branding.logo_url"
              name="branding.logo_url"
              defaultValue={(branding.logo_url as string) ?? ""}
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branding.primary_color">Primary color</Label>
            <div className="flex gap-2">
              <Input
                id="branding.primary_color"
                name="branding.primary_color"
                type="color"
                defaultValue={(branding.primary_color as string) ?? "#22c563"}
                className="w-14 p-1"
              />
              <Input
                defaultValue={(branding.primary_color as string) ?? "#22c563"}
                className="flex-1 font-mono text-xs"
                readOnly
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero</CardTitle>
          <CardDescription>The main section of your waitlist page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hero.title">Title</Label>
            <Input
              id="hero.title"
              name="hero.title"
              defaultValue={(hero.title as string) ?? ""}
              placeholder="Join the waitlist"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero.subtitle">Subtitle</Label>
            <Input
              id="hero.subtitle"
              name="hero.subtitle"
              defaultValue={(hero.subtitle as string) ?? ""}
              placeholder="Be the first to know when we launch"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero.cta_label">CTA button text</Label>
            <Input
              id="hero.cta_label"
              name="hero.cta_label"
              defaultValue={(hero.cta_label as string) ?? "Join the waitlist"}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form</CardTitle>
          <CardDescription>Configure your signup form.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="form.collect_name">Collect name</Label>
            <Switch
              id="form.collect_name"
              name="form.collect_name"
              defaultChecked={(form.collect_name as boolean) ?? false}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thank you page</CardTitle>
          <CardDescription>What subscribers see after signing up.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="thank_you.message">Custom message</Label>
            <Input
              id="thank_you.message"
              name="thank_you.message"
              defaultValue={(thankYou.message as string) ?? ""}
              placeholder="You're on the list!"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="thank_you.show_position">Show position</Label>
            <Switch
              id="thank_you.show_position"
              name="thank_you.show_position"
              defaultChecked={(thankYou.show_position as boolean) ?? true}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="thank_you.show_referral_link">Show referral link</Label>
            <Switch
              id="thank_you.show_referral_link"
              name="thank_you.show_referral_link"
              defaultChecked={(thankYou.show_referral_link as boolean) ?? true}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="thank_you.show_leaderboard">Show leaderboard</Label>
            <Switch
              id="thank_you.show_leaderboard"
              name="thank_you.show_leaderboard"
              defaultChecked={(thankYou.show_leaderboard as boolean) ?? true}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referral settings</CardTitle>
          <CardDescription>
            Configure the viral loop mechanics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="referral.enabled">Enable referrals</Label>
            <Switch
              id="referral.enabled"
              name="referral.enabled"
              defaultChecked={(referral.enabled as boolean) ?? true}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referral.positions_per_referral">
              Positions per referral
            </Label>
            <Input
              id="referral.positions_per_referral"
              name="referral.positions_per_referral"
              type="number"
              defaultValue={(referral.positions_per_referral as number) ?? 10}
              min={1}
            />
            <p className="text-xs text-muted-foreground">
              How many positions a subscriber climbs for each referral.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="referral.reward_text">Reward text</Label>
            <Input
              id="referral.reward_text"
              name="referral.reward_text"
              defaultValue={(referral.reward_text as string) ?? ""}
              placeholder="Refer friends to climb the leaderboard!"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Get notified about new signups.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications.email_on_signup">Email on signup</Label>
            <Switch
              id="notifications.email_on_signup"
              name="notifications.email_on_signup"
              defaultChecked={(notifications.email_on_signup as boolean) ?? true}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notifications.slack_webhook_url">
              Slack webhook URL
            </Label>
            <Input
              id="notifications.slack_webhook_url"
              name="notifications.slack_webhook_url"
              defaultValue={(notifications.slack_webhook_url as string) ?? ""}
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language</CardTitle>
          <CardDescription>Choose the language for your waitlist page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              name="language"
              defaultValue={(settings.language as string) ?? "en"}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="pt">Portuguese</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
