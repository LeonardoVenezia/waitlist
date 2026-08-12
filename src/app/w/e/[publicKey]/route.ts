import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ publicKey: string }> },
) {
  const { publicKey } = await params;
  const supabase = createAdminClient();

  const { data: waitlist } = await supabase
    .from("projects")
    .select("id, name, public_key, settings")
    .eq("public_key", publicKey)
    .eq("status", "active")
    .maybeSingle();

  if (!waitlist) {
    return new NextResponse("Not found", { status: 404 });
  }

  const settings = (waitlist.settings as Record<string, unknown>) ?? {};
  const widget = (settings.widget ?? {}) as Record<string, unknown>;
  const layout = (widget.layout ?? {}) as Record<string, unknown>;
  const input = (widget.input ?? {}) as Record<string, unknown>;
  const button = (widget.button ?? {}) as Record<string, unknown>;
  const collectName = (widget.collect_name as boolean) ?? false;
  const thankYou = (settings.thank_you ?? {}) as Record<string, unknown>;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const cornerRadius = (layout.corner_radius as number) ?? 10;
  const fontSize = (layout.font_size as number) ?? 15;
  const borderWidth = (layout.border_width as number) ?? 1;
  const borderColor = (input.border_color as string) ?? "#cccccc";
  const inputBg = (input.background_color as string) ?? "#ffffff";
  const inputText = (input.text_color as string) ?? "#374151";
  const placeholderColor = (input.placeholder_color as string) ?? "#999999";
  const buttonLabel = (button.label as string) || "Sign Up";
  const buttonBg = (button.background_color as string) ?? "#0ea5e9";
  const buttonText = (button.text_color as string) ?? "#ffffff";
  const buttonBorder = (button.border_color as string) ?? "#0ea5e9";

  const thankTitle = (thankYou.title as string) || "";
  const thankSubtitle = (thankYou.subtitle as string) || "";
  const thankMessage = (thankYou.message as string) || "";
  const thankDescription = (thankYou.description as string) || "Share your referral link:";
  const thankPositionText = (thankYou.position_text as string) || "Your position: #{POSITION}";
  const thankShowPosition = (thankYou.show_position as boolean) ?? true;
  const thankShowReferral = (thankYou.show_referral_link as boolean) ?? true;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: transparent; }
    .wl-widget { display: flex; flex-direction: column; gap: 8px; width: 100%; }
    .wl-input { width: 100%; padding: 8px 12px; border: ${borderWidth}px solid ${borderColor}; border-radius: ${cornerRadius}px; font-size: ${fontSize}px; color: ${inputText}; background: ${inputBg}; outline: none; }
    .wl-input::placeholder { color: ${placeholderColor}; }
    .wl-input:focus { border-color: ${buttonBg}; box-shadow: 0 0 0 1px ${buttonBg}; }
    .wl-btn { width: 100%; padding: 8px 16px; border: ${borderWidth}px solid ${buttonBorder}; border-radius: ${cornerRadius}px; font-size: ${fontSize}px; font-weight: 500; color: ${buttonText}; background: ${buttonBg}; cursor: pointer; }
    .wl-btn:hover { opacity: 0.9; }
    .wl-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .wl-msg { padding: 8px 12px; border-radius: ${cornerRadius}px; font-size: 14px; width: 100%; display: none; }
    .wl-msg.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; display: block; }
    .wl-msg.success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; display: block; }
    .wl-success { display: none; flex-direction: column; gap: 12px; width: 100%; }
    .wl-success .wl-ref-link { font-size: 13px; background: ${inputBg}; border: 1px solid ${borderColor}; border-radius: ${cornerRadius}px; padding: 6px 10px; word-break: break-all; width: 100%; text-align: center; color: ${inputText}; }
    .wl-success .wl-copy-btn { padding: 6px 12px; font-size: 13px; border-radius: ${cornerRadius}px; cursor: pointer; color: ${buttonText}; background: ${buttonBg}; border: 1px solid ${buttonBorder}; }
  </style>
</head>
<body>
  <div id="wl-root"></div>
  <script>
    (function() {
      var PK = "${waitlist.public_key}";
      var API = "${appUrl}/api/public";
      var collectName = ${collectName};
      var formDiv = document.getElementById("wl-root");
      var thankTitle = ${JSON.stringify(thankTitle)};
      var thankSubtitle = ${JSON.stringify(thankSubtitle)};
      var thankMessage = ${JSON.stringify(thankMessage)};
      var thankDescription = ${JSON.stringify(thankDescription)};
      var thankPositionText = ${JSON.stringify(thankPositionText)};
      var thankShowPosition = ${thankShowPosition};
      var thankShowReferral = ${thankShowReferral};

      function escapeHtml(str) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
      }

      function renderForm() {
        formDiv.innerHTML = '<div class="wl-widget">' +
          '<div class="wl-msg" id="wl-msg"></div>' +
          ${collectName ? "'<input type=\"text\" class=\"wl-input\" id=\"wl-name\" placeholder=\"Name\" />' +" : "'' +"}
          '<input type="email" class=\"wl-input\" id=\"wl-email\" placeholder=\"you@example.com\" required />' +
          '<button class=\"wl-btn\" id=\"wl-submit\">${buttonLabel.replace(/'/g, "\\'")}</button>' +
          '</div>';
        document.getElementById("wl-submit").addEventListener("click", submit);
      }

      function renderSuccess(data) {
        var html = '<div class="wl-success">';
        if (thankTitle) html += '<p style="font-size:16px;font-weight:600;text-align:center;margin:0;color:${inputText};">' + escapeHtml(thankTitle) + '</p>';
        if (thankSubtitle) html += '<p style="font-size:14px;text-align:center;color:#6b7280;margin:0 0 8px;">' + escapeHtml(thankSubtitle) + '</p>';
        if (thankMessage) {
          html += '<div class="wl-msg success">' + escapeHtml(thankMessage) + '</div>';
        } else {
          var posText = thankPositionText.replace(/{POSITION}/g, data.position || (thankShowPosition ? data.position : ""));
          html += '<div class="wl-msg success">' + escapeHtml(posText) + '</div>';
        }
        if (thankShowReferral) {
          html += '<p style="font-size:14px;color:${inputText};">' + escapeHtml(thankDescription) + '</p>';
          html += '<div class="wl-ref-link" id="wl-ref-link">' + escapeHtml(data.referral_link) + '</div>';
          html += '<button class="wl-copy-btn" id="wl-copy">Copy link</button>';
        }
        html += '</div>';
        formDiv.innerHTML = html;
        var copyBtn = document.getElementById("wl-copy");
        if (copyBtn) {
          copyBtn.addEventListener("click", function() {
            var link = data.referral_link;
            navigator.clipboard.writeText(link).then(function() {
              copyBtn.textContent = "Copied!";
            });
          });
        }
      }

      function showMsg(text, type) {
        var el = document.getElementById("wl-msg");
        if (!el) return;
        el.textContent = text;
        el.className = "wl-msg " + type;
      }

      async function submit() {
        var emailEl = document.getElementById("wl-email");
        var nameEl = document.getElementById("wl-name");
        var btn = document.getElementById("wl-submit");
        var email = emailEl ? emailEl.value.trim() : "";
        if (!email) { showMsg("Please enter your email", "error"); return; }
        btn.disabled = true;
        btn.textContent = "Joining...";
        try {
          var body = { public_key: PK, email: email };
          if (collectName && nameEl) body.name = nameEl.value.trim();
          var res = await fetch(API + "/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
          var data = await res.json();
          if (!res.ok) { showMsg(data.error || "Something went wrong", "error"); btn.disabled = false; btn.textContent = "${buttonLabel.replace(/'/g, "\\'")}"; return; }
          renderSuccess(data);
        } catch(e) {
          showMsg("Network error. Please try again.", "error");
          btn.disabled = false;
          btn.textContent = "${buttonLabel.replace(/'/g, "\\'")}";
        }
      }

      renderForm();
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
