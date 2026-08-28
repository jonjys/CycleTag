# Design QA — CycleTag product presentation

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

## QA addition — product-use illustration

- Source visual truth: `/workspace/scratch/179213e3371f/public/images/cycletag-loop-v2.webp`
- Browser-rendered implementation: `/home/oai/share/cycletag-loop-final-1787915044565.jpg` (synchronized as `/workspace/scratch/cycletag-loop-final-1787915044565.jpg`)
- Source pixels: 1672 × 620.
- Implementation screenshot: 1348 × 926 px at a 1363 × 936 CSS viewport, DPR 1.
- Route and state: `/`, `#how` section at scroll position 1890, default state, no hover.

The generated illustration is the selected visual source for this section. A single combined comparison input contained both the source asset and the rendered browser screenshot.

### Required fidelity surfaces

- Fonts and typography: existing Arial/Helvetica hierarchy is preserved; the large headline and compact green kicker match CycleTag's established visual language and wrap cleanly.
- Spacing and layout rhythm: the headline, supporting sentence, illustration, caption, and four-step rail form one clear vertical story without nested cards.
- Colors and tokens: paper, ink, lime, orange, and deep green in the artwork align with the existing CSS tokens.
- Image quality: the final WebP is sharply rendered, correctly cropped to the useful content, responsive, and 97 KB after metadata stripping and compression.
- Copy and content: “Make it once. Scan it forever.” expresses the persistent physical/digital loop; the four labels accurately explain Create → Stick → Scan → Reorder.

### Comparison history

- Initial implementation showed excessive blank space above and below the illustration because the uncropped 1672 × 941 source canvas was used. Classified P2 for vertical-density drift.
- Fixed by cropping the selected source to 1672 × 620 and versioning the asset path to invalidate the image optimizer cache.
- Post-fix browser evidence shows the complete four-moment illustration at the intended scale with no clipping, stretching, or compression artifacts.

### Browser and interaction evidence

- The responsive image loaded through Next Image with the expected 1672:620 intrinsic ratio.
- Illustration alternative text and the four-step `aria-label` are present in the accessibility tree.
- Page console contains no application errors or warnings; observed errors originate only from the browser's own extension URL.
- The focused section comparison was sufficient because this change is isolated below the generator; the hero and generator layout were unchanged.

### Findings after final comparison

- P0: none.
- P1: none.
- P2: none.
- P3: physical mobile-device rendering remains to be checked after production deployment.

final result: passed
