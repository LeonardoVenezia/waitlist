/**
 * Startpack embed loader for waitlist and testimonial widgets.
 */
(function () {
  "use strict";

  if (typeof window === "undefined") return;

  function mountIframes() {
    var waitlistWidgets = document.querySelectorAll(".startpack-widget[data-key-id]");
    var testimonialWidgets = document.querySelectorAll(".startpack-testimonials[data-key-id]");
    if (waitlistWidgets.length === 0 && testimonialWidgets.length === 0) return;

    var base = document.currentScript
      ? new URL(document.currentScript.src).origin
      : window.location.origin;

    function mount(widgets, route, minHeight, scrolling, title) {
      widgets.forEach(function (el) {
        var key = el.getAttribute("data-key-id");
        if (!key || el.querySelector("iframe")) return;

        var iframe = document.createElement("iframe");
        iframe.src = base + route + encodeURIComponent(key);
        iframe.title = title;
        iframe.style.width = "100%";
        iframe.style.border = "none";
        iframe.style.display = "block";
        iframe.style.minHeight = minHeight;
        iframe.scrolling = scrolling;
        iframe.setAttribute("frameborder", "0");
        el.appendChild(iframe);
      });
    }

    mount(waitlistWidgets, "/w/e/", "200px", "no");
    mount(testimonialWidgets, "/w/t/", "560px", "yes");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountIframes);
  } else {
    mountIframes();
  }
})();
