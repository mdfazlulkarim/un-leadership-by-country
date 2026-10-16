/* Shared behaviour: light and dark theme switch (light by default). */
(function () {
  "use strict";
  var KEY = "unlbc-theme";
  var root = document.documentElement;
  function current() { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  function apply(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem(KEY, theme); } catch (e) { /* storage unavailable: theme lasts for this visit */ }
    document.querySelectorAll(".theme-toggle").forEach(function (b) {
      var dark = theme === "dark";
      b.setAttribute("aria-pressed", dark ? "true" : "false");
      b.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      var t = b.querySelector(".tt-text");
      if (t) t.textContent = dark ? "Dark" : "Light";
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    apply(current());
    document.querySelectorAll(".theme-toggle").forEach(function (b) {
      b.addEventListener("click", function () { apply(current() === "dark" ? "light" : "dark"); });
    });
  });
})();
