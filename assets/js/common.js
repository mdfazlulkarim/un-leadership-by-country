/* UN Leadership by Country: shared helpers (data, flags, tooltips, bar charts, dialogs, regional groups). */
window.UNL = (function () {
  "use strict";

  var ROOT = document.documentElement.getAttribute("data-root") || "../";
  var DATA = ROOT + "data/";
  var FLAGS = ROOT + "assets/flags/";
  var ATLAS = ROOT + "assets/vendor/countries-50m.json";

  var GROUP_ORDER = [
    "African States",
    "Asia-Pacific States",
    "Eastern European States",
    "Latin American and Caribbean States",
    "Western European and Other States"
  ];
  var GROUP_SHORT = {
    "African States": "African States",
    "Asia-Pacific States": "Asia-Pacific States",
    "Eastern European States": "Eastern European States",
    "Latin American and Caribbean States": "Latin America and Caribbean",
    "Western European and Other States": "Western Europe and Others"
  };
  var GROUP_SEATS = {
    "African States": 3, "Asia-Pacific States": 2, "Eastern European States": 1,
    "Latin American and Caribbean States": 2, "Western European and Other States": 2
  };
  var SHORT = {
    "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
    "United States of America": "United States",
    "Netherlands (Kingdom of the)": "Netherlands",
    "Bolivia (Plurinational State of)": "Bolivia",
    "Venezuela (Bolivarian Republic of)": "Venezuela",
    "Iran (Islamic Republic of)": "Iran",
    "United Republic of Tanzania": "Tanzania",
    "Democratic Republic of the Congo": "DR Congo",
    "Micronesia (Federated States of)": "Micronesia",
    "Lao People's Democratic Republic": "Lao PDR",
    "Democratic People's Republic of Korea": "DPR Korea",
    "Syrian Arab Republic": "Syria",
    "Saint Vincent and the Grenadines": "St Vincent and the Grenadines"
  };
  // Map features that belong to a Member State but carry another code (or none) in the atlas.
  var MAP_ALIAS_ID = { "344": "156", "446": "156", "304": "208", "234": "208", "248": "246" };
  var MAP_ALIAS_NAME = { "Somaliland": "706", "N. Cyprus": "196" };

  var parseDate = d3.timeParse("%Y-%m-%d");
  var fmtDate = d3.timeFormat("%-d %B %Y");
  var fmtShort = d3.timeFormat("%-d %b");
  function short(n) { return SHORT[n] || n; }
  function range(a, b) { return +a === +b ? String(a) : a + "–" + b; }

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------------------------------------------------------------- flags */
  var iso2By = {};
  function registerCountries(countries) { countries.forEach(function (r) { if (r.iso2) iso2By[r.member_state] = r.iso2; }); }
  function flagUrl(name) { return iso2By[name] ? FLAGS + iso2By[name] + ".svg" : null; }
  function flag(name, cls) {
    var c = "flag" + (cls ? " " + cls : "");
    var u = flagUrl(name);
    if (!u) return el("span", { "class": c, "aria-hidden": "true" });
    return el("img", { "class": c, src: u, alt: "", loading: "lazy", decoding: "async" });
  }
  function withFlag(name, text, cls) {
    var f = document.createDocumentFragment();
    f.appendChild(flag(name, cls)); f.appendChild(document.createTextNode(text == null ? name : text));
    return f;
  }
  function svgFlag(sel, nameFn, x, y) {
    sel.filter(function (d) { return flagUrl(nameFn(d)); }).each(function (d) {
      var g = d3.select(this);
      g.append("image").attr("href", flagUrl(nameFn(d))).attr("x", x).attr("y", y)
        .attr("width", 20).attr("height", 15).attr("preserveAspectRatio", "xMidYMid slice").style("pointer-events", "none");
      g.append("rect").attr("class", "flag-ring").attr("x", x).attr("y", y).attr("width", 20).attr("height", 15).attr("rx", 1.5).style("pointer-events", "none");
    });
  }

  /* ---------------------------------------------------------------- tooltip */
  var tip = null;
  function tipEl() {
    if (!tip) { tip = document.getElementById("tooltip") || document.body.appendChild(el("div", { "class": "tooltip", id: "tooltip", role: "status" })); }
    return tip;
  }
  function showTip(evt, lines, anchorEl) {
    var t = tipEl();
    t.replaceChildren();
    lines.forEach(function (l) {
      if (!l || !l.text) return;
      var d = el("div", { "class": l.cls || "tt-label" });
      if (l.flag) d.appendChild(flag(l.flag));
      d.appendChild(document.createTextNode(l.text));
      t.appendChild(d);
    });
    t.classList.add("show");
    var x, y;
    if (evt && evt.pageX != null && evt.type !== "focus") { x = evt.pageX; y = evt.pageY; }
    else if (anchorEl) { var r = anchorEl.getBoundingClientRect(); x = r.left + window.scrollX + r.width / 2; y = r.top + window.scrollY; }
    var w = t.offsetWidth, h = t.offsetHeight;
    var left = Math.min(Math.max(8, x + 14), window.scrollX + document.documentElement.clientWidth - w - 8);
    var top = y - h - 12;
    if (top < window.scrollY + 8) top = y + 18;
    t.style.left = left + "px"; t.style.top = top + "px";
  }
  function hideTip() { if (tip) tip.classList.remove("show"); }
  function bindTip(sel, linesFn) {
    sel.attr("tabindex", 0)
      .on("pointerenter pointermove", function (evt, d) { showTip(evt, linesFn(d), this); if (this.nextSibling && this.nextSibling.classList) this.nextSibling.classList.add("is-hover"); })
      .on("pointerleave blur", function () { hideTip(); if (this.nextSibling && this.nextSibling.classList) this.nextSibling.classList.remove("is-hover"); })
      .on("focus", function (evt, d) { showTip(evt, linesFn(d), this); if (this.nextSibling && this.nextSibling.classList) this.nextSibling.classList.add("is-hover"); });
  }

  /* ---------------------------------------------------------------- horizontal bar chart */
  function hbar(container, rows, opts) {
    var node = document.getElementById(container);
    node.replaceChildren();
    var width = Math.max(280, node.clientWidth);
    var labelW = opts.labelW ? opts.labelW(width) : Math.min(190, width * 0.42);
    var rowH = 34, barH = 16, valueW = opts.valueW || 64, top = 4;
    var height = rows.length * rowH + top + 4;
    var x = d3.scaleLinear().domain([0, opts.max || d3.max(rows, opts.value) || 1]).range([0, width - labelW - valueW]);
    var svg = d3.select(node).append("svg").attr("width", width).attr("height", height).attr("aria-hidden", "true");
    var g = svg.append("g").attr("transform", "translate(" + labelW + "," + top + ")");
    g.append("line").attr("class", "gridline").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", rows.length * rowH).style("stroke", "var(--baseline)");
    var row = g.selectAll("g.r").data(rows).join("g").attr("class", "r").attr("transform", function (d, i) { return "translate(0," + i * rowH + ")"; });
    row.append("text").attr("class", "row-label").attr("x", opts.flag ? -36 : -10).attr("y", rowH / 2).attr("dy", "0.35em").attr("text-anchor", "end").text(opts.label);
    if (opts.flag) svgFlag(row, opts.flag, -30, rowH / 2 - 7.5);
    var hit = row.append("rect").attr("class", "hit").attr("x", -labelW).attr("y", 0).attr("width", width).attr("height", rowH)
      .attr("aria-label", function (d) { return opts.label(d) + ": " + opts.valueText(d); });
    row.append("path").attr("class", "bar").attr("d", function (d) {
      var w = x(opts.value(d)), y0 = (rowH - barH) / 2, r = Math.min(4, w);
      if (w <= 0) return "";
      return "M0," + y0 + "H" + (w - r) + "Q" + w + "," + y0 + " " + w + "," + (y0 + r) + "V" + (y0 + barH - r) + "Q" + w + "," + (y0 + barH) + " " + (w - r) + "," + (y0 + barH) + "H0Z";
    });
    row.append("text").attr("class", "value-label").attr("x", function (d) { return x(opts.value(d)) + 8; }).attr("y", rowH / 2).attr("dy", "0.35em").text(opts.valueText);
    bindTip(hit, opts.tip);
  }

  /* ---------------------------------------------------------------- dialogs */
  var dlg = null, lastFocus = null;
  function openModal(opts) {
    if (!dlg) {
      dlg = el("dialog", { "class": "modal", "aria-labelledby": "modal-title" });
      document.body.appendChild(dlg);
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener("close", function () { if (lastFocus && lastFocus.focus) lastFocus.focus(); });
    }
    if (!dlg.open) lastFocus = document.activeElement;
    dlg.replaceChildren();
    var head = el("div", { "class": "modal-head" });
    var h = el("h3", { id: "modal-title" });
    if (opts.icon) h.appendChild(el("i", { "class": "ico " + opts.icon, "aria-hidden": "true" }));
    h.appendChild(document.createTextNode(opts.title));
    var close = el("button", { "class": "modal-close", type: "button", "aria-label": "Close" }, "×");
    close.addEventListener("click", function () { dlg.close(); });
    head.appendChild(h); head.appendChild(close);
    var body = el("div", { "class": "modal-body" });
    body.appendChild(opts.body);
    dlg.appendChild(head); dlg.appendChild(body);
    if (opts.foot) { var f = el("div", { "class": "modal-foot" }); f.appendChild(opts.foot); dlg.appendChild(f); }
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); }
    close.focus();
    hideTip();
    return dlg;
  }

  /* ---------------------------------------------------------------- regional groups dialog */
  var atlasPromise = null;
  function loadAtlas() { if (!atlasPromise) atlasPromise = d3.json(ATLAS); return atlasPromise; }
  function featureId(f) { return f.id ? (MAP_ALIAS_ID[f.id] || f.id) : MAP_ALIAS_NAME[f.properties.name]; }

  var GROUP_NOTES = {
    "Western European and Other States": "The United States attends this group as an observer and is counted in it for elections. Türkiye takes part in both this group and the Asia-Pacific group, and is counted here for elections.",
    "Asia-Pacific States": "Türkiye also takes part in this group but is counted in the Western European and Other States group for elections.",
    "African States": "",
    "Eastern European States": "",
    "Latin American and Caribbean States": ""
  };

  function openRegions(ctx, group) {
    group = group || GROUP_ORDER[0];
    var body = el("div");
    body.appendChild(el("p", { "class": "sub", style: "margin-top:0" },
      "Member States are organised into five informal regional groups. They are used to share out elected seats, such as the ten elected seats on the Security Council, and, by custom, the post of Secretary-General. Choose a group to see its members."));
    var tabs = el("div", { "class": "tabs", role: "tablist", "aria-label": "Regional groups" });
    GROUP_ORDER.forEach(function (g) {
      var b = el("button", { type: "button", role: "tab", "aria-selected": g === group ? "true" : "false", "data-group": g }, GROUP_SHORT[g]);
      b.addEventListener("click", function () { render(g); });
      tabs.appendChild(b);
    });
    body.appendChild(tabs);
    var mapBox = el("div", { "class": "region-map", "aria-hidden": "true" }); mapBox.appendChild(el("p", { "class": "loading" }, "Loading map…"));
    body.appendChild(mapBox);
    var stats = el("div", { "class": "region-stats" }); body.appendChild(stats);
    var note = el("p", { "class": "card-note" }); body.appendChild(note);
    var list = el("ul", { "class": "region-list" }); body.appendChild(list);
    openModal({ title: "The five UN regional groups", icon: "huma-map", body: body });

    var world = null;
    loadAtlas().then(function (w) { world = w; render(group); }).catch(function () { mapBox.replaceChildren(el("p", { "class": "error" }, "The map could not be loaded.")); render(group, true); });

    function render(g, noMap) {
      group = g;
      tabs.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-group") === g ? "true" : "false"); });
      var members = ctx.countries.filter(function (r) { return r.regional_group === g && r.status !== "Former Member State"; })
        .sort(function (a, b) { return a.member_state.localeCompare(b.member_state); });
      var memberIds = {}; members.forEach(function (r) { memberIds[r.iso_numeric] = true; });
      var allIds = {}; ctx.countries.forEach(function (r) { if (r.iso_numeric) allIds[r.iso_numeric] = true; });
      if (world && !noMap) {
        mapBox.replaceChildren();
        var width = Math.max(280, mapBox.clientWidth || 700);
        var feats = topojson.feature(world, world.objects.countries).features.filter(function (f) { return f.id !== "010"; });
        var proj = d3.geoEqualEarth().fitWidth(width, { type: "FeatureCollection", features: feats });
        var path = d3.geoPath(proj);
        var b = path.bounds({ type: "FeatureCollection", features: feats });
        var svg = d3.select(mapBox).append("svg").attr("width", width).attr("height", Math.ceil(b[1][1]) + 2);
        svg.append("g").selectAll("path").data(feats).join("path").attr("class", "country").attr("d", path)
          .style("fill", function (f) { var id = featureId(f); return memberIds[id] ? "var(--mark)" : (allIds[id] ? "var(--map-never)" : "var(--map-none)"); })
          .on("pointerenter pointermove", function (evt, f) {
            var id = featureId(f); var r = ctx.countries.filter(function (c) { return c.iso_numeric === id; })[0];
            showTip(evt, r ? [{ text: short(r.member_state), cls: "tt-value", flag: r.member_state }, { text: GROUP_SHORT[r.regional_group] }] : [{ text: f.properties.name, cls: "tt-value" }, { text: "Not a UN Member State" }]);
          })
          .on("pointerleave", hideTip);
      }
      stats.replaceChildren();
      var never = members.filter(function (r) { return r.status === "Never elected"; }).length;
      var sgs = (ctx.sgs || []).filter(function (s) { return s.regional_group === g; }).length;
      [[members.length, "Member States"], [GROUP_SEATS[g], "elected Security Council seats"], [never, "never elected to the Council"], [sgs, sgs === 1 ? "Secretary-General" : "Secretaries-General"]]
        .forEach(function (s) { var sp = el("span"); sp.appendChild(el("strong", null, String(s[0]))); sp.appendChild(document.createTextNode(s[1])); stats.appendChild(sp); });
      note.textContent = GROUP_NOTES[g] || "";
      note.style.display = GROUP_NOTES[g] ? "" : "none";
      list.replaceChildren();
      members.forEach(function (r) { var li = el("li"); li.appendChild(withFlag(r.member_state, short(r.member_state))); list.appendChild(li); });
    }
  }
  function bindRegionButtons(ctx) {
    document.querySelectorAll("[data-open-regions]").forEach(function (b) {
      b.addEventListener("click", function () { openRegions(ctx, b.getAttribute("data-open-regions") || null); });
    });
  }

  function loadError(err) {
    document.querySelectorAll(".loading").forEach(function (n) {
      n.className = "error";
      n.textContent = "The data could not be loaded. If you opened this file directly from your computer, view it through GitHub Pages or a local web server instead.";
    });
    if (window.console) console.error(err);
  }

  function onResize(fn) {
    var lastW = window.innerWidth, t;
    window.addEventListener("resize", function () {
      if (window.innerWidth === lastW) return; lastW = window.innerWidth;
      clearTimeout(t); t = setTimeout(fn, 150);
    });
  }

  return {
    ROOT: ROOT, DATA: DATA, ATLAS: ATLAS, GROUP_ORDER: GROUP_ORDER, GROUP_SHORT: GROUP_SHORT, GROUP_SEATS: GROUP_SEATS,
    MAP_ALIAS_ID: MAP_ALIAS_ID, MAP_ALIAS_NAME: MAP_ALIAS_NAME, featureId: featureId,
    parseDate: parseDate, fmtDate: fmtDate, fmtShort: fmtShort, short: short, range: range, el: el,
    registerCountries: registerCountries, flagUrl: flagUrl, flag: flag, withFlag: withFlag, svgFlag: svgFlag,
    showTip: showTip, hideTip: hideTip, bindTip: bindTip, hbar: hbar, openModal: openModal,
    loadAtlas: loadAtlas, openRegions: openRegions, bindRegionButtons: bindRegionButtons, loadError: loadError, onResize: onResize
  };
})();
