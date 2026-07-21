(function () {
  "use strict";

  var API_BASE = "/api/public";

  // Find all waitlist container elements
  var containers = document.querySelectorAll(".wl-waitlist");
  if (!containers.length) return;

  containers.forEach(function (container) {
    var publicKey = container.getAttribute("data-key");
    if (!publicKey) return;

    // Fetch waitlist config
    fetch(API_BASE + "/waitlist/" + publicKey)
      .then(function (res) { return res.json(); })
      .then(function (config) {
        renderForm(container, publicKey, config);
      })
      .catch(function () {
        container.innerHTML = "<p style=\"color:#888;font-size:14px;\">Failed to load waitlist.</p>";
      });
  });

  // Get referral code from parent URL
  function getRefCode() {
    var params = new URLSearchParams(window.location.search);
    return params.get("ref") || undefined;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function renderForm(container, publicKey, config) {
    var settings = config.settings || {};
    var branding = settings.branding || {};
    var hero = settings.hero || {};
    var form = settings.form || {};
    var thankYou = settings.thank_you || {};
    var primaryColor = branding.primary_color || "#22c563";
    var ctaLabel = hero.cta_label || "Join the waitlist";

    // Container styles
    container.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    container.style.color = "#111";
    container.style.maxWidth = "400px";
    container.style.margin = "0 auto";

    // Render initial form
    container.innerHTML =
      (branding.logo_url
        ? "<img src=\"" + escapeHtml(branding.logo_url) + "\" alt=\"Logo\" style=\"height:32px;margin:0 auto 16px;display:block;\">"
        : "") +
      (hero.title ? "<h2 style=\"font-size:20px;font-weight:600;margin:0 0 4px;text-align:center;\">" + escapeHtml(hero.title) + "</h2>" : "") +
      (hero.subtitle ? "<p style=\"font-size:14px;color:#666;margin:0 0 16px;text-align:center;\">" + escapeHtml(hero.subtitle) + "</p>" : "") +
      "<div id=\"wl-error-" + publicKey + "\" style=\"color:#dc2626;font-size:13px;margin-bottom:8px;display:none;\"></div>" +
      "<form id=\"wl-form-" + publicKey + "\" style=\"display:flex;flex-direction:column;gap:12px;\">" +
      (form.collect_name
        ? "<input type=\"text\" name=\"name\" placeholder=\"Your name\" required style=\"padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;outline:none;\">"
        : "") +
      "<input type=\"email\" name=\"email\" placeholder=\"you@example.com\" required style=\"padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;outline:none;\">" +
      "<input type=\"hidden\" name=\"turnstile_token\" id=\"wl-turnstile-" + publicKey + "\" value=\"\">" +
      "<button type=\"submit\" style=\"padding:10px 16px;background:" + primaryColor + ";color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;transition:opacity 0.2s;\" onmouseover=\"this.style.opacity='0.9'\" onmouseout=\"this.style.opacity='1'\">" +
      escapeHtml(ctaLabel) +
      "</button>" +
      "</form>" +
      "<div id=\"wl-success-" + publicKey + "\" style=\"display:none;\"></div>";

    var formEl = document.getElementById("wl-form-" + publicKey);
    var errorEl = document.getElementById("wl-error-" + publicKey);
    var successEl = document.getElementById("wl-success-" + publicKey);

    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      errorEl.style.display = "none";

      var email = formEl.querySelector("input[name=email]").value;
      var turnstileToken = formEl.querySelector("input[name=turnstile_token]").value;

      // Show loading
      var submitBtn = formEl.querySelector("button[type=submit]");
      var originalText = submitBtn.textContent;
      submitBtn.textContent = "Joining...";
      submitBtn.disabled = true;

      fetch(API_BASE + "/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_key: publicKey,
          email: email,
          ref: getRefCode(),
          turnstile_token: turnstileToken,
        }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.error) {
            errorEl.textContent = data.error;
            errorEl.style.display = "block";
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
          }

          // Success — show position, referral link, leaderboard
          formEl.style.display = "none";
          successEl.style.display = "block";

          var html = "";
          if (thankYou.message) {
            html += "<p style=\"font-size:16px;text-align:center;margin:0 0 8px;\">" + escapeHtml(thankYou.message) + "</p>";
          }

          if (thankYou.show_position !== false && data.position) {
            html += "<p style=\"font-size:14px;text-align:center;color:#666;margin:0 0 16px;\">Your position: #" + data.position + "</p>";
          }

          if (thankYou.show_referral_link !== false) {
            html += "<div style=\"margin-bottom:12px;\">";
            html += "<p style=\"font-size:14px;font-weight:500;margin:0 0 6px;\">Share your referral link:</p>";
            html += "<div style=\"display:flex;gap:6px;\">";
            html += "<input type=\"text\" value=\"" + escapeHtml(data.referral_link) + "\" readonly style=\"flex:1;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;font-family:monospace;\">";
            html += "<button onclick=\"navigator.clipboard.writeText('" + escapeHtml(data.referral_link) + "');this.textContent='Copied!';setTimeout(function(){this.textContent='Copy'}.bind(this),2000);\" style=\"padding:8px 12px;background:" + primaryColor + ";color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;\">Copy</button>";
            html += "</div></div>";
          }

          if (thankYou.show_leaderboard !== false && data.leaderboard && data.leaderboard.length) {
            html += "<div style=\"border:1px solid #e5e7eb;border-radius:8px;padding:12px;\">";
            html += "<h3 style=\"font-size:14px;font-weight:600;margin:0 0 8px;\">Leaderboard</h3>";
            html += "<div style=\"font-size:13px;\">";
            data.leaderboard.forEach(function (entry) {
              var label = entry.email.split("@")[0];
              html += "<div style=\"display:flex;justify-content:space-between;padding:2px 0;\">";
              html += "<span><strong>#" + entry.position + "</strong> " + escapeHtml(label) + "</span>";
              html += "<span style=\"color:#666;\">" + entry.referral_count + " ref" + (entry.referral_count !== 1 ? "s" : "") + "</span>";
              html += "</div>";
            });
            html += "</div></div>";
          }

          successEl.innerHTML = html;
        })
        .catch(function () {
          errorEl.textContent = "Network error. Please try again.";
          errorEl.style.display = "block";
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });
  }
})();
