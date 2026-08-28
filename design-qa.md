# Design QA — CycleTag hero product label

final result: passed

## Compared surfaces

- Source reference: `/workspace/scratch/179213e3371f/upload/40a74ad0-c852-4ffa-b8a4-a4133365f9f3.png` (1718 × 705)
- Implementation capture: `/home/oai/share/cycletag-hero-qa-1787900820.png` (browser capture at 1363 × 936 CSS px, DPR 1)
- Route and state: `/`, top of page, default state, no hover

The supplied image was an intentionally rough layout idea rather than an exact visual target. The implementation preserves its core composition—message on the left and QR product on the right—while resolving the QR into a real CycleTag label.

## Visual comparison

- Typography: existing CycleTag headline, scale, casing, and tight line-height preserved.
- Layout: empty desktop space is used without crowding the headline; the product label aligns with the hero's visual center.
- Product clarity: the QR is a real generated PNG, has a proper quiet zone, and sits inside a label with product name, replacement cadence, market, and no-account message.
- Brand consistency: existing ink, paper, orange, green, and lime tokens are reused; borders and offset shadow match the existing industrial label language.
- Responsive behavior: the desktop grid collapses to one column below 950 px and the label scales within the mobile viewport below 650 px.
- Accessibility: the demo is a focusable link with a descriptive accessible name and the QR has meaningful alternative text.

## Interaction and runtime checks

- Clicking the demo label opens the encoded sample tag for “Coffee machine filter”.
- The sample reorder page renders the correct product and retains eBay campaign `5339198614`.
- Browser console after the final change: zero errors and zero warnings.
- Initial development-only CSP issue was fixed by allowing `unsafe-eval` only in development; production CSP remains strict.
- Automated lint, unit tests, production build, and audit are included in the final verification run.

## Findings

- P0: none.
- P1: none.
- P2: none after the development CSP correction.
- P3: physical scanning across multiple phone camera models was not part of browser QA; the QR itself is generated with medium error correction and a valid quiet zone.
