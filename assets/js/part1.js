/* UN Leadership by Country, Part 1: Secretary-General and Security Council.
   Reads the CSV files in /data so the page updates when the data is edited. */
(function () {
  "use strict";

  var DATA = "../data/";
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
  var ALIASES = {
    "uk": "United Kingdom of Great Britain and Northern Ireland", "united kingdom": "United Kingdom of Great Britain and Northern Ireland",
    "britain": "United Kingdom of Great Britain and Northern Ireland", "great britain": "United Kingdom of Great Britain and Northern Ireland",
    "us": "United States of America", "usa": "United States of America", "united states": "United States of America", "america": "United States of America",
    "russia": "Russian Federation", "ussr": "Russian Federation", "soviet union": "Russian Federation",
    "netherlands": "Netherlands (Kingdom of the)", "holland": "Netherlands (Kingdom of the)",
    "turkey": "Türkiye", "turkiye": "Türkiye", "iran": "Iran (Islamic Republic of)", "syria": "Syrian Arab Republic",
    "bolivia": "Bolivia (Plurinational State of)", "venezuela": "Venezuela (Bolivarian Republic of)",
    "tanzania": "United Republic of Tanzania", "vietnam": "Viet Nam", "south korea": "Republic of Korea", "korea": "Republic of Korea",
    "north korea": "Democratic People's Republic of Korea", "dprk": "Democratic People's Republic of Korea",
    "laos": "Lao People's Democratic Republic", "moldova": "Republic of Moldova", "micronesia": "Micronesia (Federated States of)",
    "czech republic": "Czechia", "ivory coast": "Côte d'Ivoire", "cote d'ivoire": "Côte d'Ivoire", "cote divoire": "Côte d'Ivoire",
    "swaziland": "Eswatini", "burma": "Myanmar", "drc": "Democratic Republic of the Congo", "dr congo": "Democratic Republic of the Congo",
    "zaire": "Democratic Republic of the Congo", "congo-kinshasa": "Democratic Republic of the Congo", "congo-brazzaville": "Congo",
    "ceylon": "Sri Lanka", "cape verde": "Cabo Verde", "east timor": "Timor-Leste", "macedonia": "North Macedonia",
    "east germany": "German Democratic Republic", "gdr": "German Democratic Republic", "west germany": "Germany",
    "brunei": "Brunei Darussalam", "uae": "United Arab Emirates", "sao tome": "Sao Tome and Principe",
    "st lucia": "Saint Lucia", "st kitts and nevis": "Saint Kitts and Nevis", "st vincent and the grenadines": "Saint Vincent and the Grenadines",
    "upper volta": "Burkina Faso", "dahomey": "Benin", "byelorussia": "Belarus", "the gambia": "Gambia", "the bahamas": "Bahamas"
  };
  // Map features that belong to a Member State but carry another code (or none) in the atlas.
  var MAP_ALIAS_ID = { "344": "156", "446": "156", "304": "208", "234": "208", "248": "246" };
  var MAP_ALIAS_NAME = { "Somaliland": "706", "N. Cyprus": "196" };

  var tip = document.getElementById("tooltip");
  var short = function (n) { return SHORT[n] || n; };
  var range = function (a, b) { return +a === +b ? String(a) : a + "–" + b; };
  var fmtDate = d3.timeFormat("%-d %B %Y");
  var parseDate = d3.timeParse("%Y-%m-%d");

  var FLAGS = "../assets/flags/";
  var iso2By = {};
  function flag(name, cls) {
    var code = iso2By[name];
    var c = "flag" + (cls ? " " + cls : "");
    if (!code) return el("span", { "class": c, "aria-hidden": "true" });
    return el("img", { "class": c, src: FLAGS + code + ".svg", alt: "", loading: "lazy", decoding: "async" });
  }
  function withFlag(name, text, cls) {
    var f = document.createDocumentFragment();
    f.appendChild(flag(name, cls)); f.appendChild(document.createTextNode(text == null ? name : text));
    return f;
  }
  function svgFlag(sel, nameFn, x, y) {
    sel.filter(function (d) { return iso2By[nameFn(d)]; }).each(function (d) {
      var g = d3.select(this);
      g.append("image").attr("href", FLAGS + iso2By[nameFn(d)] + ".svg").attr("x", x).attr("y", y)
        .attr("width", 20).attr("height", 15).attr("preserveAspectRatio", "xMidYMid slice").style("pointer-events", "none");
      g.append("rect").attr("class", "flag-ring").attr("x", x).attr("y", y).attr("width", 20).attr("height", 15).attr("rx", 1.5).style("pointer-events", "none");
    });
  }

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }

  /* ------------------------------------------------------------------ tooltip */
  function showTip(evt, lines, anchorEl) {
    tip.replaceChildren();
    lines.forEach(function (l) {
      var d = el("div", { "class": l.cls || "tt-label" });
      if (l.flag) d.appendChild(flag(l.flag));
      d.appendChild(document.createTextNode(l.text));
      tip.appendChild(d);
    });
    tip.classList.add("show");
    var x, y;
    if (evt && evt.pageX != null && evt.type !== "focus") { x = evt.pageX; y = evt.pageY; }
    else if (anchorEl) {
      var r = anchorEl.getBoundingClientRect();
      x = r.left + window.scrollX + r.width / 2; y = r.top + window.scrollY;
    }
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(Math.max(8, x + 14), window.scrollX + document.documentElement.clientWidth - w - 8);
    var top = y - h - 12;
    if (top < window.scrollY + 8) top = y + 18;
    tip.style.left = left + "px"; tip.style.top = top + "px";
  }
  function hideTip() { tip.classList.remove("show"); }

  function bindTip(sel, linesFn) {
    sel.attr("tabindex", 0)
      .on("pointerenter pointermove", function (evt, d) { showTip(evt, linesFn(d), this); this.nextSibling && this.nextSibling.classList && this.nextSibling.classList.add("is-hover"); })
      .on("pointerleave blur", function () { hideTip(); this.nextSibling && this.nextSibling.classList && this.nextSibling.classList.remove("is-hover"); })
      .on("focus", function (evt, d) { showTip(evt, linesFn(d), this); this.nextSibling && this.nextSibling.classList && this.nextSibling.classList.add("is-hover"); });
  }

  /* ------------------------------------------------------------------ horizontal bar chart */
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

  /* ------------------------------------------------------------------ SG timeline */
  function sgTimeline(sgs) {
    var node = document.getElementById("sg-timeline");
    node.replaceChildren();
    var width = Math.max(300, node.clientWidth);
    var narrow = width < 560;
    var labelW = narrow ? 156 : 246, valueW = narrow ? 52 : 74, rowH = 42, barH = 14, top = 6, axisH = 26;
    var height = sgs.length * rowH + top + axisH;
    var x = d3.scaleTime().domain([new Date(1945, 6, 1), new Date(2027, 6, 1)]).range([0, width - labelW - valueW]);
    var svg = d3.select(node).append("svg").attr("width", width).attr("height", height).attr("aria-hidden", "true");
    var g = svg.append("g").attr("transform", "translate(" + labelW + "," + top + ")");
    var ticks = d3.range(1950, 2030, narrow ? 20 : 10).map(function (y) { return new Date(y, 0, 1); });
    g.selectAll("line.gridline").data(ticks).join("line").attr("class", "gridline")
      .attr("x1", x).attr("x2", x).attr("y1", 0).attr("y2", sgs.length * rowH);
    g.selectAll("text.tick").data(ticks).join("text").attr("class", "axis").attr("x", x).attr("y", sgs.length * rowH + 18)
      .attr("text-anchor", "middle").style("fill", "var(--axis)").style("font-size", "12px").text(d3.timeFormat("%Y"));
    var row = g.selectAll("g.r").data(sgs).join("g").attr("class", "r").attr("transform", function (d, i) { return "translate(0," + i * rowH + ")"; });
    svgFlag(row, function (d) { return d.country; }, -32, rowH / 2 - 7.5);
    row.append("text").attr("class", "row-label").attr("x", -40).attr("y", rowH / 2 - 7).attr("dy", "0.35em").attr("text-anchor", "end")
      .style("font-weight", 600).style("font-size", narrow ? "13px" : "14px").text(function (d) { return d.name; });
    row.append("text").attr("class", "row-sub").attr("x", -40).attr("y", rowH / 2 + 9).attr("dy", "0.35em").attr("text-anchor", "end").text(function (d) { return short(d.country); });
    var hit = row.append("rect").attr("class", "hit").attr("x", -labelW).attr("y", 0).attr("width", width).attr("height", rowH)
      .attr("aria-label", function (d) { return d.name + ", " + d.country + ", " + fmtDate(d.start) + " to " + fmtDate(d.end); });
    row.append("rect").attr("class", "bar").attr("x", function (d) { return x(d.start); }).attr("y", (rowH - barH) / 2)
      .attr("width", function (d) { return Math.max(3, x(d.end) - x(d.start)); }).attr("height", barH).attr("rx", 4);
    row.append("text").attr("class", "value-label").attr("x", function (d) { return x(d.end) + 8; }).attr("y", rowH / 2).attr("dy", "0.35em")
      .text(function (d) { return d.yearsText + (narrow ? "" : " yrs"); });
    bindTip(hit, function (d) {
      return [
        { text: d.name, cls: "tt-value" },
        { text: d.country + " · " + d.regional_group, flag: d.country },
        { text: fmtDate(d.start) + " to " + fmtDate(d.end) + (d.status === "Serving" ? " (serving)" : "") },
        { text: d.note, cls: "tt-detail" }
      ].filter(function (l) { return l.text; });
    });
  }

  /* ------------------------------------------------------------------ map */
  var mapState = { selectedId: null };
  function binOf(r) {
    if (!r) return "none";
    if (r.status === "Permanent member") return "perm";
    var t = +r.elected_terms;
    if (!t) return "never";
    if (t === 1) return "1"; if (t <= 3) return "2"; if (t <= 5) return "3"; if (t <= 8) return "4"; return "5";
  }
  var BINS = [
    { key: "never", label: "Never elected", color: "var(--map-never)" },
    { key: "1", label: "1 term", color: "var(--ramp-1)" },
    { key: "2", label: "2 to 3", color: "var(--ramp-2)" },
    { key: "3", label: "4 to 5", color: "var(--ramp-3)" },
    { key: "4", label: "6 to 8", color: "var(--ramp-4)" },
    { key: "5", label: "9 to 12", color: "var(--ramp-5)" },
    { key: "perm", label: "Permanent member", color: "var(--ramp-perm)" },
    { key: "none", label: "Not a UN Member State", color: "var(--map-none)" }
  ];
  function drawLegend() {
    var lg = document.getElementById("map-legend");
    lg.replaceChildren();
    BINS.forEach(function (b) {
      var k = el("span", { "class": "key" });
      var s = el("span", { "class": "swatch" }); s.style.background = b.color;
      if (b.key === "none") s.style.boxShadow = "inset 0 0 0 1px var(--baseline)";
      k.appendChild(s); k.appendChild(document.createTextNode(b.label)); lg.appendChild(k);
    });
  }
  function drawMap(world, byNum, onSelect) {
    var node = document.getElementById("sc-map");
    node.replaceChildren();
    var width = Math.max(300, node.clientWidth);
    var feats = topojson.feature(world, world.objects.countries).features.filter(function (f) { return f.id !== "010"; });
    var projection = d3.geoEqualEarth().fitWidth(width, { type: "FeatureCollection", features: feats });
    var path = d3.geoPath(projection);
    var b = path.bounds({ type: "FeatureCollection", features: feats });
    var height = Math.ceil(b[1][1]) + 2;
    var svg = d3.select(node).append("svg").attr("width", width).attr("height", height).attr("aria-hidden", "true");
    function rowFor(f) {
      var id = f.id ? (MAP_ALIAS_ID[f.id] || f.id) : MAP_ALIAS_NAME[f.properties.name];
      return id ? byNum[id] : null;
    }
    svg.append("g").selectAll("path").data(feats).join("path")
      .attr("class", function (f) { return "country" + (rowFor(f) ? "" : " no-member"); })
      .attr("d", path)
      .style("fill", function (f) { var bin = binOf(rowFor(f)); return BINS.filter(function (x) { return x.key === bin; })[0].color; })
      .on("pointerenter pointermove", function (evt, f) {
        var r = rowFor(f);
        if (!r) { showTip(evt, [{ text: f.properties.name, cls: "tt-value" }, { text: "Not a UN Member State" }]); return; }
        showTip(evt, profileLines(r));
      })
      .on("pointerleave", hideTip)
      .on("click", function (evt, f) { var r = rowFor(f); if (r) onSelect(r.member_state, true); })
      .classed("is-selected", function (f) { var r = rowFor(f); return r && r.iso_numeric === mapState.selectedId; });
  }
  function highlightOnMap(numericId) {
    mapState.selectedId = numericId;
    d3.selectAll("#sc-map path.country").classed("is-selected", function (f) {
      var id = f.id ? (MAP_ALIAS_ID[f.id] || f.id) : MAP_ALIAS_NAME[f.properties.name];
      return numericId && id === numericId;
    });
  }

  /* ------------------------------------------------------------------ profile */
  var termsBy = {};
  var sgByCountry = {};
  function councilSummary(r) {
    if (r.status === "Permanent member") return "Permanent member since 1946";
    if (r.status === "Elected, declined seat") return "Elected in 2013 but declined the seat";
    var t = +r.elected_terms;
    if (!t) return "Never elected";
    return "Elected " + (t === 1 ? "once" : t + " times") + ", " + r.years_elected + " year" + (+r.years_elected === 1 ? "" : "s") + " on the Council";
  }
  function profileLines(r) {
    var lines = [{ text: short(r.member_state), cls: "tt-value", flag: r.member_state }, { text: councilSummary(r) }];
    var ts = termsBy[r.member_state] || [];
    if (ts.length) lines.push({ text: "Terms: " + ts.map(function (t) { return range(t.term_start, t.term_end); }).join(", "), cls: "tt-detail" });
    if (r.secretary_general) lines.push({ text: "Secretary-General: " + r.secretary_general, cls: "tt-detail" });
    return lines;
  }
  function renderProfile(r) {
    var p = document.getElementById("profile");
    p.replaceChildren();
    if (!r) { p.classList.remove("show"); return; }
    p.classList.add("show");
    var h = el("h3"); h.appendChild(withFlag(r.member_state, r.member_state, "lg")); p.appendChild(h);
    var meta = el("p", { "class": "meta" });
    meta.appendChild(el("span", { "class": "badge" }, r.status));
    meta.appendChild(document.createTextNode(r.regional_group));
    p.appendChild(meta);
    var dl = el("dl");
    function add(k, v) { dl.appendChild(el("dt", null, k)); var dd = el("dd"); if (typeof v === "string") dd.textContent = v; else dd.appendChild(v); dl.appendChild(dd); }
    add("Security Council", councilSummary(r));
    var ts = termsBy[r.member_state] || [];
    if (ts.length) add("Elected terms", ts.map(function (t) { return range(t.term_start, t.term_end) + (t.note ? " (" + t.note.toLowerCase() + ")" : ""); }).join("; "));
    var onNow = r.on_council_2026 === "yes";
    var curTerm = ts.filter(function (t) { return +t.term_start <= 2026 && +t.term_end >= 2026; })[0];
    add("On the Council in 2026", onNow ? (r.status === "Permanent member" ? "Yes, permanent seat" : "Yes, term ends 31 December " + curTerm.term_end) : (r.joining_2027 === "yes" ? "No, joins on 1 January 2027" : "No"));
    var sg = sgByCountry[r.member_state];
    add("Secretary-General", sg ? sg.name + " (" + sg.start.getFullYear() + "–" + sg.end.getFullYear() + ")" : "None to date");
    if (r.sg_candidate_2026) add("2026 candidate", r.sg_candidate_2026.split(" | ").join(", "));
    add("Heads of UN agencies", "Coming in Part 2 of the series");
    if (r.note) add("Note", r.note);
    p.appendChild(dl);
  }

  /* ------------------------------------------------------------------ table */
  function renderTable(rows, key, dir) {
    var num = { elected_terms: 1, years_elected: 1, latest_term_end: 1 };
    var sorted = rows.slice().sort(function (a, b) {
      var va = a[key], vb = b[key];
      if (num[key]) { va = +va || -1; vb = +vb || -1; }
      var c = va < vb ? -1 : va > vb ? 1 : 0;
      if (c === 0) c = a.member_state.localeCompare(b.member_state);
      return dir * c;
    });
    var tb = document.querySelector("#country-table tbody");
    tb.replaceChildren();
    sorted.forEach(function (r) {
      var tr = el("tr");
      var td0 = el("td"); td0.appendChild(withFlag(r.member_state)); tr.appendChild(td0);
      tr.appendChild(el("td", null, GROUP_SHORT[r.regional_group]));
      tr.appendChild(el("td", null, r.status));
      var perm = r.status === "Permanent member";
      tr.appendChild(el("td", { "class": "num" }, perm ? "n/a" : r.elected_terms));
      tr.appendChild(el("td", { "class": "num" }, perm ? "n/a" : r.years_elected));
      tr.appendChild(el("td", { "class": "num" }, r.latest_term_end || ""));
      tb.appendChild(tr);
    });
  }

  /* ------------------------------------------------------------------ main */
  Promise.all([
    d3.csv(DATA + "secretaries_general.csv"),
    d3.csv(DATA + "countries.csv"),
    d3.csv(DATA + "security_council_terms.csv"),
    d3.csv(DATA + "sg_selection_2026.csv"),
    d3.json(DATA + "meta.json"),
    d3.json("../assets/vendor/countries-50m.json")
  ]).then(function (res) {
    var sgs = res[0], countries = res[1], terms = res[2], cands = res[3], meta = res[4], world = res[5];

    // as-of date and status
    var asof = parseDate(meta.as_of);
    document.querySelectorAll("[data-asof]").forEach(function (n) { n.textContent = fmtDate(asof); });
    document.getElementById("sg-status").textContent = meta.sg_selection_status + " António Guterres completes his second term on 31 December 2026, and his successor takes office on 1 January 2027.";

    // SG prep
    sgs.forEach(function (d) {
      d.start = parseDate(d.start_date); d.end = parseDate(d.end_date);
      var y = (d.end - d.start) / (365.25 * 864e5);
      d.years = y; d.yearsText = (Math.round(y * 10) / 10).toString().replace(/\.0$/, "");
      sgByCountry[d.country] = d;
    });
    sgs.sort(function (a, b) { return +a.order - +b.order; });
    terms.forEach(function (t) { (termsBy[t.member_state] = termsBy[t.member_state] || []).push(t); });
    Object.keys(termsBy).forEach(function (k) { termsBy[k].sort(function (a, b) { return +a.term_start - +b.term_start; }); });

    var current = countries.filter(function (r) { return r.status !== "Former Member State"; });
    var byName = {}, byNum = {};
    countries.forEach(function (r) { byName[r.member_state] = r; if (r.iso_numeric) byNum[r.iso_numeric] = r; if (r.iso2) iso2By[r.member_state] = r.iso2; });

    // tiles
    var nCountriesSG = new Set(sgs.map(function (d) { return d.country; })).size;
    document.getElementById("t-sg").textContent = sgs.length;
    var weog = sgs.filter(function (d) { return d.regional_group === "Western European and Other States"; }).length;
    document.getElementById("t-weog").textContent = weog + " of " + sgs.length;
    document.getElementById("t-elected").textContent = current.filter(function (r) { return r.status === "Elected member"; }).length;
    document.getElementById("t-never").textContent = current.filter(function (r) { return r.status === "Never elected"; }).length;
    if (nCountriesSG !== sgs.length) document.querySelector("#t-sg + .label").textContent = "Secretaries-General since 1946";

    // SG table
    var sgtb = document.querySelector("#sg-table tbody");
    sgs.forEach(function (d) {
      var tr = el("tr");
      tr.appendChild(el("td", { "class": "num" }, d.order));
      tr.appendChild(el("td", null, d.name));
      var tdc = el("td"); tdc.appendChild(withFlag(d.country)); tr.appendChild(tdc);
      tr.appendChild(el("td", null, d.start.getFullYear() + "–" + d.end.getFullYear()));
      sgtb.appendChild(tr);
    });

    // SG by group
    var sgGroups = GROUP_ORDER.map(function (g) {
      var list = sgs.filter(function (d) { return d.regional_group === g; });
      return { group: g, n: list.length, names: list.map(function (d) { return d.name + " (" + short(d.country) + ")"; }) };
    }).sort(function (a, b) { return b.n - a.n || GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group); });

    // candidates
    var ctb = document.querySelector("#cand-table tbody");
    cands.forEach(function (c) {
      var tr = el("tr");
      tr.appendChild(el("td", null, c.candidate));
      var tdn = el("td"); tdn.appendChild(withFlag(c.nationality)); tr.appendChild(tdn);
      tr.appendChild(el("td", null, GROUP_SHORT[c.regional_group]));
      var tdb = el("td"); tdb.appendChild(withFlag(c.nominated_by)); tr.appendChild(tdb);
      tr.appendChild(el("td", null, fmtDate(parseDate(c.nomination_date))));
      ctb.appendChild(tr);
    });
    var natNew = cands.filter(function (c) { return !sgByCountry[c.nationality]; }).length;
    var grulac = cands.filter(function (c) { return c.regional_group === "Latin American and Caribbean States"; }).length;
    document.getElementById("cand-note").textContent = grulac + " of the " + cands.length + " candidates are from Latin America and the Caribbean. " +
      (natNew === cands.length ? "None of the candidates' countries has provided a Secretary-General before." : "");

    // seats
    var seats = document.getElementById("seats");
    [["Permanent members", 5, true]].concat([["African States", 3], ["Asia-Pacific States", 2], ["Eastern European States", 1], ["Latin America and Caribbean", 2], ["Western Europe and Others", 2]])
      .forEach(function (s) {
        var grp = el("div", { "class": "seat-group" });
        var r = el("div", { "class": "seat-row" });
        for (var i = 0; i < s[1]; i++) r.appendChild(el("span", { "class": "seat" + (s[2] ? " perm" : "") }));
        grp.appendChild(r); grp.appendChild(el("div", { "class": "seat-cap" }, s[0] + " (" + s[1] + ")"));
        seats.appendChild(grp);
      });

    // chips
    var p5 = current.filter(function (r) { return r.status === "Permanent member"; });
    var p5c = document.getElementById("p5-chips");
    p5.forEach(function (r) { var li = el("li", { "class": "chip perm" }); li.appendChild(withFlag(r.member_state, short(r.member_state))); p5c.appendChild(li); });
    var now = current.filter(function (r) { return r.on_council_2026 === "yes" && r.status !== "Permanent member"; })
      .map(function (r) { return { r: r, end: (termsBy[r.member_state] || []).filter(function (t) { return +t.term_start <= 2026 && +t.term_end >= 2026; })[0].term_end }; })
      .sort(function (a, b) { return a.end - b.end || a.r.member_state.localeCompare(b.r.member_state); });
    var nc = document.getElementById("now-chips");
    now.forEach(function (o) { var li = el("li", { "class": "chip" }); li.appendChild(withFlag(o.r.member_state, short(o.r.member_state))); li.appendChild(el("small", null, o.end)); nc.appendChild(li); });
    var nx = document.getElementById("next-chips");
    current.filter(function (r) { return r.joining_2027 === "yes"; }).forEach(function (r) {
      var li = el("li", { "class": "chip" }); li.appendChild(withFlag(r.member_state, short(r.member_state))); li.appendChild(el("small", null, "2027–2028")); nx.appendChild(li);
    });

    // top elected
    var top = countries.filter(function (r) { return +r.elected_terms >= 6; })
      .sort(function (a, b) { return b.elected_terms - a.elected_terms || b.years_elected - a.years_elected || a.member_state.localeCompare(b.member_state); });

    // never elected by group
    var never = GROUP_ORDER.map(function (g) {
      var all = current.filter(function (r) { return r.regional_group === g; });
      var nv = all.filter(function (r) { return r.status === "Never elected"; });
      return { group: g, n: nv.length, total: all.length, names: nv.map(function (r) { return short(r.member_state); }) };
    }).sort(function (a, b) { return b.n - a.n; });

    // lookup
    var dlist = document.getElementById("country-list");
    countries.slice().sort(function (a, b) { return a.member_state.localeCompare(b.member_state); })
      .forEach(function (r) { dlist.appendChild(el("option", { value: r.member_state })); });
    function find(q) {
      q = (q || "").trim(); if (!q) return null;
      var lq = q.toLowerCase();
      if (ALIASES[lq]) return byName[ALIASES[lq]];
      var exact = countries.filter(function (r) { return r.member_state.toLowerCase() === lq || short(r.member_state).toLowerCase() === lq; })[0];
      if (exact) return exact;
      var starts = countries.filter(function (r) { return r.member_state.toLowerCase().indexOf(lq) === 0; });
      return starts.length === 1 ? starts[0] : null;
    }
    function select(name, fromMap) {
      var r = byName[name] || find(name);
      renderProfile(r);
      highlightOnMap(r ? r.iso_numeric : null);
      if (r && fromMap) {
        document.getElementById("lookup-input").value = r.member_state;
        document.getElementById("lookup").scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
    var input = document.getElementById("lookup-input");
    input.addEventListener("input", function () { var r = find(input.value); if (r) select(r.member_state); });
    document.getElementById("lookup-form").addEventListener("submit", function (e) { e.preventDefault(); var r = find(input.value); select(r ? r.member_state : null); });
    var hash = decodeURIComponent((location.hash || "").replace(/^#country=/, ""));
    if (/^#country=/.test(location.hash) && find(hash)) { input.value = find(hash).member_state; select(find(hash).member_state); }

    // full table
    var sortKey = "elected_terms", sortDir = -1;
    renderTable(countries, sortKey, sortDir);
    document.querySelectorAll("#country-table th button").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-sort");
        sortDir = k === sortKey ? -sortDir : (k === "member_state" || k === "regional_group" || k === "status" ? 1 : -1);
        sortKey = k; renderTable(countries, sortKey, sortDir);
      });
    });

    // draw charts (and redraw on resize)
    function drawAll() {
      sgTimeline(sgs);
      hbar("sg-groups", sgGroups, {
        label: function (d) { return GROUP_SHORT[d.group]; }, value: function (d) { return d.n; }, max: 4,
        labelW: function (w) { return Math.min(200, w * 0.5); }, valueW: 36,
        valueText: function (d) { return String(d.n); },
        tip: function (d) { return [{ text: d.n + (d.n === 1 ? " Secretary-General" : " Secretaries-General"), cls: "tt-value" }, { text: d.group }, { text: d.names.join(", ") || "None to date", cls: "tt-detail" }]; }
      });
      hbar("sc-top", top, {
        label: function (d) { return short(d.member_state); }, value: function (d) { return +d.elected_terms; },
        flag: function (d) { return d.member_state; },
        labelW: function (w) { return Math.min(156, w * 0.42); }, valueW: 70,
        valueText: function (d) { return d.elected_terms + " terms"; },
        tip: function (d) { return profileLines(d); }
      });
      hbar("sc-never", never, {
        label: function (d) { return GROUP_SHORT[d.group]; }, value: function (d) { return d.n; },
        labelW: function (w) { return Math.min(200, w * 0.5); }, valueW: 70,
        valueText: function (d) { return d.n + " of " + d.total; },
        tip: function (d) { return [{ text: d.n + " of " + d.total + " never elected", cls: "tt-value" }, { text: d.group }, { text: d.names.join(", "), cls: "tt-detail" }]; }
      });
      drawMap(world, byNum, select);
    }
    drawLegend();
    drawAll();
    var lastW = window.innerWidth, t;
    window.addEventListener("resize", function () {
      if (window.innerWidth === lastW) return; lastW = window.innerWidth;
      clearTimeout(t); t = setTimeout(drawAll, 150);
    });
  }).catch(function (err) {
    document.querySelectorAll(".loading").forEach(function (n) {
      n.className = "error";
      n.textContent = "The data could not be loaded. If you opened this file directly from your computer, view it through GitHub Pages or a local web server instead.";
    });
    if (window.console) console.error(err);
  });
})();
