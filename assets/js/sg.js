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

  /* ---------------------------------------------------------------- straw poll small multiples */
  function strawPolls(cands, polls, order) {
    var grid = document.getElementById("straw-sm");
    grid.replaceChildren();
    var pollNums = Array.from(new Set(polls.map(function (p) { return +p.poll; }))).sort(d3.ascending);
    var pollDate = {}; polls.forEach(function (p) { pollDate[+p.poll] = U.parseDate(p.date); });
    order.forEach(function (c) {
      var rows = pollNums.map(function (n) {
        var r = polls.filter(function (p) { return +p.poll === n && p.candidate === c.display_name; })[0];
        return { poll: n, date: pollDate[n], e: r ? +r.encourage : null, d: r && r.discourage !== "" ? +r.discourage : null, n: r && r.no_opinion !== "" ? +r.no_opinion : null, src: r ? r.source : "" };
      });
      var box = el("div", { "class": "sm" + (c.status === "Withdrawn" ? " withdrawn" : "") });
      var h = el("h4");
      h.appendChild(U.withFlag(c.nationality, c.display_name));
      box.appendChild(h);
      var last = rows.filter(function (r) { return r.e != null; }).slice(-1)[0];
      box.appendChild(el("p", { "class": "sub2" }, c.status === "Withdrawn" ? c.nationality + " · withdrew " + U.fmtDate(U.parseDate(c.withdrawal_date)) :
        c.nationality + " · latest: " + last.e + " encourage" + (last.d != null ? ", " + last.d + " discourage" : "")));
      var svgBox = el("div"); box.appendChild(svgBox); grid.appendChild(box);
      var W = Math.max(180, svgBox.clientWidth || 220), H = 118, m = { l: 18, r: 22, t: 8, b: 18 };
      var x = d3.scalePoint().domain(pollNums).range([m.l, W - m.r]).padding(0.1);
      var y = d3.scaleLinear().domain([0, 15]).range([H - m.b, m.t]);
      var svg = d3.select(svgBox).append("svg").attr("width", W).attr("height", H).attr("role", "img")
        .attr("aria-label", c.display_name + ": encourage votes by poll " + rows.map(function (r) { return r.e == null ? "not a candidate" : r.e; }).join(", "));
      svg.append("line").attr("class", "gridline").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(0)).attr("y2", y(0)).style("stroke", "var(--baseline)");
      svg.append("line").attr("class", "thresh").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(9)).attr("y2", y(9));
      svg.append("text").attr("class", "thresh-label").attr("x", m.l - 4).attr("y", y(9)).attr("dy", "0.35em").attr("text-anchor", "end").text("9");
      svg.append("text").attr("class", "thresh-label").attr("x", m.l - 4).attr("y", y(0)).attr("dy", "0.35em").attr("text-anchor", "end").text("0");
      svg.selectAll("text.xlab").data(rows).join("text").attr("class", "xlab").attr("x", function (r) { return x(r.poll); }).attr("y", H - 4)
        .attr("text-anchor", "middle").text(function (r) { return U.fmtShort(r.date); });
      [["d", "line-d", "dot-d"], ["e", "line-e", "dot-e"]].forEach(function (s) {
        var line = d3.line().defined(function (r) { return r[s[0]] != null; }).x(function (r) { return x(r.poll); }).y(function (r) { return y(r[s[0]]); });
        svg.append("path").attr("class", s[1]).attr("fill", "none").attr("stroke-width", 2).attr("stroke-linejoin", "round").attr("stroke-linecap", "round").attr("d", line(rows));
        svg.selectAll("circle." + s[2]).data(rows.filter(function (r) { return r[s[0]] != null; })).join("circle").attr("class", s[2])
          .attr("cx", function (r) { return x(r.poll); }).attr("cy", function (r) { return y(r[s[0]]); }).attr("r", 4)
          .attr("stroke", "var(--surface-1)").attr("stroke-width", 2);
      });
      // end labels on the latest values, nudged apart if they collide
      var le = rows.filter(function (r) { return r.e != null; }).slice(-1)[0], ld = rows.filter(function (r) { return r.d != null; }).slice(-1)[0];
      var ye = le ? y(le.e) : null, yd = ld ? y(ld.d) : null;
      if (ye != null && yd != null && Math.abs(ye - yd) < 12 && le.poll === ld.poll) { if (ye <= yd) { ye -= 6; yd += 6; } else { ye += 6; yd -= 6; } }
      if (le) svg.append("text").attr("class", "end-label").attr("x", x(le.poll) + 8).attr("y", ye).attr("dy", "0.35em").text(le.e);
      if (ld) svg.append("text").attr("class", "end-label").attr("x", x(ld.poll) + 8).attr("y", yd).attr("dy", "0.35em").style("fill", "var(--text-secondary)").text(ld.d);
      // hover columns
      var colW = pollNums.length > 1 ? x(pollNums[1]) - x(pollNums[0]) : 40;
      var hits = svg.selectAll("rect.col-hit").data(rows).join("rect").attr("class", "col-hit")
        .attr("x", function (r) { return x(r.poll) - colW / 2; }).attr("y", m.t - 4).attr("width", colW).attr("height", H - m.t - m.b + 8).attr("rx", 4)
        .attr("aria-label", function (r) { return "Poll " + r.poll + ", " + U.fmtDate(r.date) + ": " + (r.e == null ? "not a candidate" : r.e + " encourage"); });
      U.bindTip(hits, function (r) {
        if (r.e == null) return [{ text: "Poll " + r.poll + " · " + U.fmtDate(r.date), cls: "tt-label" }, { text: c.status === "Withdrawn" && r.date > U.parseDate(c.withdrawal_date) ? "Withdrawn" : "Not yet a candidate", cls: "tt-value" }];
        return [
          { text: r.e + " encourage" + (r.d != null ? " · " + r.d + " discourage" : "") + (r.n != null ? " · " + r.n + " no opinion" : ""), cls: "tt-value" },
          { text: c.display_name + " · poll " + r.poll + ", " + U.fmtDate(r.date) },
          { text: "Source: " + r.src + ". Unofficial.", cls: "tt-detail" }
        ];
      });
    });
  }

  /* ---------------------------------------------------------------- main */
  Promise.all([
    d3.csv(U.DATA + "secretaries_general.csv"),
    d3.csv(U.DATA + "countries.csv"),
    d3.csv(U.DATA + "sg_selection_2026.csv"),
    d3.csv(U.DATA + "sg_straw_polls_2026.csv"),
    d3.csv(U.DATA + "sg_selection_dates.csv"),
    d3.json(U.DATA + "meta.json")
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
    var tb = document.querySelector("#cand-table tbody");
    active.concat(withdrawn).forEach(function (c, i) {
      var tr = el("tr", c.status === "Withdrawn" ? { "class": "withdrawn" } : null);
      tr.appendChild(el("td", null, "")).appendChild(c.status === "Withdrawn" ? document.createTextNode("") : el("span", { "class": "rank" }, String(i + 1)));
      var tdn = el("td"); var nm = el("span", { "class": "cand-name" }); nm.appendChild(U.withFlag(c.nationality, c.display_name)); tdn.appendChild(nm);
      if (c.status === "Withdrawn") tdn.appendChild(el("div", { "class": "card-note", style: "margin:2px 0 0" }, "Withdrew " + U.fmtDate(U.parseDate(c.withdrawal_date))));
      tr.appendChild(tdn);
      tr.appendChild(el("td", null, c.nationality));
      var tdb = el("td"); if (c.nominated_by) tdb.appendChild(U.withFlag(c.nominated_by)); tr.appendChild(tdb);
      var L = c.latest;
      tr.appendChild(el("td", { "class": "num" }, L ? L.encourage : ""));
      tr.appendChild(el("td", { "class": "num" }, L ? L.discourage : ""));
      tr.appendChild(el("td", { "class": "num" }, L ? L.no_opinion : ""));
      var ch = el("td", { "class": "num" });
      if (L && c.prev) { var dlt = +L.encourage - +c.prev.encourage; ch.textContent = dlt > 0 ? "+" + dlt : dlt < 0 ? "−" + Math.abs(dlt) : "0"; ch.className = "num " + (dlt > 0 ? "delta-up" : dlt < 0 ? "delta-down" : ""); }
      tr.appendChild(ch);
      tb.appendChild(tr);
    });
    document.getElementById("cand-caption").textContent = "Ranked by encourage votes in the latest reported straw poll (" + U.fmtDate(U.parseDate(latestDate)) +
      "), in the order PassBlue reports them. Change compares encourage votes with the previous poll.";
    document.querySelectorAll("[data-latest-poll]").forEach(function (n) { n.textContent = U.fmtDate(U.parseDate(latestDate)); });

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
      strawPolls(cands, polls, active.concat(withdrawn));
    }
    drawAll();
    U.onResize(drawAll);
  }).catch(U.loadError);
})();
