import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyToken } from "@/lib/api/verify-token";
import { getSubscriberPosition } from "@/lib/api/position";
import { sendEmail } from "@/lib/email";
import { parseEmailSettings } from "@/lib/email-settings";
import { renderWelcomeEmail } from "@/emails/welcome";
import { hasFeature } from "@/lib/plans";
import { jsonResponse, corsOptionsResponse } from "@/lib/api/cors";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return jsonResponse({ error: "Missing token" }, { status: 400 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return jsonResponse(
      { error: "Invalid or expired verification link" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("id, waitlist_id, email, referral_code, verified")
    .eq("id", payload.subscriberId)
    .eq("email", payload.email)
    .maybeSingle();

  if (!subscriber) {
    return jsonResponse(
      { error: "Invalid or expired verification link" },
      { status: 400 },
    );
  }

  const wasAlreadyVerified = subscriber.verified === true;

  const { error } = await supabase
    .from("subscribers")
    .update({ verified: true })
    .eq("id", payload.subscriberId)
    .eq("email", payload.email);

  if (error) {
    return jsonResponse(
      { error: "Failed to verify email" },
      { status: 500 },
    );
  }

  // Send welcome email after verification when configured
  if (!wasAlreadyVerified) {
    const { data: waitlist } = await supabase
      .from("projects")
      .select("id, name, slug, plan, settings")
      .eq("id", subscriber.waitlist_id)
      .maybeSingle();

    if (waitlist) {
      const plan = waitlist.plan as "free" | "launch" | "grow" | "scale";
      const emailSettings = parseEmailSettings(
        (waitlist.settings as Record<string, unknown> | null)?.email,
      );

      if (
        hasFeature(plan, "welcome_email") &&
        emailSettings.welcomeEmail &&
        emailSettings.welcomeAfterVerification
      ) {
        const position = await getSubscriberPosition(subscriber.id);
        const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/p/${waitlist.slug}`;
        const referralLink = `${pageUrl}?ref=${subscriber.referral_code}`;

        const referralSettings =
          ((waitlist.settings as Record<string, unknown> | null)?.referral as Record<string, unknown>) ??
          {};
        const milestones =
          (referralSettings.milestones as Array<{ count: number; reward: string }>) ?? [];
        const rewardText = referralSettings.reward_text as string | undefined;

        sendEmail({
          to: subscriber.email,
          subject: emailSettings.welcomeSubject ?? `You're on the waitlist for ${waitlist.name}!`,
          html: renderWelcomeEmail({
            email: subscriber.email,
            waitlistName: waitlist.name,
            referralLink,
            position,
            milestones,
            rewardText,
            message: emailSettings.welcomeMessage,
            signature: emailSettings.signature,
            hideCta: emailSettings.hideWelcomeCta,
            customizeCta: emailSettings.customizeWelcomeCta,
            ctaUrl: emailSettings.welcomeCtaUrl,
          }),
          replyTo: emailSettings.replyTo,
        }).catch(() => {});
      }
    }
  }

  // Redirect to a success page
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}?verified=1`);
}