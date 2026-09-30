/**
 * What the classic post-signup screen shows when a field is empty.
 *
 * Single source of truth on purpose: the screen renders these values, and the
 * dashboard's Thank You section uses them as input placeholders, so a
 * placeholder always says exactly what the screen would show by default.
 *
 * Templates' own post-signup screens are hardcoded per template and do not read
 * `settings.thank_you`, so there is no equivalent default set for them.
 */
export const CLASSIC_THANK_YOU_DEFAULTS = {
  message: "You're on the list!",
  position_text: "Your position: #{POSITION}",
  description: "Share your referral link to climb the ranks:",
};
