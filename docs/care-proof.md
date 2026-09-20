# Care Proof pivot

## Demo

1. Open `/`. The hero presents care history; open the sample care chain.
2. Create a tag: exact item, optional part number, last replacement, days. Optionally choose a photo. Only its SHA-256 hash is retained; there is no upload request.
3. Expand the encoded preview before printing. Marketplace is optional and collapsed, off for new tags; Europe / Nordics retains eBay.de and the existing disclosed campaign.
4. Open the generated tag. The next due date stays anchored to the last replacement, even when overdue. Click Log replacement; choose the new date and optionally a new photo. Generate a new QR. The old URL still shows its original snapshot.
5. Reopen or reprint from My tags. Edit/clone/print legacy hashes and legacy `/tag?d=…` remain supported.
6. Open Care Sheet from the result, tag page or homepage. One tag creates 12 copies; select up to 12 different tags from the local shelf for one of each. Print A4 at 100%, browser headers/footers off, or Save as PDF. Page 1 is 12-up; page 2 is the duration schedule.

## Scope and honesty

- The €19 / 12 tags + duration PDF SKU is explicitly coming soon. Preview is free; there is no new payment integration or fake checkout.
- Care Proof is self-reported documentation, not certification, signed provenance or independently verified evidence. A hash identifies photo bytes, not the date or truth of an event.
- Existing v1 payloads still decode. Optional `care` holds part number, hash, up to five previous entries, and marketplace preference. Maximum encoded size stays 2200 characters; an oversized chain is rejected with an explanation, never silently truncated. Keep the previous snapshot and start a new chain after six entries.
- QR/fragment and localStorage only; no accounts, DB, image upload, analytics or new server endpoint.
- Existing Bulk, Spaces, Relay and Seller Kit routes remain available. Their separate workflows were not rewritten.
- Fixed two pre-existing build errors: Support and Affiliate still referenced the removed `contact.operatorPerson` property. Personal legal attribution now appears only through the footer, Terms and Privacy.

## Social before / after (not posted)

Before: “Scan. Reorder. Repeat.”

After: “Care stays with the machine. Last replaced. Exact part. Next due.”

Supporting line: “A QR care chain from Nytto Labs. Optional eBay replacement search when you need it.”

## Verification

Run `npm run verify`. Tests cover legacy decoding, care roundtrips, leap dates, immutable re-issue chains, local photo hashing, invalid evidence, size limits and shelf persistence. Browser/print verification results are recorded in the PR.
