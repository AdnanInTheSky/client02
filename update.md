# Project Overview & Build System Rank Update

## 1. Project Architecture Overview
This project is a static NGO website (**YCI Bangladesh**) managed via **Pages CMS** and deployed on **Vercel**.
- **Content Management (`/content/`)**: Stores Markdown files formatted with YAML frontmatter across four primary collections:
  - `articles/` — Research and opinion articles.
  - `services/` — Blog posts / stories.
  - `teams/` — Team member profiles.
  - `announcement/` — Announcement cards.
- **Build Scripts**:
  - `generateIndex.js`: Scans all Markdown collection folders, parses YAML frontmatter (including `rank`), sorts entries, and creates `content/index.json`.
  - `build.js`: Reads `services` from `content/index.json`, parses Markdown body using `marked`, applies the template `blog-template.html`, and outputs static HTML pages into `blog-posts/`.
  - `build-articles.js`: Reads `articles` from `content/index.json`, parses Markdown body, applies `article-template.html`, and outputs static HTML pages into `article-posts/`.
- **Frontend Pages**:
  - `index.html`, `articles.html`, `services.html`, and `team.html` fetch `/content/index.json` and client-side render cards based on the indexed array order.

---

## 2. Summary of Modifications Made

All build scripts and client-side index handlers were updated so that content is ordered **descending by rank** (highest rank shown first; e.g., rank 5 appears before rank 4).

### Key Files Updated:

1. **[`generateIndex.js`](file:///C:/Users/victus/Documents/RawGadz/client02/generateIndex.js)**
   - **Change**: Updated sorting comparator in `generateIndex()` to `(a, b) => b.rank - a.rank`.
   - **Fallback**: Updated default fallback rank for unranked items in `getFileRank()` to `-999999` so unranked content appears at the bottom after all ranked items.
   - **Impact**: Generates `content/index.json` with `articles`, `teams`, `services`, and `announcement` sorted from highest rank to lowest rank.

2. **[`build.js`](file:///C:/Users/victus/Documents/RawGadz/client02/build.js)**
   - **Change**: Updated `blogFilesWithRank.sort()` to `(a, b) => b.rank - a.rank`.
   - **Fallback**: Changed missing rank fallback to `-999999`.
   - **Impact**: Builds blog post HTML pages in highest-to-lowest rank order.

3. **[`build-articles.js`](file:///C:/Users/victus/Documents/RawGadz/client02/build-articles.js)**
   - **Change**: Updated `articleFilesWithRank.sort()` to `(a, b) => b.rank - a.rank`.
   - **Fallback**: Changed missing rank fallback to `-999999`.
   - **Impact**: Builds article HTML pages in highest-to-lowest rank order.

4. **[`index.html`](file:///C:/Users/victus/Documents/RawGadz/client02/index.html)**
   - **Change**: Updated frontend announcement array sorting to `(a, b) => b.rank - a.rank` with fallback `-999999`.

5. **[`.pages.yml`](file:///C:/Users/victus/Documents/RawGadz/client02/.pages.yml)**
   - **Change**: Updated field descriptions for `rank` across all collections to `"Sorting order (higher numbers appear first)"` so Pages CMS UI accurately reflects the high-to-low ordering system.

---

## 3. Verification
Ran `npm run build` (`node generateIndex.js && node build.js && node build-articles.js`) to confirm successful index generation and HTML builds:
- **Articles order**: Rank 7 (`2026-06-11-.md`) ➔ Rank 6 ➔ Rank 5 ➔ Rank 4 ➔ Rank 3 ➔ Rank 2 ➔ Rank 1 (`placeholder03.md`).
- **Teams order**: Rank 7 ➔ Rank 6 ➔ Rank 5 ➔ Rank 4 ➔ Rank 3 ➔ Rank 2 ➔ Rank 1.
- **Services order**: Rank 8 ➔ Rank 7 ➔ Rank 6 ➔ Rank 5 ➔ Rank 4 ➔ Rank 3 ➔ Rank 2 ➔ Rank 1.
- **Announcements order**: Rank 2 ➔ Rank 1.
