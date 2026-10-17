/* UN Leadership by Country: heads of UN agencies and Secretariat offices (shared by both pages). */
(function () {
  "use strict";
  var U = window.UNL, el = U.el, short = U.short;
  var PAGE = document.body.getAttribute("data-heads"); // "agencies" or "secretariat"

  var GROUPS = {
    agencies: [
      ["Funds and Programmes", "huma-partnership"],
      ["Specialized Agencies", "huma-un-compound-office"],
      ["Other Entities", "huma-building"],
      ["Related Organizations", "huma-diplomatic-mission"],
      ["Research and Training", "huma-university"],
      ["Regional Commissions", "huma-map"],
      ["Other Bodies", "huma-health"]
    ],
    secretariat: [
      ["Executive Office and management", "huma-government-office"],
      ["Peace and security", "huma-leadership"],
      ["Development and economic affairs", "huma-chart"],
      ["Humanitarian affairs and human rights", "huma-people-in-need"],
      ["Offices away from Headquarters", "huma-building"]
    ]
  }[PAGE];

  var filter = { show: "all", region: "all" };

  function headName(r) { return r.head || "Name not confirmed"; }
  function isActing(r) { return r.acting === "yes"; }
  function matches(r) {
    if (filter.show === "Woman" || filter.show === "Man") { if (r.gender !== filter.show) return false; }
    if (filter.show === "acting" && !isActing(r)) return false;
    if (filter.region !== "all" && r.regional_group !== filter.region) return false;
    return true;
  }

  /* ---------------------------------------------------------------- entity dialog */
  function openEntity(r) {
    var body = el("div", { "class": "ent-dialog" });
    body.appendChild(el("p", { "class": "sub", style: "margin-top:0" }, r.name + " · " + r.group));
    var who = el("div", { "class": "ent-who" });
    var h = el("p", { "class": "ent-who-name" });
    if (r.nationality) h.appendChild(U.flag(r.nationality, "lg"));
    h.appendChild(document.createTextNode(headName(r)));
    if (r.gender) h.appendChild(U.genderIcon(r.gender));
    who.appendChild(h);
    who.appendChild(el("p", { "class": "ent-who-title" }, r.head_title));
    body.appendChild(who);
    var dl = el("dl", { "class": "ent-dl" });
    function add(k, v) { if (!v) return; dl.appendChild(el("dt", null, k)); dl.appendChild(el("dd", null, v)); }
    add("Nationality", r.nationality ? short(r.nationality) : "Not confirmed");
    add("Regional group", r.regional_group ? U.GROUP_SHORT[r.regional_group] : "");
    add("In post since", r.since || "Not confirmed");
    add("Status", isActing(r) ? "Acting head" : "");
    add("Note", r.note);
    body.appendChild(dl);
    body.appendChild(el("p", { "class": "card-note" }, "Past heads of each entity will be added in a later update."));
    var foot = el("div", { "class": "btn-row", style: "margin:0" });
    var a1 = el("a", { "class": "btn", href: r.official_url, target: "_blank", rel: "noopener" });
    a1.appendChild(el("i", { "class": "ico huma-link", "aria-hidden": "true" })); a1.appendChild(document.createTextNode("Official website"));
    foot.appendChild(a1);
    if (r.source_url) {
      var a2 = el("a", { "class": "btn", href: r.source_url, target: "_blank", rel: "noopener" });
      a2.appendChild(el("i", { "class": "ico huma-document", "aria-hidden": "true" })); a2.appendChild(document.createTextNode("Source"));
      foot.appendChild(a2);
    }
    U.openModal({ title: r.acronym, icon: "huma-leadership", body: body, foot: foot });
  }

  /* ---------------------------------------------------------------- tiles by group */
  function renderGroups(rows) {
    var box = document.getElementById("groups");
    box.replaceChildren();
    GROUPS.forEach(function (g) {
      var list = rows.filter(function (r) { return r.group === g[0]; });
      if (!list.length) return;
      var sec = el("section", { "class": "ent-group", "aria-label": g[0] });
      var hd = el("h3");
      hd.appendChild(el("i", { "class": "ico " + g[1], "aria-hidden": "true" }));
      hd.appendChild(document.createTextNode(g[0]));
      hd.appendChild(el("span", { "class": "ent-count" }, String(list.length)));
      sec.appendChild(hd);
      var grid = el("div", { "class": "ent-grid" });
      list.forEach(function (r) {
        var b = el("button", { type: "button", "class": "ent" + (PAGE === "secretariat" ? " is-sec" : ""), "data-acr": r.acronym });
        var top = el("span", { "class": "ent-top" });
        top.appendChild(el("span", { "class": "ent-acr" }, r.acronym));
        if (isActing(r)) top.appendChild(el("span", { "class": "badge" }, "Acting"));
        b.appendChild(top);
        b.appendChild(el("span", { "class": "ent-name" }, r.name));
        var hl = el("span", { "class": "ent-head" + (r.head ? "" : " is-unknown") });
        if (r.nationality) hl.appendChild(U.flag(r.nationality));
        if (r.gender) hl.appendChild(U.genderIcon(r.gender));
        hl.appendChild(document.createTextNode(headName(r)));
        b.appendChild(hl);
        b.setAttribute("aria-label", r.acronym + ", " + r.name + ". Head: " + headName(r) + (r.nationality ? ", " + short(r.nationality) : "") + (isActing(r) ? ", acting" : ""));
        b.addEventListener("click", function () { openEntity(r); });
        r._tile = b;
        grid.appendChild(b);
      });
      sec.appendChild(grid);
      box.appendChild(sec);
    });
    applyFilter(rows);
  }
  function applyFilter(rows) {
    var n = 0;
    rows.forEach(function (r) { var m = matches(r); if (m) n++; if (r._tile) r._tile.classList.toggle("is-dim", !m); });
    var all = filter.show === "all" && filter.region === "all";
    document.getElementById("filter-count").textContent = all ? "Showing all " + rows.length + "." : n + " of " + rows.length + " match.";
  }
  function bindFilters(rows) {
    document.querySelectorAll("[data-filter]").forEach(function (grp) {
      var key = grp.getAttribute("data-filter");
      grp.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          filter[key] = b.getAttribute("data-value");
          grp.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          applyFilter(rows);
        });
      });
    });
  }

  /* ---------------------------------------------------------------- tiles (headline numbers) */
  function renderTiles(rows) {
    var nats = {}; rows.forEach(function (r) { if (r.nationality) (nats[r.nationality] = nats[r.nationality] || []).push(r); });
    var top = Object.keys(nats).sort(function (a, b) { return nats[b].length - nats[a].length || a.localeCompare(b); })[0];
    var women = rows.filter(function (r) { return r.gender === "Woman"; }).length;
    var known = rows.filter(function (r) { return r.gender; }).length;
    document.getElementById("t-count").textContent = rows.length;
    document.getElementById("t-nats").textContent = Object.keys(nats).length;
    document.getElementById("t-women").textContent = women + " of " + rows.length;
    var unk = rows.length - known;
    document.getElementById("t-women-label").textContent = "are headed by women" + (unk ? " (" + (unk === 1 ? "one head" : unk + " heads") + " not confirmed)" : "");
    document.getElementById("t-top").textContent = nats[top].length;
    var tied = Object.keys(nats).filter(function (k) { return nats[k].length === nats[top].length; }).sort();
    function nm(c) { return c === "United States of America" ? "the United States" : c === "United Kingdom of Great Britain and Northern Ireland" ? "the United Kingdom" : short(c); }
    var names = tied.map(nm);
    var list = names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0];
    document.getElementById("t-top-label").textContent = (tied.length > 1 ? "heads each for " + list + ", the most of any country" : "heads are nationals of " + list + ", the most of any country");
  }

  /* ---------------------------------------------------------------- map */
  var BINS = [
    { key: "1", label: "1 head", color: "var(--ramp-2)" },
    { key: "2", label: "2 heads", color: "var(--ramp-4)" },
    { key: "3", label: "3 or more", color: "var(--ramp-perm)" },
    { key: "0", label: "None", color: "var(--map-never)" }
  ];
  function binOf(n) { return !n ? "0" : n >= 3 ? "3" : String(n); }
  function drawLegend() {
    var lg = document.getElementById("map-legend"); lg.replaceChildren();
    BINS.forEach(function (b) {
      var k = el("span", { "class": "key" }); var s = el("span", { "class": "swatch" }); s.style.background = b.color;
      k.appendChild(s); k.appendChild(document.createTextNode(b.label)); lg.appendChild(k);
    });
  }
  function drawMap(world, countries, byNat) {
    var node = document.getElementById("heads-map"); node.replaceChildren();
    var width = Math.max(300, node.clientWidth);
    var feats = topojson.feature(world, world.objects.countries).features.filter(function (f) { return f.id !== "010"; });
    var proj = d3.geoEqualEarth().fitWidth(width, { type: "FeatureCollection", features: feats });
    var path = d3.geoPath(proj);
    var b = path.bounds({ type: "FeatureCollection", features: feats });
    var byNum = {}; countries.forEach(function (c) { if (c.iso_numeric && c.status !== "Former Member State") byNum[c.iso_numeric] = c; });
    var svg = d3.select(node).append("svg").attr("width", width).attr("height", Math.ceil(b[1][1]) + 2).attr("aria-hidden", "true");
    svg.append("g").selectAll("path").data(feats).join("path")
      .attr("class", function (f) { return "country" + (byNum[U.featureId(f)] ? "" : " no-member"); })
      .attr("d", path)
      .style("fill", function (f) {
        var c = byNum[U.featureId(f)];
        if (!c) return "var(--map-none)";
        var bin = binOf((byNat[c.member_state] || []).length);
        return BINS.filter(function (x) { return x.key === bin; })[0].color;
      })
      .on("pointerenter pointermove", function (evt, f) {
        var c = byNum[U.featureId(f)];
        if (!c) { U.showTip(evt, [{ text: f.properties.name, cls: "tt-value" }, { text: "Not a UN Member State" }]); return; }
        var list = byNat[c.member_state] || [];
        var lines = [{ text: short(c.member_state), cls: "tt-value", flag: c.member_state },
          { text: list.length ? list.length + (list.length === 1 ? " head" : " heads") : "No current head" }];
        list.forEach(function (r) { lines.push({ text: r.acronym + ": " + r.head, cls: "tt-detail" }); });
        U.showTip(evt, lines);
      })
      .on("pointerleave", U.hideTip);
  }

  /* ---------------------------------------------------------------- regional groups and countries */
  function drawRegions(rows, countries) {
    var members = {}; countries.forEach(function (c) { if (c.status !== "Former Member State") members[c.regional_group] = (members[c.regional_group] || 0) + 1; });
    var total = d3.sum(U.GROUP_ORDER, function (g) { return members[g] || 0; });
    var known = rows.filter(function (r) { return r.regional_group; }).length;
    var data = U.GROUP_ORDER.map(function (g) {
      return { g: g, n: rows.filter(function (r) { return r.regional_group === g; }).length, share: (members[g] || 0) / total };
    }).sort(function (a, b) { return b.n - a.n; });
    // paired bars: share of heads (blue) against share of UN membership (grey)
    var node = document.getElementById("heads-regions"); node.replaceChildren();
    var W = Math.max(280, node.clientWidth), labelW = Math.min(196, W * 0.44), valW = 100, rowH = 46, bh = 13;
    var x = d3.scaleLinear().domain([0, d3.max(data, function (d) { return Math.max(d.n / known, d.share); })]).range([0, W - labelW - valW]);
    var svg = d3.select(node).append("svg").attr("width", W).attr("height", data.length * rowH + 4).attr("aria-hidden", "true");
    var row = svg.selectAll("g").data(data).join("g").attr("transform", function (d, i) { return "translate(" + labelW + "," + (i * rowH + 4) + ")"; });
    row.append("text").attr("class", "row-label").attr("x", -10).attr("y", bh + 1).attr("dy", "0.35em").attr("text-anchor", "end").text(function (d) { return U.GROUP_SHORT[d.g]; });
    row.append("rect").attr("class", "bar").attr("x", 0).attr("y", 2).attr("height", bh).attr("rx", 3).attr("width", function (d) { return Math.max(1, x(d.n / known)); });
    row.append("rect").attr("class", "bar-ref").attr("x", 0).attr("y", 2 + bh + 3).attr("height", bh - 4).attr("rx", 2).attr("width", function (d) { return Math.max(1, x(d.share)); });
    row.append("text").attr("class", "value-label").attr("x", function (d) { return x(d.n / known) + 6; }).attr("y", 2 + bh / 2).attr("dy", "0.35em")
      .text(function (d) { return Math.round(100 * d.n / known) + "% (" + d.n + ")"; });
    row.append("text").attr("class", "row-sub").attr("x", function (d) { return x(d.share) + 6; }).attr("y", 2 + bh + 3 + (bh - 4) / 2).attr("dy", "0.35em")
      .text(function (d) { return Math.round(100 * d.share) + "% of members"; });
    var hit = row.append("rect").attr("class", "hit").attr("x", -labelW).attr("y", -2).attr("width", W).attr("height", rowH - 4)
      .attr("aria-label", function (d) { return U.GROUP_SHORT[d.g] + ": " + d.n + " heads"; });
    U.bindTip(hit, function (d) {
      return [{ text: U.GROUP_SHORT[d.g], cls: "tt-value" },
        { text: d.n + " of " + known + " heads (" + Math.round(100 * d.n / known) + "%)" },
        { text: "Share of UN Member States: " + Math.round(100 * d.share) + "%", cls: "tt-detail" }];
    });
  }
  function drawTopCountries(byNat) {
    var data = Object.keys(byNat).map(function (k) { return { c: k, list: byNat[k] }; })
      .filter(function (d) { return d.list.length >= 2; })
      .sort(function (a, b) { return b.list.length - a.list.length || a.c.localeCompare(b.c); });
    U.hbar("heads-top", data, {
      label: function (d) { return short(d.c); }, flag: function (d) { return d.c; },
      value: function (d) { return d.list.length; },
      valueText: function (d) { return String(d.list.length); }, valueW: 36,
      tip: function (d) { return [{ text: short(d.c), cls: "tt-value", flag: d.c }].concat(d.list.map(function (r) { return { text: r.acronym + ": " + r.head, cls: "tt-detail" }; })); }
    });
  }

  /* ---------------------------------------------------------------- computed facts */
  function renderFacts(rows) {
    var box = document.getElementById("computed-facts"); if (!box) return;
    var P5 = ["China", "France", "Russian Federation", "United Kingdom of Great Britain and Northern Ireland", "United States of America"];
    var parts = P5.map(function (c) { return { c: c, n: rows.filter(function (r) { return r.nationality === c; }).length }; });
    var none = parts.filter(function (p) { return !p.n; }).map(function (p) { return p.c; });
    var sum = d3.sum(parts, function (p) { return p.n; });
    var NAME = { "China": "China", "France": "France", "Russian Federation": "Russia", "United Kingdom of Great Britain and Northern Ireland": "the United Kingdom", "United States of America": "the United States" };
    var withN = parts.filter(function (p) { return p.n; }).sort(function (a, b) { return b.n - a.n; });
    var txt = "Nationals of the five permanent members of the Security Council head " + sum + " of the " + rows.length + ": " +
      withN.map(function (p) { return NAME[p.c] + " " + p.n; }).join(", ") + "." +
      (none.length ? " " + none.map(function (c) { return c === "Russian Federation" ? "Russia" : c; }).join(" and ") + (none.length === 1 ? " heads" : " head") + " none." : "");
    var f = el("div", { "class": "fact" });
    f.appendChild(el("i", { "class": "ico huma-diplomatic-mission", "aria-hidden": "true" }));
    var d = el("div"); d.appendChild(el("h4", null, "The permanent five")); d.appendChild(el("p", null, txt)); f.appendChild(d);
    box.insertBefore(f, box.firstChild);
  }

  /* ---------------------------------------------------------------- table */
  function renderTable(rows, key, dir) {
    var sorted = rows.slice().sort(function (a, b) {
      var va = a[key] || "￿", vb = b[key] || "￿";
      var c = va < vb ? -1 : va > vb ? 1 : 0;
      if (!c) c = a.acronym.localeCompare(b.acronym);
      return dir * c;
    });
    var tb = document.querySelector("#heads-table tbody"); tb.replaceChildren();
    sorted.forEach(function (r) {
      var tr = el("tr");
      var td0 = el("td"); var lb = el("button", { type: "button", "class": "linklike" }, r.acronym); lb.addEventListener("click", function () { openEntity(r); });
      td0.appendChild(lb); td0.appendChild(el("div", { "class": "row-sub-text" }, r.name)); tr.appendChild(td0);
      tr.appendChild(el("td", null, r.group));
      var td2 = el("td"); if (r.gender) td2.appendChild(U.genderIcon(r.gender)); td2.appendChild(document.createTextNode(headName(r))); tr.appendChild(td2);
      tr.appendChild(el("td", null, r.head_title));
      var td4 = el("td"); if (r.nationality) td4.appendChild(U.withFlag(r.nationality, short(r.nationality))); tr.appendChild(td4);
      tr.appendChild(el("td", { "class": "num" }, r.since));
      tb.appendChild(tr);
    });
  }
  function bindTable(rows) {
    var state = { key: "acronym", dir: 1 };
    document.querySelectorAll("#heads-table th button").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-sort");
        state.dir = state.key === k ? -state.dir : 1; state.key = k;
        renderTable(rows, state.key, state.dir);
      });
    });
    renderTable(rows, state.key, state.dir);
  }

  /* ---------------------------------------------------------------- main */
  Promise.all([
    d3.csv(U.data("un_entity_heads.csv")),
    d3.csv(U.data("countries.csv")),
    d3.json(U.data("meta.json")),
    U.loadAtlas()
  ]).then(function (res) {
    var all = res[0], countries = res[1], meta = res[2], world = res[3];
    U.registerCountries(countries);
    document.querySelectorAll("[data-asof]").forEach(function (n) { n.textContent = U.fmtDate(U.parseDate(meta.as_of)); });
    var rows = all.filter(function (r) { return r.page === PAGE; });
    var byNat = {}; rows.forEach(function (r) { if (r.nationality) (byNat[r.nationality] = byNat[r.nationality] || []).push(r); });

    renderTiles(rows);
    renderGroups(rows);
    bindFilters(rows);
    renderFacts(rows);
    bindTable(rows);
    drawLegend();
    function drawAll() { drawMap(world, countries, byNat); drawRegions(rows, countries); drawTopCountries(byNat); }
    drawAll();
    U.onResize(drawAll);

    // open an entity from the address, for example #UNICEF
    function fromHash() {
      var h = decodeURIComponent((location.hash || "").slice(1));
      var hit = rows.filter(function (r) { return r.acronym === h; })[0];
      if (hit) openEntity(hit);
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
  }).catch(U.loadError);
})();
