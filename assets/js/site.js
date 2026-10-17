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
  // Open the collapsed sources panel when someone follows a link to it.
  function openSources() {
    if (location.hash !== "#sources") return;
    var d = document.getElementById("sources-body");
    if (d && !d.open) d.open = true;
  }
  window.addEventListener("hashchange", openSources);
  document.addEventListener("DOMContentLoaded", function () {
    openSources();
    document.querySelectorAll('a[href="#sources"]').forEach(function (a) {
      a.addEventListener("click", function () { var d = document.getElementById("sources-body"); if (d) d.open = true; });
    });
    apply(current());
    document.querySelectorAll(".theme-toggle").forEach(function (b) {
      b.addEventListener("click", function () { apply(current() === "dark" ? "light" : "dark"); });
    });
  });
})();
