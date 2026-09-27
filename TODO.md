# Top-Level To-Do

## Content
- [ ] make new blog post on current project, revisit, summer and recent activites (placeholder: `_posts/2026-09-26-fall-update.md`)
    - [ ] include links to project pages
    - note: home "latest posts" and /blog/ are empty ("nothing to see here...") until this lands
- [ ] finish EoS project post (`_projects/post-training-EoS.md`)
    - [ ] find image(s)?
    - [ ] write text (currently ends in "CONTINUE!")
    - [ ] replace `dummy.link` (EoS paper) and the four empty `[]()` links (SGD, adaptive optimizers, transformers, more)
    - [ ] cover the 2026 revisit: flawed original measurements, GPU-native tooling, positive control, null result at full scale
- [ ] write interp project post (placeholder: `_projects/qwen-steering.md`)
    - [ ] find image(s)?
    - [ ] write text (ongoing; live testbed for mechinterp tools)
- [x] update CV page (translated from temp_resume.pdf)
    - [ ] proofread live /cv/ against the PDF

## Consistency
- [x] about page reward hacking link -> `aopatric/qwen-steering`
- [ ] about page typos: "revist", "form legitimate ones", "thsese"
- [ ] about page subtitle "MIT AI Grad in ML Research" — still what you want?

## Dangling / hidden pages
- [ ] delete `_pages/profiles.md` — al-folio template page, reachable at /people/ with placeholder "555 your office number" addresses
- [ ] delete `_pages/about_einstein.md` — template bio, served raw at /_pages/about_einstein.md
- [ ] news: no `_news/` items, but /news/ exists and the home page shows an empty News section
    - either add a few items (MEng start, graduation, OrigamiBench/SONAR) or set `announcements.enabled: false` in about.md and delete `_pages/news.md`
- [ ] books: `_books/` builds to /books/ and /books/* (`output: true`) but the books page is archived, so they're hidden-but-live
    - either restore `_pages_archive/books.md` to `_pages/` or set `books: output: false` in `_config.yml`

## Housekeeping
- [ ] `keywords:` in `_config.yml` is still the theme default (jekyll, jekyll-theme, ...)
- [ ] commit `assets/pdf/temp_resume.pdf` (ok to publish); optionally set `cv_pdf:` in `_pages/cv.md` for a download button
- [ ] `assets/pdf/example_pdf.pdf` shows as deleted; commit that
- [ ] optional: remove template leftovers `lighthouse_results/`, `readme_preview/` (excluded from build, just clutter)
- [ ] lookover and cleanup
