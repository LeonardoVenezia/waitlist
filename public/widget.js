/**
 * Startpack waitlist widget loader.
 * Mounts the hosted waitlist widget inside an iframe.
 */
(function () {
  "use strict";

  if (typeof window === "undefined") return;

  function mountIframes() {
    var widgets = document.querySelectorAll(".startpack-widget[data-key-id]");
    if (widgets.length === 0) return;

    var base = document.currentScript
      ? new URL(document.currentScript.src).origin
      : window.location.origin;

    widgets.forEach(function (el) {
      var key = el.getAttribute("data-key-id");
      if (!key || el.querySelector("iframe")) return;

      var iframe = document.createElement("iframe");
      iframe.src = base + "/w/e/" + encodeURIComponent(key);
      iframe.style.width = "100%";
      iframe.style.border = "none";
      iframe.style.display = "block";
      iframe.style.minHeight = "200px";
      iframe.scrolling = "no";
      iframe.setAttribute("frameborder", "0");

      iframe.addEventListener("load", function () {
        try {
          var doc = iframe.contentDocument || iframe.contentWindow.document;
          var h = doc.documentElement.scrollHeight;
          if (h > 0) iframe.style.height = h + "px";
        } catch (_) {
          /* cross-origin */
        }
      });

      el.appendChild(iframe);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountIframes);
  } else {
    mountIframes();
  }
})();
