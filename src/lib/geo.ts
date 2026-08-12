// ponytail: relies on Cloudflare proxy sending CF-IPCountry.
// If the domain is not proxied (grey cloud), this returns null silently.
export function getCountryFromHeaders(headersList: Headers): string | null {
  const country = headersList.get("cf-ipcountry");
  if (!country || country === "XX") return null;
  return country;
}
