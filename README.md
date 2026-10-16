# UN Leadership by Country

A fact series on which countries have held the top leadership positions in the United Nations system. Each part is a single web page built from public UN records, with the underlying data published as plain CSV files.

**Live site:** https://mdfazlulkarim.github.io/un-leadership-by-country/

| Part | Topic | Status |
|---|---|---|
| 1 | [The Secretary-General and the Security Council](https://mdfazlulkarim.github.io/un-leadership-by-country/part-1-sg-security-council/) | Published, data as of 16 October 2026 |
| 2 | Heads of the leading UN agencies, funds and programmes | In preparation |

This is an independent personal project. It is not an official United Nations publication and does not represent the views of the United Nations or any of its entities.

## What Part 1 covers

- All nine Secretaries-General, with country, regional group and years in office
- The 2026 Secretary-General selection: candidates, nationality and nominating State
- Every elected term on the Security Council since 1946, including the members elected for 2027-2028
- The 58 Member States never elected to the Council, by regional group
- A world map of elected terms and a country lookup

## Repository structure

```
index.html                         series landing page
part-1-sg-security-council/        Part 1 page
assets/css/style.css               shared styles (light and dark mode)
assets/js/part1.js                 charts, map and lookup for Part 1
assets/js/site.js                  light and dark theme switch (light by default)
assets/flags/                      country flags (SVG)
assets/vendor/                     D3, topojson-client, the world map and the OCHA icon font (see THIRD_PARTY.txt)
data/                              the data behind every figure
```

## Data files

| File | One row per | Key columns |
|---|---|---|
| `data/countries.csv` | UN Member State (193) and former Member State (4) | ISO codes, regional group, Council status, elected terms, years, Secretary-General, 2026 candidate |
| `data/security_council_terms.csv` | elected term (1946 to 2028) | member state, regional group, start and end year, notes on one-year and split terms |
| `data/secretaries_general.csv` | Secretary-General | country, regional group, start and end dates, notes |
| `data/sg_selection_2026.csv` | 2026 candidate | nationality, nominating State, nomination date |
| `data/meta.json` | | as-of date and the status line for the 2026 selection |

The page reads these files directly, so editing a CSV on GitHub updates the site. If you add or change a term in `security_council_terms.csv`, update the matching totals in `countries.csv` too.

### Counting rules

- A term is each elected period the UN lists, including the one-year terms of 1946 and 1966 and the six split terms, when two countries shared a two-year term.
- Former Member States (Czechoslovakia, the German Democratic Republic, the United Arab Republic and Yugoslavia) are listed separately, as the UN does. Terms served under earlier names (Zaire, Ceylon, Upper Volta, the Byelorussian and Ukrainian SSRs) are counted under today's names.
- The German Democratic Republic's 1980-1981 term does not appear on the UN's elected members page and has been added.
- Saudi Arabia was elected in 2013 but declined the seat, so it is not counted as never elected and has no terms.
- Regional groups were formalised in 1963. Earlier terms and Secretaries-General are counted under the country's current group.

## Sources

- United Nations Security Council: [Countries Elected Members](https://main.un.org/securitycouncil/en/content/countries-elected-members), [Countries Never Elected Members](https://main.un.org/securitycouncil/en/content/countries-never-elected-members-security-council), [Current Members](https://main.un.org/securitycouncil/en/content/current-members)
- United Nations: [Former Secretaries-General](https://www.un.org/sg/en/content/former-secretaries-general); Dag Hammarskjöld Library: [Who is and has been Secretary-General?](https://ask.un.org/faq/14625)
- [Charter of the United Nations](https://www.un.org/en/about-us/un-charter/full-text), Articles 23 and 97
- Security Council Report: [Sixth Security Council Straw Poll on UN Secretary-General Candidates](https://www.securitycouncilreport.org/whatsinblue/2026/10/sixth-security-council-straw-poll-on-un-secretary-general-candidates.php)
- Sievers and Daws, [The Procedure of the UN Security Council](https://www.scprocedure.org/chapter-3-section-3k), for regional group totals
- Map: [world-atlas](https://github.com/topojson/world-atlas), derived from Natural Earth. Boundaries and names do not imply any endorsement or acceptance.

## Viewing locally

The page loads its data with `fetch`, so open it through a web server rather than by double-clicking the file:

```
python3 -m http.server 8000
```

then visit http://localhost:8000/.

## Publishing with GitHub Pages

Settings, then Pages. Under "Build and deployment", set Source to "Deploy from a branch", choose `main` and `/ (root)`, and save. The site appears at the address above within a few minutes.

## Corrections

Spotted an error? Please open an issue with the source for the correct figure.

## Licence

Code: MIT (see `LICENSE`). Data and text: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Icons are the OCHA Humanitarian Icons (public domain). Flags are from flag-icons (MIT). Third-party files in `assets/vendor/` and `assets/flags/` keep their own licences. The UN emblem is not used, as its use is reserved for the United Nations.
