# Website review — 26 October 2026

## Delivered

- One public design system for home, About, service/news listings, detail pages and error pages.
- Shared build templates for navigation, address, hotline, email, office hours and business details.
- Green/white palette, restrained red brand accent, consistent typography, cards, buttons and responsive spacing.
- Accessible mobile menu, keyboard focus, skip link, contact actions and image alternatives.
- Shared safe DOM rendering, pagination, empty states and retry controls.
- Direct detail endpoints for posts/services instead of searching only the first 100 records.
- Admin uses matching brand colors; inline images remain visible in previews. Service descriptions can be edited.
- Removed placeholder analytics tracking IDs and placeholder sitemap domain.
- Default About content uses the existing business information and services; saved admin content takes priority.

## Local sample content repairs

Four exact sample post records contained test text, placeholder content or damaged Vietnamese text.
They were backed up before repair. Titles, summaries and body text were rewritten as general service
information; the unrelated thumbnail on the first post was replaced with an existing activity image.

Local rollback backup: `output/site-review/posts-before-repair-1793024854187.sql`.
Only the local MySQL database was changed. cPanel was not accessed.

Optional production content repair is in `deploy/migrations/20261026_sample_content.sql`.
Export the production posts table first. Its WHERE conditions match only the exact old sample
titles and content; edited production articles are not overwritten.

Existing registration details and business contact information were retained from the project.
They were checked for consistency across pages, not independently verified against official records.

## Verification

- Maven package: successful; this repository currently has no Java test sources.
- Static references: all 15 HTML/CSS files validated.
- Browser smoke: 9 routes at 320, 390, 768 and 1440 pixels; no horizontal overflow or JavaScript errors.
- Checked menus, images, contact links, detail endpoints, admin API protection, retry flow,
  pagination, untrusted text rendering and empty lists.
- Final checks exercised the admin with two inline images, live preview, service description
  submission and About content. Save requests were mocked to avoid test writes.
- Screenshots are in `output/site-review/`.

## Deployment

Deploy the updated backend together with `dist/htxlamhong-public-html.zip`.
The new frontend requires the new direct detail endpoints.
Regenerate shared HTML with `python tools/sync_public_pages.py` before packaging.
This review did not deploy changes to the live website.
