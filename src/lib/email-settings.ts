export interface EmailSettings {
  welcomeEmail: boolean;
  verifyEmail: boolean;
  welcomeAfterVerification: boolean;
  welcomeSubject?: string;
  welcomeMessage?: string;
  verifyMessage?: string;
  signature?: string;
  hideWelcomeCta: boolean;
  customizeWelcomeCta: boolean;
  welcomeCtaUrl?: string;
  replyTo?: string;
}

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function asBool(value: unknown): boolean {
  return value === true;
}

export function parseEmailSettings(value: unknown): EmailSettings {
  const raw = (value ?? {}) as Record<string, unknown>;

  const replyToEmail = asString(raw.reply_to_email);
  const replyToName = asString(raw.reply_to_name);

  return {
    welcomeEmail: raw.welcome_email !== false,
    verifyEmail: raw.verify_email !== false,
    welcomeAfterVerification: asBool(raw.welcome_after_verification),
    welcomeSubject: asString(raw.welcome_subject),
    welcomeMessage: asString(raw.welcome_message),
    verifyMessage: asString(raw.verify_message),
    signature: asString(raw.signature),
    hideWelcomeCta: asBool(raw.hide_welcome_cta),
    customizeWelcomeCta: asBool(raw.customize_welcome_cta),
    welcomeCtaUrl: asString(raw.welcome_cta_url),
    replyTo: replyToEmail
      ? replyToName
        ? `${replyToName} <${replyToEmail}>`
        : replyToEmail
      : undefined,
  };
}
