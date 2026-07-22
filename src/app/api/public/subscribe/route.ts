import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReferralCode } from "@/lib/api/referral-code";
import { isDisposableEmail } from "@/lib/disposable-emails";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { validateTurnstileToken } from "@/lib/api/validate-turnstile";
import { getSubscriberCount, getSubscriberPosition } from "@/lib/api/position";
import { getLeaderboard } from "@/lib/api/leaderboard";
import { sendEmail } from "@/lib/email";
import { renderWelcomeEmail } from "@/emails/welcome";
import { renderSignupNotificationEmail } from "@/emails/signup-notification";
import { renderVerificationEmail } from "@/emails/verify";
import { createVerificationToken } from "@/lib/api/verify-token";
import { sendSlackNotification } from "@/lib/api/slack";
import { hasFeature } from "@/lib/plan-gates";
import { jsonResponse, corsOptionsResponse } from "@/lib/api/cors";
import { headers } from "next/headers";
import type { Json } from "@/lib/supabase/types";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: Request) {
  const supabase = createAdminClient();

  // Parse body — supports JSON and form-urlencoded
  let body: Record<string, unknown>;
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    body = await request.json();
  } else {
    const formData = await request.formData();
    body = Object.fromEntries(formData);
  }

  const publicKey = body.public_key as string;
  const email = (body.email as string)?.toLowerCase().trim();
  const refCode = body.ref as string | undefined;
  const turnstileToken = body.turnstile_token as string | undefined;
  const customFields = body.fields ? JSON.parse(body.fields as string) : undefined;

  // 1. Validate public key → find waitlist
  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, name, slug, plan, submission_limit, settings, account_id")
    .eq("public_key", publicKey)
    .eq("status", "active")
    .maybeSingle();

  if (!waitlist) {
    return jsonResponse(
      { error: "Invalid public key" },
      { status: 404 },
    );
  }

  const settings = waitlist.settings as Record<string, unknown>;
  const referralSettings = settings.referral as Record<string, unknown> || {};

  // 2. Validate Turnstile token
  if (turnstileToken) {
    const valid = await validateTurnstileToken(turnstileToken);
    if (!valid) {
      return jsonResponse(
        { error: "Invalid captcha. Please try again." },
        { status: 400 },
      );
    }
  }

  // 3. Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return jsonResponse(
      { error: "Invalid email format" },
      { status: 400 },
    );
  }

  // 4. Check disposable email
  if (isDisposableEmail(email)) {
    return jsonResponse(
      { error: "Disposable email addresses are not allowed" },
      { status: 400 },
    );
  }

  // 5. Rate limit by IP
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip") ?? "unknown";
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return jsonResponse(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  // 6. Generate referral code
  let referralCode = generateReferralCode();
  let codeExists = true;
  // Collision check (simple retry)
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase
      .from("subscribers")
      .select("id")
      .eq("waitlist_id", waitlist.id)
      .eq("referral_code", referralCode)
      .maybeSingle();
    if (!existing) {
      codeExists = false;
      break;
    }
    referralCode = generateReferralCode();
  }
  if (codeExists) {
    return jsonResponse(
      { error: "Failed to generate unique code. Please try again." },
      { status: 500 },
    );
  }

  // 7. Check if email already exists
  const { data: existingSubscriber } = await supabase
    .from("subscribers")
    .select("id, status")
    .eq("waitlist_id", waitlist.id)
    .eq("email", email)
    .maybeSingle();

  if (existingSubscriber) {
    return jsonResponse(
      { error: "This email is already on the waitlist" },
      { status: 409 },
    );
  }

  // 8. Check submission limit
  const currentCount = await getSubscriberCount(waitlist.id);
  const limit = waitlist.submission_limit;
  const isOverLimit = limit !== null && limit > 0 && currentCount >= limit;

  // 9. Lookup referrer
  let referredById: string | null = null;
  if (refCode) {
    const { data: referrer } = await supabase
      .from("subscribers")
      .select("id")
      .eq("waitlist_id", waitlist.id)
      .eq("referral_code", refCode)
      .maybeSingle();
    if (referrer) {
      referredById = referrer.id;
    }
  }

  // 10. Build metadata
  const metadata: Record<string, unknown> = {
    ip,
    user_agent: headersList.get("user-agent"),
  };
  if (customFields) {
    metadata.custom_fields = customFields;
  }

  // 11. Insert subscriber (in a real transaction — but Supabase JS doesn't support
  // multi-statement transactions, so we rely on the single insert + follow-up update)
  const { data: subscriber, error: insertError } = await supabase
    .from("subscribers")
    .insert({
      waitlist_id: waitlist.id,
      email,
      referral_code: referralCode,
      referred_by: referredById,
      status: isOverLimit ? "hidden" : "active",
      metadata: metadata as unknown as Json,
    })
    .select("id")
    .single();

  if (insertError) {
    // Handle duplicate email race condition
    if (insertError.code === "23505") {
      return jsonResponse(
        { error: "This email is already on the waitlist" },
        { status: 409 },
      );
    }
    return jsonResponse(
      { error: "Failed to join waitlist" },
      { status: 500 },
    );
  }

  // 12. If referrer exists, increment their referral_count
  if (referredById) {
    await supabase.rpc("increment_referral_count", {
      p_subscriber_id: referredById,
    }).then(({ error }) => {
      if (error) {
        // Non-fatal — subscriber was created, just log
        console.error("Failed to increment referral count:", error);
      }
    });
  }

  // 13. Get position and leaderboard
  const position = await getSubscriberPosition(subscriber.id);
  const leaderboard = (referralSettings.enabled !== false)
    ? await getLeaderboard(waitlist.id)
    : undefined;

  const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/p/${waitlist.slug}`;

  // 14. Send emails (fire-and-forget — non-blocking)
  const plan = waitlist.plan as "free" | "launch" | "grow" | "scale";

  // Welcome email (Launch+)
  if (hasFeature(plan, "welcome_email")) {
    sendEmail({
      to: email,
      subject: `You're on the waitlist for ${waitlist.name}!`,
      html: renderWelcomeEmail({
        email,
        waitlistName: waitlist.name,
        referralLink: `${pageUrl}?ref=${referralCode}`,
        position,
      }),
    }).catch(() => {});
  }

  // Signup notification to waitlist owner (Free+)
  const notifSettings = settings.notifications as Record<string, unknown> || {};
  if (notifSettings.email_on_signup !== false) {
    const { data: owner } = await supabase
      .from("accounts")
      .select("owner_id")
      .eq("id", waitlist.account_id)
      .single();

    if (owner) {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", owner.owner_id)
        .single();

      if (ownerProfile?.email) {
        sendEmail({
          to: ownerProfile.email,
          subject: `New signup: ${email} joined ${waitlist.name}`,
          html: renderSignupNotificationEmail({
            waitlistName: waitlist.name,
            subscriberEmail: email,
            referralCode,
            totalCount: currentCount + 1,
          }),
        }).catch(() => {});
      }
    }
  }

  // Verification email (Launch+ — double opt-in)
  if (hasFeature(plan, "double_optin")) {
    const vToken = createVerificationToken(subscriber.id, email);
    const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/public/verify?token=${vToken}`;
    sendEmail({
      to: email,
      subject: `Verify your email for ${waitlist.name}`,
      html: renderVerificationEmail({
        email,
        waitlistName: waitlist.name,
        verificationLink: verifyLink,
      }),
    }).catch(() => {});
  }

  // Slack notification (Launch+)
  const slackWebhook = notifSettings.slack_webhook_url as string | undefined;
  if (slackWebhook && hasFeature(plan, "slack_notification")) {
    sendSlackNotification(
      slackWebhook,
      `:wave: New waitlist signup!\n*Email:* ${email}\n*Waitlist:* ${waitlist.name}\n*Referral code:* ${referralCode}\n*Position:* ${position ?? "?"}`,
    ).catch(() => {});
  }

  return jsonResponse({
    id: subscriber.id,
    email,
    position,
    referral_code: referralCode,
    referral_link: `${pageUrl}?ref=${referralCode}`,
    leaderboard,
  });
}
