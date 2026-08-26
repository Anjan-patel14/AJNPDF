# AJN PDF 3.0.6 — Tool UX and Language Audit

## Production UX rule
Every public tool should follow the same mental model:

**Choose file → Change options only if needed → Process → Download**

Simple tools remain simple. Visual editing tools provide direct preview interaction. Advanced numeric controls are not the primary path.

## Corrected high-impact workflows

| Area | 3.0.6 status |
|---|---|
| Shared upload | True input + drag/drop + keyboard path |
| Merge/Split/Compress | Existing strong flows preserved |
| Protect/Unlock/Repair | Existing real backend flows preserved; backend errors become translatable codes |
| Add Text | Direct visual page positioning; coordinates Advanced |
| Add Image | Direct drag/resize, opacity, rotation, page placement |
| Sign PDF | Draw, Type, Upload; direct drag/resize |
| Watermark PDF | Text-only claim matches real implementation |
| ZIP Extractor | ZIP-only; archive entry/expanded-size limits |
| Server converters | Stage progress, no manufactured precise percent |
| Fake email sharing | Removed |
| Output filename | Visual image/sign editors respect user-selected filename |
| Legacy tool wording | Known developer jargon rewritten to simple user language |

## Language system
Exactly five selectable UI languages:
English, Hindi, Telugu, Tamil and Kannada.

The shared dictionaries have identical key structure and 364 entries each. Stable technical terms remain recognizable. Language switching is global and does not intentionally recreate tool components or clear file/editor state.

## Manual rendered QA still required
Source verification cannot replace real-device testing. After Windows setup passes, manually test at minimum:
- 360 px Android Chrome
- 390/430 px mobile viewport
- iPhone Safari if available
- desktop Chrome/Edge
- light/dark modes
- keyboard-only workflow
- NVDA/VoiceOver representative workflows

Representative tools:
Merge PDF, Split PDF, Compress PDF, Protect PDF, PDF→JPG, Add Text, Add Image, Sign PDF, Watermark PDF, Crop Image, ZIP Extractor and one server Office conversion.
