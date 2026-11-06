# Content review — LAKSHYA.EXE

Updated 2026-11-06. This file records missing source material and facts requiring Lakshya’s confirmation. Unverified claims are withheld from public display.

## Assets present and preserved

- `public/images/face.png` (920×992): primary source for the cursor and cinematic scan.
- `public/images/sidepose.png` (648×1152): profile source for the face turn and portrait gallery.
- `public/images/smile.png` (648×1152): friendly gallery portrait.
- `public/images/yellow_blazer.png` (1200×1599): professional gallery portrait.

Original filenames and image files remain intact.

## Missing assets

Resume PDF; LinkedIn profile screenshots and promised post content; GitHub profile screenshots; project screenshots; six original NPTEL certificate images/PDFs and exact details; non-NPTEL certificate records/assets (none existed in the inspected workspace); achievement/event images; and a higher-resolution side-profile portrait (optional, would improve profile detail). No missing photos or certificates were fabricated.

## Professional details and date conflicts

The resume PDF and LinkedIn/GitHub screenshots are not physically present, so these reported conflicts cannot be rechecked against primary evidence:

1. **E-Cell TOPAZ:** Resume says President is Present. LinkedIn screenshot is reported as July 2025–September 2026, followed by Mentor from September 2026. Confirm transition and whether dates overlap.
2. **BloodConnect:** Resume says Team Leader is Present. LinkedIn screenshot is reported as December 2025–August 2026. Confirm end date and any successor role.
3. **Coplur:** Resume says 45 days. LinkedIn displays May–July 2026. Confirm exact dates, duration, and formal title.
4. **NariSaarthi:** “Co-Founder” and “Founder & CEO” are both reported. Confirm public title, start date, and project description.
5. Confirm degree wording and expected graduation. Confirm whether the reported CGPA 8.57 through semester 4 is correct and approved for publication.
6. Confirm which technologies should appear as skills and whether any proficiency levels are intended. The current index groups technologies named in project descriptions and does not rank proficiency.

Conflicting dates/titles are not silently reconciled in the site.

## Project timeline

`content/project-timeline.json` contains entries for the 12 selected public repositories. All `months` arrays are intentionally empty because available sources do not establish project start/active months. GitHub repository update dates are not treated as project dates.

Please provide confirmed active months in `YYYY-MM` form. Each configured month marks project activity for that calendar month; it does not imply daily activity. No contribution calendar, contribution counts, commit dates, pull request counts, or issue counts are requested or used.

## Claims needing evidence

These remain private review data and are not shown as confirmed public achievements/results:

- IEEE Ignite first-prize/winner claim (event name/year, team attribution, evidence).
- PehchanChain SIH 2026 BEL statement rank claim (reported 11 among approximately 350–400 teams).
- PehchanChain test result (reported 204/204).
- NariSaarthi first-month user count (reported 50+).
- Budding Entrepreneur Award 2025–26.
- NPTEL CSR Elite distinction (reported 75%, top 5% among 3,107 candidates, IIT Kharagpur).
- Reported project and hackathon totals.

Please provide certificates, result pages, event pages, test logs, or other source material and confirm which may be shown publicly. Six NPTEL slots remain as numbered placeholders with “Certificate details pending upload”; no title, score, grade, rank, term, or image was invented. The Recognition section uses source-backed project and community names only.

## Repository and content maintenance

The directory is a local whitelist of exactly 12 owner-selected public repositories in `content/github-repositories.json`. Optional public repository metadata may enrich cards when returned; cards remain available if the request fails. Stars/forks, language, and update dates are omitted unless returned. The service does not request or render contribution data, commits, pull requests, or issue statistics.

To mark timeline months, add confirmed `YYYY-MM` values to the relevant `months` array in `content/project-timeline.json`. To add a certificate, add its verified details and asset path in `content/certifications.json`. No excluded or private repository information is published.

The LinkedIn profile link remains available. The posts section stays hidden while its centralized list is empty; add verified text/date/URL when supplied.

## Source limits

The supplied profile URL is retained in social links. Resume and screenshot files were absent from the workspace. The earlier LinkedIn public index was partial and is not a substitute for screenshots or a resume.
