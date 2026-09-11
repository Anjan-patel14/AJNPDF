# AJN PDF OCR Color / Contrast V5

This patch fixes the remaining scanned-text style regression where light text on a dark badge/background could be sampled as dark/black text.

## Root cause

The previous V4 sampler primarily estimated the background from a small ring outside the OCR word box. When that ring crossed from a coloured badge/cell into the surrounding white page, the page colour could be mistaken for the word background. The foreground clustering then selected the wrong polarity.

## V5 fix

- Estimate solid local background from the dominant colour **inside** the OCR box.
- Use the outside ring only as a fallback for textured/non-uniform regions.
- Score foreground colour clusters by both support and distance from the local background.
- Add a light-on-dark polarity guard.
- Add the mirror dark-on-light guard for ordinary paper text.
- Preserve the existing automatic font size, family, bold, italic, width, table-cell fitting and export logic.
- Keep the existing real browser regression test for blue, red italic and white-on-dark scanned text.

No Git push, Vercel action or deployment is part of this patch.
