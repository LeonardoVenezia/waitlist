"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CLASSIC_THANK_YOU_DEFAULTS } from "@/lib/thank-you";
import type { SubscribeResult } from "@/components/templates/use-waitlist-subscribe";

/**
 * The classic post-signup screen: what a project without a landing template
 * shows after a submit, and the only screen that reads `settings.thank_you`.
 *
 * Extracted so the dashboard's Thank You section can preview it with the live
 * values and a mock result, without duplicating the markup.
 */
export function ClassicThankYou({
  thankYou,
  result,
  showLeaderboard = true,
  copied = false,
  onCopy,
}: {
  thankYou: Record<string, unknown>;
  result: SubscribeResult;
  showLeaderboard?: boolean;
  copied?: boolean;
  onCopy?: () => void;
}) {
  const positionTemplate =
    (thankYou.position_text as string) || CLASSIC_THANK_YOU_DEFAULTS.position_text;
  // {POSITION} and {TOTAL} are both filled; the widget does the same.
  const positionText = result.position
    ? positionTemplate
        .replace("{POSITION}", String(result.position))
        .replace("{TOTAL}", result.total ? String(result.total) : "")
    : "";
  const referralPrompt =
    (thankYou.description as string) || CLASSIC_THANK_YOU_DEFAULTS.description;
  const showMilestones = Boolean(result.milestones && result.milestones.length > 0);

  return (
    <div className="space-y-4">
      {(thankYou.title as string) && (
        <p className="text-lg font-semibold">{thankYou.title as string}</p>
      )}
      {(thankYou.subtitle as string) && (
        <p className="text-sm text-muted-foreground">{thankYou.subtitle as string}</p>
      )}
      {(thankYou.message as string) ? (
        <p className="text-sm text-muted-foreground">{thankYou.message as string}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {CLASSIC_THANK_YOU_DEFAULTS.message}
          {thankYou.show_position !== false ? ` ${positionText}` : ""}
        </p>
      )}

      {result.reward_text && (
        <p className="text-sm font-medium text-primary">{result.reward_text}</p>
      )}

      {thankYou.show_referral_link !== false && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{referralPrompt}</p>
          <div className="flex gap-2">
            <Input value={result.referral_link} readOnly className="font-mono text-xs" />
            <Button onClick={onCopy} variant="outline" size="sm" type="button">
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      )}

      {showLeaderboard &&
        thankYou.show_leaderboard !== false &&
        result.leaderboard &&
        result.leaderboard.length > 0 && (
          <div className="rounded-lg border p-4 text-left">
            <h3 className="mb-2 text-sm font-medium">Leaderboard</h3>
            <div className="space-y-1 text-sm">
              {result.leaderboard.map((entry) => (
                <div key={entry.position} className="flex items-center justify-between">
                  <span>
                    <span className="font-medium">#{entry.position}</span>{" "}
                    {entry.email.split("@")[0]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.referral_count} referral{entry.referral_count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {showMilestones && (
        <div className="rounded-lg border p-4 text-left">
          <h3 className="mb-2 text-sm font-medium">Rewards</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {result.milestones!.map((m, i) => (
              <li key={i}>
                🎁 {m.reward} at {m.count} referrals
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
