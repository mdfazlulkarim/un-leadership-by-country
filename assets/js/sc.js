/* Security Council page: seats around the table, membership history, map and country lookup. */
(function () {
  "use strict";
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
  var U = window.UNL, el = U.el, short = U.short, range = U.range;
  var termsBy = {}, sgByCountry = {};

  /* ---------------------------------------------------------------- horseshoe */
  var SIDE_LEFT = ["African States", "Asia-Pacific States"];
  var SIDE_RIGHT = ["Eastern European States", "Latin American and Caribbean States", "Western European and Other States"];
  var GROUP_LABEL = {
    "Permanent": "Permanent · 5",
    "African States": "Africa · 3",
    "Asia-Pacific States": "Asia-Pacific · 2",
    "Eastern European States": "E. Europe · 1",
    "Latin American and Caribbean States": "Latin America · 2",
    "Western European and Other States": "W. Europe & others · 2"
  };
  function membersFor(countries, year) {
    var alpha = function (a, b) { return short(a.member_state).localeCompare(short(b.member_state)); };
    var p5 = countries.filter(function (r) { return r.status === "Permanent member"; }).sort(alpha);
    var elected = countries.filter(function (r) {
      return r.status !== "Permanent member" && (termsBy[r.member_state] || []).some(function (t) { return +t.term_start <= year && +t.term_end >= year; });
    });
    function grp(g) {
      return elected.filter(function (r) { return r.regional_group === g; }).sort(alpha).map(function (r) {
        var t = termsBy[r.member_state].filter(function (t) { return +t.term_start <= year && +t.term_end >= year; })[0];
        return { r: r, group: g, perm: false, term: t };
      });
    }
    var seats = [];
    SIDE_LEFT.forEach(function (g) { seats = seats.concat(grp(g)); });
    seats = seats.concat(p5.map(function (r) { return { r: r, group: "Permanent", perm: true }; }));
    SIDE_RIGHT.forEach(function (g) { seats = seats.concat(grp(g)); });
    return seats;
  }
  function horseshoe(countries, year) {
    var node = document.getElementById("horseshoe");
    node.replaceChildren();
    var seats = membersFor(countries, year);
    var W = 920, H = 600, cx = 460, cy = 312, R = 222, n = seats.length;
    var a0 = 150, a1 = 390;
    var ang = function (i) { return (a0 + (n > 1 ? i * (a1 - a0) / (n - 1) : 0)) * Math.PI / 180; };
    var compact = node.clientWidth < 640;
    var svg = d3.select(node).append("svg").attr("viewBox", compact ? "200 70 520 410" : "0 0 " + W + " " + H).attr("role", "img")
      .attr("aria-label", "Security Council seats in " + year + ": " + seats.map(function (s) { return short(s.r.member_state); }).join(", "));
    var defs = svg.append("defs");
    var arc = d3.path(); arc.arc(cx, cy, R, ang(0) - 0.13, ang(n - 1) + 0.13);
    svg.append("path").attr("class", "table-arc").attr("d", arc.toString()).attr("stroke-width", 78);
    [R - 39, R + 39].forEach(function (rr) { var p = d3.path(); p.arc(cx, cy, rr, ang(0) - 0.13, ang(n - 1) + 0.13); svg.append("path").attr("class", "table-edge").attr("d", p.toString()); });

    // group arcs and labels inside the horseshoe
    var groups = [];
    seats.forEach(function (s, i) { var g = groups[groups.length - 1]; if (!g || g.name !== s.group) groups.push({ name: s.group, from: i, to: i, perm: s.perm }); else g.to = i; });
    groups.forEach(function (g) {
      var p = d3.path(); p.arc(cx, cy, R - 58, ang(g.from) - 0.07, ang(g.to) + 0.07);
      svg.append("path").attr("class", "group-arc").attr("d", p.toString()).style("stroke", g.perm ? "var(--ramp-perm)" : "var(--mark)");
      var mid = (ang(g.from) + ang(g.to)) / 2, rr = R - 76, c = Math.cos(mid);
      svg.append("text").attr("class", "group-label").attr("x", cx + rr * c).attr("y", cy + rr * Math.sin(mid) + (Math.abs(c) < 0.35 ? 10 : 0)).attr("dy", "0.35em")
        .attr("text-anchor", c < -0.35 ? "start" : c > 0.35 ? "end" : "middle").text(GROUP_LABEL[g.name] || g.name);
    });

    // centre text in the opening of the horseshoe
    svg.append("text").attr("class", "center-big").attr("x", cx).attr("y", cy + 118).attr("text-anchor", "middle").text(String(n));
    svg.append("text").attr("class", "center-sub").attr("x", cx).attr("y", cy + 142).attr("text-anchor", "middle").text("seats in " + year);

    var seat = svg.selectAll("g.seat").data(seats).join("g").attr("class", "seat")
      .attr("transform", function (s, i) { return "translate(" + (cx + R * Math.cos(ang(i))) + "," + (cy + R * Math.sin(ang(i))) + ")"; });
    seat.each(function (s, i) {
      var g = d3.select(this), id = "seatclip-" + year + "-" + i;
      defs.append("clipPath").attr("id", id).append("circle").attr("r", 25);
      var fu = U.flagUrl(s.r.member_state);
      g.append("circle").attr("class", "seat-ring " + (s.perm ? "perm" : "elected")).attr("r", 27);
      if (fu) g.append("image").attr("href", fu).attr("x", -34).attr("y", -25.5).attr("width", 68).attr("height", 51).attr("preserveAspectRatio", "xMidYMid slice").attr("clip-path", "url(#" + id + ")");
      var a = ang(i), c = Math.cos(a), sN = Math.sin(a), lr = 48;
      var anchor = c < -0.35 ? "end" : c > 0.35 ? "start" : "middle";
      var lx = lr * c, ly = lr * sN;
      var name = short(s.r.member_state);
      var lines = (anchor === "middle" && name.length > 10 && name.indexOf(" ") > 0) ? [name.slice(0, name.indexOf(" ")), name.slice(name.indexOf(" ") + 1)] : [name];
      var sub = s.perm ? "Permanent" : (+s.term.term_end === year ? "until " + s.term.term_end : range(s.term.term_start, s.term.term_end));
      var baseY = anchor === "middle" ? ly - 8 - (lines.length - 1) * 17 - 14 : ly - 4;
      var t = g.append("text").attr("class", "seat-label").attr("text-anchor", anchor).attr("x", lx).attr("y", baseY);
      lines.forEach(function (ln, k) { t.append("tspan").attr("x", lx).attr("dy", k ? 17 : 0).text(ln); });
      g.append("text").attr("class", "seat-sub").attr("text-anchor", anchor).attr("x", lx).attr("y", baseY + (lines.length - 1) * 17 + 16).text(sub);
      var hit = g.append("circle").attr("class", "seat-hit").attr("r", 32).attr("tabindex", 0)
        .attr("aria-label", s.r.member_state + ", " + (s.perm ? "permanent member" : U.GROUP_SHORT[s.group] + ", term " + range(s.term.term_start, s.term.term_end)));
      U.bindTip(hit, function () {
        return [{ text: short(s.r.member_state), cls: "tt-value", flag: s.r.member_state },
          { text: s.perm ? "Permanent member, with veto" : "Elected member, " + U.GROUP_SHORT[s.group] },
          { text: s.perm ? "" : "Term " + range(s.term.term_start, s.term.term_end), cls: "tt-detail" }];
      });
    });

    // side key (table view)
    var key = document.getElementById("seat-key");
    key.replaceChildren();
    groups.slice().sort(function (a, b) { return (b.perm ? 1 : 0) - (a.perm ? 1 : 0); }).forEach(function (g) {
      var li = el("li");
      li.appendChild(el("span", { "class": "sw" + (g.perm ? " perm" : "") }));
      li.appendChild(el("span", null, g.name === "Permanent" ? "Permanent members" : U.GROUP_SHORT[g.name]));
      li.appendChild(el("span", { "class": "n" }, String(g.to - g.from + 1)));
      var mem = el("span", { "class": "seat-members" });
      mem.textContent = seats.slice(g.from, g.to + 1).map(function (s) { return short(s.r.member_state); }).join(", ");
      li.appendChild(mem);
      key.appendChild(li);
    });
  }

  /* ---------------------------------------------------------------- map */
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
    var svg = d3.select(node).append("svg").attr("width", width).attr("height", Math.ceil(b[1][1]) + 2).attr("aria-hidden", "true");
    function rowFor(f) { var id = U.featureId(f); return id ? byNum[id] : null; }
    svg.append("g").selectAll("path").data(feats).join("path")
      .attr("class", function (f) { return "country" + (rowFor(f) ? "" : " no-member"); })
      .attr("d", path)
      .style("fill", function (f) { var bin = binOf(rowFor(f)); return BINS.filter(function (x) { return x.key === bin; })[0].color; })
      .on("pointerenter pointermove", function (evt, f) {
        var r = rowFor(f);
        if (!r) { U.showTip(evt, [{ text: f.properties.name, cls: "tt-value" }, { text: "Not a UN Member State" }]); return; }
        U.showTip(evt, profileLines(r));
      })
      .on("pointerleave", U.hideTip)
      .on("click", function (evt, f) { var r = rowFor(f); if (r) onSelect(r.member_state, true); })
      .classed("is-selected", function (f) { var r = rowFor(f); return r && r.iso_numeric === mapState.selectedId; });
  }
  function highlightOnMap(numericId) {
    mapState.selectedId = numericId;
    d3.selectAll("#sc-map path.country").classed("is-selected", function (f) { return numericId && U.featureId(f) === numericId; });
  }

  /* ---------------------------------------------------------------- profile */
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
    var h = el("h3"); h.appendChild(U.withFlag(r.member_state, r.member_state, "lg")); p.appendChild(h);
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
    add("Secretary-General", sg ? sg.name + " (" + sg.start_date.slice(0, 4) + "–" + sg.end_date.slice(0, 4) + ")" : "None to date");
    if (r.sg_candidate_2026) add("2026 candidate", r.sg_candidate_2026.split(" | ").join(", "));
    add("Heads of UN agencies", "Coming soon in this series");
    if (r.note) add("Note", r.note);
    p.appendChild(dl);
  }

  /* ---------------------------------------------------------------- table */
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
      var td0 = el("td"); td0.appendChild(U.withFlag(r.member_state)); tr.appendChild(td0);
      tr.appendChild(el("td", null, U.GROUP_SHORT[r.regional_group]));
      tr.appendChild(el("td", null, r.status));
      var perm = r.status === "Permanent member";
      tr.appendChild(el("td", { "class": "num" }, perm ? "n/a" : r.elected_terms));
      tr.appendChild(el("td", { "class": "num" }, perm ? "n/a" : r.years_elected));
      tr.appendChild(el("td", { "class": "num" }, r.latest_term_end || ""));
      tb.appendChild(tr);
    });
  }

  /* ---------------------------------------------------------------- main */
  Promise.all([
    d3.csv(U.DATA + "countries.csv"),
    d3.csv(U.DATA + "security_council_terms.csv"),
    d3.csv(U.DATA + "secretaries_general.csv"),
    d3.json(U.DATA + "meta.json"),
    U.loadAtlas()
  ]).then(function (res) {
    var countries = res[0], terms = res[1], sgs = res[2], meta = res[3], world = res[4];
    U.registerCountries(countries);
    document.querySelectorAll("[data-asof]").forEach(function (n) { n.textContent = U.fmtDate(U.parseDate(meta.as_of)); });
    terms.forEach(function (t) { (termsBy[t.member_state] = termsBy[t.member_state] || []).push(t); });
    Object.keys(termsBy).forEach(function (k) { termsBy[k].sort(function (a, b) { return +a.term_start - +b.term_start; }); });
    sgs.forEach(function (d) { sgByCountry[d.country] = d; });

    var current = countries.filter(function (r) { return r.status !== "Former Member State"; });
    var byName = {}, byNum = {};
    countries.forEach(function (r) { byName[r.member_state] = r; if (r.iso_numeric) byNum[r.iso_numeric] = r; });

    document.getElementById("t-elected").textContent = current.filter(function (r) { return r.status === "Elected member"; }).length;
    document.getElementById("t-never").textContent = current.filter(function (r) { return r.status === "Never elected"; }).length;
    var topR = countries.slice().sort(function (a, b) { return b.elected_terms - a.elected_terms; })[0];
    document.getElementById("t-top").textContent = topR.elected_terms;
    document.getElementById("t-top-label").textContent = "elected terms for " + short(topR.member_state) + ", the most of any country";

    // year switch for the horseshoe
    var year = 2026;
    document.querySelectorAll("#year-switch button").forEach(function (b) {
      b.addEventListener("click", function () {
        year = +b.getAttribute("data-year");
        document.querySelectorAll("#year-switch button").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        horseshoe(countries, year);
      });
    });

    var top = countries.filter(function (r) { return +r.elected_terms >= 6; })
      .sort(function (a, b) { return b.elected_terms - a.elected_terms || b.years_elected - a.years_elected || a.member_state.localeCompare(b.member_state); });
    var never = U.GROUP_ORDER.map(function (g) {
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
    if (/^#country=/.test(location.hash)) {
      var q = decodeURIComponent(location.hash.replace(/^#country=/, ""));
      if (find(q)) { input.value = find(q).member_state; select(find(q).member_state); }
    }

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

    U.bindRegionButtons({ countries: countries, sgs: sgs });
    drawLegend();
    function drawAll() {
      horseshoe(countries, year);
      U.hbar("sc-top", top, {
        label: function (d) { return short(d.member_state); }, value: function (d) { return +d.elected_terms; },
        flag: function (d) { return d.member_state; },
        labelW: function (w) { return Math.min(156, w * 0.42); }, valueW: 70,
        valueText: function (d) { return d.elected_terms + " terms"; },
        tip: function (d) { return profileLines(d); }
      });
      U.hbar("sc-never", never, {
        label: function (d) { return U.GROUP_SHORT[d.group]; }, value: function (d) { return d.n; },
        labelW: function (w) { return Math.min(200, w * 0.5); }, valueW: 70,
        valueText: function (d) { return d.n + " of " + d.total; },
        tip: function (d) { return [{ text: d.n + " of " + d.total + " never elected", cls: "tt-value" }, { text: d.group }, { text: d.names.join(", "), cls: "tt-detail" }]; }
      });
      drawMap(world, byNum, select);
    }
    drawAll();
    U.onResize(drawAll);
  }).catch(U.loadError);
})();
