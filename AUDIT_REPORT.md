# Phase 4 — Portfolio Audit & Refinement

**Workspace:** /home/lucky_hacker/Projects/lakshya_portfolio  
**Audit date:** 2026-11-06  
**Framework:** React 19, TypeScript, Vite 8, GSAP, Tailwind CSS 4  
**Validation runtime:** Node 22.23.4

## Summary

The existing cinematic intro was preserved. The portfolio keeps its black, monochrome, and champagne-gold direction. Centralized content drives the profile, projects, experience, achievements, education, skills, social links, certificate placeholders, LinkedIn posts, and repository inventory. Unverified awards, ranks, metrics, CGPA, and NariSaarthi description are not shown as established public facts.

## Workspace and implementation audit

- Workspace is readable and writable from Ubuntu WSL at the requested project path.
- Branch: master. At audit start there was one existing commit and no configured Git remote.
- The app uses React/TypeScript with Vite, GSAP and Tailwind. The current Vite build requires a modern Node runtime; Node 18 fails during Vite startup. The build was run with Node 22.23.4.
- No additional app dependency was installed. Node 22 was invoked from the already available npm package cache for build and browser checks.
- Content remains in JSON files under content/. UI components consume those files instead of embedding professional details.
- Added GitHub public-data service and explorer, portrait-based identity cursor, six certificate placeholders, and an empty reusable LinkedIn activity component.
- The intro supports Skip, replay from the navigation/footer, Escape to skip, and the R replay shortcut. The R shortcut does not fire while an editable field is focused.

## Issue register

| Severity | Area | Finding | Correction / status |
|---|---|---|---|
| High | Accuracy | Several awards, ranking, user-count, test-count, project-count, hackathon-count, and CGPA claims lack original evidence in the workspace. | Hidden from the public interface; retained in CONTENT_REVIEW.md for confirmation. |
| High | Dates and titles | E-Cell TOPAZ, BloodConnect, Coplur, and NariSaarthi have source conflicts or incomplete dates/titles. | No dates are displayed. Source discrepancies remain explicit in CONTENT_REVIEW.md. |
| High | NariSaarthi | Project description and leadership title were not confirmed. | Description is withheld; the experience entry uses a broad “Leadership” role. |
| Medium | GitHub API | GitHub returned HTTP 403 during repeated browser contexts, consistent with an unauthenticated API rate limit. | Error is handled; the supplied 27-repository inventory remains available as static fallback. Activity requests are now limited to the eight most recently updated public repositories and the calendar scope is labeled. |
| Medium | Assets | Resume, profile screenshots, project captures, certificates, achievement images, and LinkedIn posts are not present. | No replacement imagery or claims were fabricated. Six neutral certificate placeholders are shown. |
| Low | Mobile navigation | The original 10-link navigation compressed labels at 390px. | Links now scroll horizontally on mobile instead of shrinking; sticky-header target clearance was added. |

## Content and source findings

- Profile data identifies Lakshya Bhandari, Jaipur, B.Tech Computer Science Engineering (Data Science) at SKIT Jaipur, 2024–2028, and supplied contact/profile links.
- Projects in the data are LaserGuard, PehchanChain, and NariSaarthi. LaserGuard/PehchanChain summaries and technologies come from the supplied brief. No project screenshots are present. NariSaarthi’s description remains hidden pending confirmation.
- Public experience shows E-Cell TOPAZ (President, Mentor), BloodConnect (Team Leader), NariSaarthi (Leadership), and Coplur (Internship), without conflicting dates.
- The technology index groups technologies named in project summaries; it does not rank skill proficiency.
- Unverified achievement entries and CGPA are not presented publicly.
- GitHub inventory contains the 27 public repository names supplied in the brief. Live descriptions, languages, update dates, stars, forks, and commit dates appear only when actually returned by GitHub. The calendar uses up to eight recently updated repositories’ default-branch commit records, not an account-wide contribution total. No private repository names are included.
- LinkedIn post data is empty until the user supplies posts.

### Unresolved details for Lakshya

1. E-Cell President: resume says Present; LinkedIn screenshot summary says July 2025–September 2026, with Mentor from September 2026. Confirm transition and dates.
2. BloodConnect Team Leader: resume says Present; LinkedIn screenshot summary says December 2025–August 2026. Confirm end date and any successor role.
3. Coplur internship: resume says 45 days; LinkedIn screenshot summary says May–July 2026. Confirm exact dates and duration.
4. NariSaarthi: confirm Co-Founder versus Founder & CEO, start date, project description, technologies, and reported user count.
5. Confirm CGPA 8.57 through semester 4 and whether to publish it.
6. Supply original proof for awards, SIH ranking, tests passed, user counts, project/hackathon totals, and NPTEL distinctions.
7. Confirm Coplur title, degree wording/expected graduation, and the skills list.
8. Provide the missing resume, LinkedIn/GitHub screenshots, project screenshots, certificate/achievement images, and LinkedIn posts as desired.

## Asset audit

| Asset | Physical status | Intended usage |
|---|---|---|
| public/images/face.png (920×992) | Present | Primary face source for cinematic scan and cursor. |
| public/images/sidepose.png (648×1152) | Present | Side-pose cursor morph and about section. |
| public/images/smile.png (648×1152) | Present | Friendly portrait inset in the about section. |
| public/images/yellow_blazer.png (1200×1599) | Present | Hero portrait. |
| Resume PDF | Missing | Not used. |
| GitHub/LinkedIn profile screenshots | Missing | No screenshot-sourced claims added. |
| Project screenshots | Missing | Abstract CSS visuals remain; no mock project screenshots were generated. |
| NPTEL certificates | Six images missing | Six labeled placeholders only. |
| Achievement images | Missing | No replacement images used. |
| LinkedIn posts | Missing | Reusable component is hidden while the data list is empty. |

## UX and visual refinements

- Repository cards use actual returned metadata where available; missing data is omitted.
- Search covers names and descriptions; language filter, update/name sorting, and clear filters are available.
- The heatmap displays returned default-branch commit dates only. Each day can expose returned repository/message records. Partial/static states are labeled.
- Project, experience, recognition, certificate, technology, education, and contact sections retain the existing visual system.
- Portrait assets retain their original filenames. The cursor samples the actual face and side-pose images, has no pointer-event interception, fades over controls, and is disabled for touch and reduced motion.
- Mobile navigation is horizontally scrollable. Page and body widths did not exceed the requested viewport at 390px.

## Test results

- Lint: PASS — 0 warnings, 0 errors.
- Production build: PASS — Vite 8.3.6, 40 modules transformed under Node 22.23.4.
- Chromium at 1440×900: no horizontal overflow; all rendered portrait images loaded.
- Chromium at 390×844: no horizontal overflow; cursor is hidden for touch.
- Reduced motion: intro Skip control is absent and cursor motion is disabled.
- Navigation: GitHub anchor navigation verified.
- GitHub directory: 27 cards rendered; an unmatched search shows the empty state; Clear Filters restores all 27 cards.
- Keyboard: pressing R while the repository search field is focused does not replay the intro.
- Intro: navigation replay and Skip controls were exercised.
- Broken image responses: none observed.
- Browser JavaScript exceptions: none observed. GitHub API requests did return 403 after repeated test contexts; the application falls back to the static inventory and labels the unavailable/partial activity state.
- External destinations were checked as rendered links, but the audit did not open each third-party destination.

## Screenshots

Captured under artifacts/:

- phase4-desktop-hero.png — desktop hero at 1440×900.
- phase4-mobile-home.png — mobile hero at 390×844 after the intro.
- phase4-projects-desktop.png — project showcase.
- phase4-github-desktop.png — GitHub directory.
- phase4-experience-desktop.png — experience timeline.
- phase4-certificates-desktop.png — six certificate placeholders.
- phase4-desktop.png and phase4-mobile.png — full-page captures.

## Remaining issues

- The user must provide missing assets and confirm outstanding professional details before those claims can be published.
- GitHub API rate limits can temporarily prevent live data; the static public repository inventory remains available.
- LinkedIn posts are not displayed until supplied.
- The audit exercised major navigation and interactions, but did not run an automated accessibility scanner or verify third-party destinations by opening them.
