/* Secretary-General page: 2026 selection, straw polls, timeline and profiles. */
(function () {
  "use strict";
  var U = window.UNL, el = U.el;

  function initials(name) {
    var parts = name.replace(/-/g, " ").split(/\s+/).filter(function (p) { return p && p.toLowerCase() !== "de"; });
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }
  function yearsText(y) { return (Math.round(y * 10) / 10).toString().replace(/\.0$/, ""); }

  /* ---------------------------------------------------------------- SG profile dialog */
  function openSG(sgs, i) {
    var d = sgs[i];
    var wrap = el("div", { "class": "sg-card" });
    var left = el("div");
    var ph = el("div", { "class": "sg-photo" });
    if (d.photo_url) {
      ph.appendChild(el("img", { "class": "portrait", src: d.photo_url, alt: "Portrait of " + d.name }));
    } else {
      ph.appendChild(el("span", { "class": "initials", "aria-hidden": "true" }, initials(d.name)));
      var fu = U.flagUrl(d.country);
      if (fu) ph.appendChild(el("img", { "class": "flag-badge", src: fu, alt: "" }));
    }
    left.appendChild(ph);
    if (d.photo_url && d.photo_credit) {
      var cr = el("p", { "class": "sg-photo-credit" }, "Photo: " + d.photo_credit + (d.photo_licence ? ", " + d.photo_licence : ""));
      if (d.photo_source_url) { cr.appendChild(document.createTextNode(" ")); cr.appendChild(el("a", { href: d.photo_source_url, target: "_blank", rel: "noopener" }, "(source)")); }
      left.appendChild(cr);
    }
    wrap.appendChild(left);

    var right = el("div");
    right.appendChild(el("h3", null, d.name));
    right.appendChild(el("p", { "class": "meta" }, ordinal(+d.order) + " Secretary-General of the United Nations"));
    var dl = el("dl");
    function add(k, v) { dl.appendChild(el("dt", null, k)); var dd = el("dd"); if (typeof v === "string") dd.textContent = v; else dd.appendChild(v); dl.appendChild(dd); }
    add("Country", U.withFlag(d.country));
    add("Group", U.GROUP_SHORT[d.regional_group]);
    add("In office", U.fmtDate(d.start) + " to " + U.fmtDate(d.end) + (d.status === "Serving" ? " (serving)" : ""));
    add("Tenure", yearsText(d.years) + " years");
    if (d.note) add("Note", d.note);
    right.appendChild(dl);
    if (d.un_bio_url) {
      var a = el("a", { "class": "btn", href: d.un_bio_url, target: "_blank", rel: "noopener" });
      a.appendChild(el("i", { "class": "ico huma-link", "aria-hidden": "true" }));
      a.appendChild(document.createTextNode(d.status === "Serving" ? "Official UN page of the Secretary-General" : "Official UN biography"));
      right.appendChild(a);
    }
    wrap.appendChild(right);

    var foot = el("div", { style: "display:flex;justify-content:space-between;width:100%;gap:8px" });
    var prev = el("button", { "class": "btn", type: "button" }, "← " + (i > 0 ? sgs[i - 1].name : ""));
    var next = el("button", { "class": "btn", type: "button" }, (i < sgs.length - 1 ? sgs[i + 1].name : "") + " →");
    prev.disabled = i === 0; next.disabled = i === sgs.length - 1;
    prev.style.visibility = i === 0 ? "hidden" : ""; next.style.visibility = i === sgs.length - 1 ? "hidden" : "";
    prev.addEventListener("click", function () { openSG(sgs, i - 1); });
    next.addEventListener("click", function () { openSG(sgs, i + 1); });
    foot.appendChild(prev); foot.appendChild(next);
    U.openModal({ title: "Secretary-General " + d.order + " of " + sgs.length, icon: "huma-person-2", body: wrap, foot: foot });
  }
  function ordinal(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  /* ---------------------------------------------------------------- timeline */
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
    g.selectAll("line.gridline").data(ticks).join("line").attr("class", "gridline").attr("x1", x).attr("x2", x).attr("y1", 0).attr("y2", sgs.length * rowH);
    g.selectAll("text.tick").data(ticks).join("text").attr("class", "axis").attr("x", x).attr("y", sgs.length * rowH + 18)
      .attr("text-anchor", "middle").style("fill", "var(--axis)").style("font-size", "12px").text(d3.timeFormat("%Y"));
    var row = g.selectAll("g.r").data(sgs).join("g").attr("class", "r").attr("transform", function (d, i) { return "translate(0," + i * rowH + ")"; });
    U.svgFlag(row, function (d) { return d.country; }, -32, rowH / 2 - 7.5);
    row.append("text").attr("class", "row-label").attr("x", -40).attr("y", rowH / 2 - 7).attr("dy", "0.35em").attr("text-anchor", "end")
      .style("font-weight", 600).style("font-size", narrow ? "13px" : "14px").text(function (d) { return d.name; });
    row.append("text").attr("class", "row-sub").attr("x", -40).attr("y", rowH / 2 + 9).attr("dy", "0.35em").attr("text-anchor", "end").text(function (d) { return U.short(d.country); });
    var hit = row.append("rect").attr("class", "hit clickable").attr("x", -labelW).attr("y", 0).attr("width", width).attr("height", rowH)
      .attr("role", "button").attr("aria-label", function (d) { return d.name + ", " + d.country + ", " + U.fmtDate(d.start) + " to " + U.fmtDate(d.end) + ". Open profile"; });
    row.append("rect").attr("class", "bar").attr("x", function (d) { return x(d.start); }).attr("y", (rowH - barH) / 2)
      .attr("width", function (d) { return Math.max(3, x(d.end) - x(d.start)); }).attr("height", barH).attr("rx", 4);
    row.append("text").attr("class", "value-label").attr("x", function (d) { return x(d.end) + 8; }).attr("y", rowH / 2).attr("dy", "0.35em")
      .text(function (d) { return yearsText(d.years) + (narrow ? "" : " yrs"); });
    U.bindTip(hit, function (d) {
      return [{ text: d.name, cls: "tt-value" }, { text: d.country + " · " + d.regional_group, flag: d.country },
        { text: U.fmtDate(d.start) + " to " + U.fmtDate(d.end) + (d.status === "Serving" ? " (serving)" : "") }, { text: "Click for profile and official biography", cls: "tt-detail" }];
    });
    hit.on("click", function (evt, d) { openSG(sgs, sgs.indexOf(d)); })
      .on("keydown", function (evt, d) { if (evt.key === "Enter" || evt.key === " ") { evt.preventDefault(); openSG(sgs, sgs.indexOf(d)); } });
  }

  /* ---------------------------------------------------------------- straw polls: all 15 votes per candidate (option A) */
  var strawState = { poll: null };
  function strawBars(cands, polls) {
    var pollNums = Array.from(new Set(polls.map(function (p) { return +p.poll; }))).sort(d3.ascending);
    if (strawState.poll == null) strawState.poll = pollNums[pollNums.length - 1];
    var pollDate = {}; polls.forEach(function (p) { pollDate[+p.poll] = U.parseDate(p.date); });

    // poll buttons
    var bar = document.getElementById("straw-polls");
    bar.replaceChildren();
    pollNums.forEach(function (n) {
      var b = el("button", { type: "button", "aria-pressed": n === strawState.poll ? "true" : "false" }, U.fmtShort(pollDate[n]));
      b.setAttribute("aria-label", "Straw poll " + n + ", " + U.fmtDate(pollDate[n]));
      b.addEventListener("click", function () { strawState.poll = n; strawBars(cands, polls); });
      bar.appendChild(b);
    });
    document.getElementById("straw-caption").textContent = "Straw poll " + strawState.poll + " of " + pollNums.length + ", held on " + U.fmtDate(pollDate[strawState.poll]) + ".";

    var rows = cands.map(function (c) {
      var r = polls.filter(function (p) { return +p.poll === strawState.poll && p.candidate === c.display_name; })[0];
      if (!r) return null;
      return { c: c, e: +r.encourage, n: r.no_opinion !== "" ? +r.no_opinion : null, d: r.discourage !== "" ? +r.discourage : null, src: r.source };
    }).filter(Boolean).sort(function (a, b) { return b.e - a.e || (a.d == null ? 99 : a.d) - (b.d == null ? 99 : b.d) || a.c.display_name.localeCompare(b.c.display_name); });

    var node = document.getElementById("straw-chart");
    node.replaceChildren();
    var W = Math.max(300, node.clientWidth), narrow = W < 620;
    var L = narrow ? 0 : Math.min(280, W * 0.36), rowH = narrow ? 60 : 42, top = 30, barH = 24;
    var H = rows.length * rowH + top + 8;
    var x = d3.scaleLinear().domain([0, 15]).range([L, W - 2]);
    var svg = d3.select(node).append("svg").attr("width", W).attr("height", H).attr("role", "img")
      .attr("aria-label", "Straw poll of " + U.fmtDate(pollDate[strawState.poll]) + ": " + rows.map(function (r) { return r.c.display_name + " " + r.e + " encourage" + (r.d != null ? ", " + r.d + " discourage" : ""); }).join("; "));
    var defs = svg.append("defs");
    var pt = defs.append("pattern").attr("id", "hatch").attr("width", 6).attr("height", 6).attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)");
    pt.append("rect").attr("width", 6).attr("height", 6).attr("fill", "var(--surface-1)");
    pt.append("rect").attr("width", 3).attr("height", 6).attr("fill", "var(--grid)");

    rows.forEach(function (d, i) {
      var y0 = top + i * rowH;
      var g = svg.append("g").attr("class", "straw-row" + (d.c.status === "Withdrawn" ? " withdrawn" : "")).attr("transform", "translate(0," + y0 + ")");
      var ly = narrow ? 9 : rowH / 2, by = narrow ? 22 : (rowH - barH) / 2;
      // label: flag, gender icon, name
      var fu = U.flagUrl(d.c.nationality);
      if (fu) { g.append("image").attr("href", fu).attr("x", 0).attr("y", ly - 7.5).attr("width", 20).attr("height", 15).attr("preserveAspectRatio", "xMidYMid slice"); g.append("rect").attr("class", "flag-ring").attr("x", 0).attr("y", ly - 7.5).attr("width", 20).attr("height", 15).attr("rx", 1.5); }
      g.append("text").attr("class", "gender-glyph " + (d.c.gender === "Woman" ? "is-woman" : "is-man")).attr("x", 25).attr("y", ly).attr("dy", "0.36em")
        .text(U.GENDER_GLYPH[d.c.gender] || "").append("title").text(d.c.gender);
      g.append("text").attr("class", "straw-name").attr("x", 50).attr("y", ly).attr("dy", "0.35em")
        .text(d.c.display_name + (d.c.status === "Withdrawn" ? " (withdrew later)" : ""));
      // segments: encourage | no opinion | not reported | discourage
      var parts = [["e", d.e, "var(--mark)"]];
      if (d.n != null) parts.push(["n", d.n, "var(--grid)"]);
      var known = d.e + (d.n || 0) + (d.d || 0);
      if (known < 15) parts.push(["u", 15 - known, "url(#hatch)"]);
      if (d.d != null) parts.push(["d", d.d, "var(--series-2)"]);
      var acc = 0;
      parts.forEach(function (p) {
        if (!p[1]) return;
        var a = x(acc), b2 = x(acc + p[1]);
        g.append("rect").attr("class", "seg seg-" + p[0]).attr("x", a + 1).attr("y", by).attr("width", Math.max(0, b2 - a - 2)).attr("height", barH).attr("rx", 3).attr("fill", p[2]);
        var cxl = (a + b2) / 2; if (Math.abs(cxl - x(9)) < 12) cxl = x(9) + 16;
        if (p[0] !== "u" && b2 - a > 20) g.append("text").attr("class", "seg-label seg-label-" + p[0]).attr("x", cxl).attr("y", by + barH / 2).attr("dy", "0.35em").attr("text-anchor", "middle").text(p[1]);
        acc += p[1];
      });
      var hit = g.append("rect").attr("class", "hit").attr("x", 0).attr("y", 0).attr("width", W).attr("height", rowH)
        .attr("aria-label", d.c.display_name + ": " + d.e + " encourage" + (d.d != null ? ", " + d.d + " discourage" : "") + (d.n != null ? ", " + d.n + " no opinion" : ""));
      U.bindTip(hit, function () {
        return [
          { text: d.c.display_name, cls: "tt-value", flag: d.c.nationality },
          { text: d.e + " encourage" + (d.d != null ? " \u00b7 " + d.d + " discourage" : "") + (d.n != null ? " \u00b7 " + d.n + " no opinion" : "") },
          { text: (d.e >= 9 ? "Reached" : "Below") + " the 9 encourage votes needed", cls: "tt-detail" },
          { text: d.c.gender + (d.c.nominated_by ? " \u00b7 nominated by " + d.c.nominated_by : "") + (d.c.status === "Withdrawn" ? " \u00b7 withdrew " + U.fmtDate(U.parseDate(d.c.withdrawal_date)) : ""), cls: "tt-detail" },
          { text: "Source: " + d.src + ". Unofficial.", cls: "tt-detail" }
        ];
      });
    });
    // the 9-vote marker
    svg.append("line").attr("class", "nine-line").attr("x1", x(9)).attr("x2", x(9)).attr("y1", top - 10).attr("y2", H - 4);
    svg.append("text").attr("class", "nine-label").attr("x", x(9)).attr("y", top - 16).attr("text-anchor", "middle").text("9 needed");
  }

  /* ---------------------------------------------------------------- main */
  Promise.all([
    d3.csv(U.data("secretaries_general.csv")),
    d3.csv(U.data("countries.csv")),
    d3.csv(U.data("sg_selection_2026.csv")),
    d3.csv(U.data("sg_straw_polls_2026.csv")),
    d3.csv(U.data("sg_selection_dates.csv")),
    d3.json(U.data("meta.json"))
  ]).then(function (res) {
    var sgs = res[0], countries = res[1], cands = res[2], polls = res[3], dates = res[4], meta = res[5];
    U.registerCountries(countries);
    document.querySelectorAll("[data-asof]").forEach(function (n) { n.textContent = U.fmtDate(U.parseDate(meta.as_of)); });

    sgs.forEach(function (d) { d.start = U.parseDate(d.start_date); d.end = U.parseDate(d.end_date); d.years = (d.end - d.start) / (365.25 * 864e5); });
    sgs.sort(function (a, b) { return +a.order - +b.order; });

    /* -- next step and countdown */
    var next = dates.filter(function (d) { return d.status === "next"; })[0];
    if (next) {
      document.getElementById("next-title").textContent = next.event;
      document.getElementById("next-note").textContent = next.detail || next.note || "";
    }
    var takeOffice = dates.filter(function (d) { return /takes office/i.test(d.event); })[0];
    if (takeOffice) {
      var days = Math.ceil((U.parseDate(takeOffice.date) - new Date()) / 864e5);
      var cd = document.getElementById("countdown");
      if (days > 0) { cd.querySelector(".countdown").textContent = days; cd.querySelector(".cd-label").textContent = (days === 1 ? "day" : "days") + " until the new Secretary-General takes office on " + U.fmtDate(U.parseDate(takeOffice.date)); }
      else cd.style.display = "none";
    }

    /* -- dates strip */
    var ol = document.getElementById("sel-dates");
    dates.forEach(function (d) {
      var li = el("li", { "class": d.status });
      li.appendChild(el("span", { "class": "dot", "aria-hidden": "true" }));
      li.appendChild(el("span", { "class": "d" }, d.date ? U.fmtShort(U.parseDate(d.date)) + (d.date.slice(0, 4) !== "2026" ? " " + d.date.slice(0, 4) : "") : "Date not set"));
      li.appendChild(document.createTextNode(d.event));
      if (d.note) li.appendChild(el("span", { "class": "dnote" }, d.note));
      if (d.status === "next") li.appendChild(el("span", { "class": "tag" }, "Next"));
      if (d.detail) li.setAttribute("title", d.detail);
      ol.appendChild(li);
    });

    /* -- candidates ranked by latest poll (PassBlue order) */
    var pollNums = Array.from(new Set(polls.map(function (p) { return +p.poll; }))).sort(d3.ascending);
    var latest = pollNums[pollNums.length - 1], prevPoll = pollNums[pollNums.length - 2];
    var latestDate = polls.filter(function (p) { return +p.poll === latest; })[0].date;
    function pr(c, n) { return polls.filter(function (p) { return +p.poll === n && p.candidate === c.display_name; })[0]; }
    var active = cands.filter(function (c) { return c.status !== "Withdrawn"; });
    active.forEach(function (c) { c.latest = pr(c, latest); c.prev = pr(c, prevPoll); });
    active.sort(function (a, b) {
      var ea = a.latest ? +a.latest.encourage : -1, eb = b.latest ? +b.latest.encourage : -1;
      var da = a.latest && a.latest.discourage !== "" ? +a.latest.discourage : 99, db = b.latest && b.latest.discourage !== "" ? +b.latest.discourage : 99;
      return eb - ea || da - db || a.display_name.localeCompare(b.display_name);
    });
    var withdrawn = cands.filter(function (c) { return c.status === "Withdrawn"; });

    /* -- tiles */
    document.getElementById("t-sg").textContent = sgs.length;
    var weog = sgs.filter(function (d) { return d.regional_group === "Western European and Other States"; }).length;
    document.getElementById("t-weog").textContent = weog + " of " + sgs.length;
    document.getElementById("t-ee").textContent = sgs.filter(function (d) { return d.regional_group === "Eastern European States"; }).length;

    /* -- SG table */
    var sgtb = document.querySelector("#sg-table tbody");
    sgs.forEach(function (d, i) {
      var tr = el("tr");
      tr.appendChild(el("td", { "class": "num" }, d.order));
      var tdn = el("td"); var b = el("button", { type: "button", "class": "linklike" }, d.name);
      b.addEventListener("click", function () { openSG(sgs, i); }); tdn.appendChild(b); tr.appendChild(tdn);
      var tdc = el("td"); tdc.appendChild(U.withFlag(d.country)); tr.appendChild(tdc);
      tr.appendChild(el("td", null, d.start.getFullYear() + "–" + d.end.getFullYear()));
      var tdl = el("td"); if (d.un_bio_url) tdl.appendChild(el("a", { href: d.un_bio_url, target: "_blank", rel: "noopener", "aria-label": "Official UN page for " + d.name }, "UN page ↗"));
      tr.appendChild(tdl);
      sgtb.appendChild(tr);
    });

    /* -- SG by group */
    var sgGroups = U.GROUP_ORDER.map(function (g) {
      var list = sgs.filter(function (d) { return d.regional_group === g; });
      return { group: g, n: list.length, names: list.map(function (d) { return d.name + " (" + U.short(d.country) + ")"; }) };
    }).sort(function (a, b) { return b.n - a.n || U.GROUP_ORDER.indexOf(a.group) - U.GROUP_ORDER.indexOf(b.group); });

    U.bindRegionButtons({ countries: countries, sgs: sgs });

    function drawAll() {
      sgTimeline(sgs);
      U.hbar("sg-groups", sgGroups, {
        label: function (d) { return U.GROUP_SHORT[d.group]; }, value: function (d) { return d.n; }, max: 4,
        labelW: function (w) { return Math.min(200, w * 0.5); }, valueW: 36,
        valueText: function (d) { return String(d.n); },
        tip: function (d) { return [{ text: d.n + (d.n === 1 ? " Secretary-General" : " Secretaries-General"), cls: "tt-value" }, { text: d.group }, { text: d.names.join(", ") || "None to date", cls: "tt-detail" }]; }
      });
      strawBars(active.concat(withdrawn), polls);
    }
    drawAll();
    U.onResize(drawAll);
  }).catch(U.loadError);
})();
