# AJN PDF Platform Depth R16

## Purpose

R16 adds deeper product capabilities on top of Processing Quality R15 without changing MCP source files:

- scoped public API v1
- advanced multilingual  Studio and  layout JSON
- evidence-backed electronic signatures
- Google Drive import/export
- Dropbox import
- explicit OneDrive production gate until MSAL.js + PKCE is configured

The product rule remains the same as R15: a feature is not considered production-ready merely because a button, endpoint, or output file exists. It must have a truthful capability contract, bounded workloads, meaningful output validation, and an acceptance test where practical.

## Public API v1

### Authentication

Header:

```text
X-AJN-API-Key: <plaintext secret>
```

The deployment does **not** store plaintext API secrets in `AJN_PUBLIC_API_KEYS_JSON`; only SHA-256 digests are accepted. Generate a secret locally with:

```text
cd backend
python generate_api_key.py --id developer --scopes read,convert,sign --rate 30
```

Copy the plaintext secret once to the API client. Store only the generated hash record in the backend secret environment.

### Scopes

- `read`: account and capability discovery
- `convert`: conversion endpoints
- ``:  endpoints
- `sign`: electronic-signature endpoint

### API routes

- `GET /api/v1/status`
- `GET /api/v1/account`
- `GET /api/v1/capabilities`
- `POST /api/v1/convert/{tool_id}`
- `POST /api/v1//text`
- `POST /api/v1//searchable-pdf`
- `POST /api/v1//analyze`
- `POST /api/v1/sign/electronic`

The API uses the same validated conversion worker as the website. API authentication adds a separate per-key rate guard.

### Current rate-limit boundary

R16's API-key rate buckets live in process memory. They are useful for one service instance and abuse reduction, but they are **not** a globally synchronized quota across multiple Cloud Run instances. Before paid API plans or strict customer quotas, replace/augment this with a shared store or managed API gateway/quota layer.

##  Studio

### Languages

- English (`eng`)
- Telugu (`tel`)
- Hindi (`hin`)
- Tamil (`tam`)
- Kannada (`kan`)
- Malayalam (`mal`)

Up to three installed languages can be combined in one  pass, for example `eng+tel`.

### Outputs

- TXT
- DOCX
- searchable PDF
- layout JSON

### Layout JSON

Includes:

- page text
- line groups
- word text
- per-word confidence
- bounding boxes
- block / paragraph / line / word identifiers
- orientation and rotation metadata
- detected script and confidence
- aggregate page / word / character / confidence statistics

### Controls

- PDF page range (`all`, `2`, `1-3`, `1,4,7-9`)
- DPI 150â€“400
- page segmentation mode
- auto orientation
- deskew
- denoise
- contrast normalization
- minimum word confidence for layout JSON

Selected-page behavior is shared by TXT, DOCX, searchable PDF and layout JSON instead of being a UI-only option.

## Electronic signatures

R16 implements an **electronic-signature evidence workflow**, not a certificate-backed PAdES digital signature.

### Browser signing

The Sign PDF workspace supports:

- draw signature
- type signature
- upload PNG/JPG signature
- visual drag/resize/page placement
- signer name and email
- signing reason/intent
- explicit consent
- evidence UUID
- UTC timestamp
- SHA-256 of original PDF
- SHA-256 of signature image
- signed-content SHA-256
- final signed-PDF SHA-256 in companion evidence
- embedded `ajn-signature-evidence.json` inside the PDF
- companion evidence JSON download

### API signing

`POST /api/v1/sign/electronic` requires the `sign` scope and returns a ZIP package containing:

1. the signed PDF
2. a companion evidence JSON containing the final PDF SHA-256

The PDF itself embeds an evidence manifest. The embedded record cannot include its own final byte hash without creating a self-reference; the companion manifest records the final serialized PDF hash.

### Not claimed in R16

R16 does not claim:

- PAdES certificate signing
- certificate authority trust
- Aadhaar eSign
- government identity verification
- qualified electronic signatures

A certificate-backed digital-signature phase requires a real signing certificate or trust-service integration, key custody/HSM design, revocation/timestamp handling, and jurisdiction-specific legal review.

## Cloud integrations

Cloud files are browser-initiated and opt-in. Provider buttons are hidden until deployment variables are configured.

### Google Drive

R16 supports:

- user authorization through Google Identity Services
- Google Picker
- narrow `drive.file` scope
- Google Drive file download
- Google Docs -> DOCX export on import
- Google Sheets -> XLSX export on import
- Google Slides -> PPTX export on import
- Google Drawing -> PDF export on import
- processed result upload back to Google Drive

The short-lived Google access token remains in browser memory. AJN PDF does not persist a Google refresh token in the Cloud Run filesystem.

Required public deployment variables:

```text
NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=<set-in-deployment>
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=<set-in-deployment>
NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID=<set-in-deployment>
```

The browser API key must be restricted to AJN PDF production origins and the required Google APIs.

### Dropbox

R16 supports Dropbox Chooser import. Direct Chooser links are downloaded immediately into a browser `File` rather than stored as permanent URLs.

Required public deployment variable:

```text
NEXT_PUBLIC_DROPBOX_APP_KEY=<set-in-deployment>
```

Dropbox result upload is not enabled in R16 because it requires a separate scoped OAuth upload integration.

### OneDrive

OneDrive is intentionally not enabled by merely setting a client id. Production OneDrive access should use MSAL.js authorization-code + PKCE with a registered SPA redirect URI and explicit Microsoft Graph permissions.

Reserved variable:

```text
NEXT_PUBLIC_ONEDRIVE_CLIENT_ID=<set-in-deployment>
```

Setting it alone does not display working OneDrive import/export actions in R16.

## Release gates

The production Docker image must pass:

1. FastAPI import
2. conversion registry/runner contract audit
3. capability audit
4. API v1 key/scope/rate/route contract
5.  language-pack gate
6. six-language  semantic acceptance
7. deep  layout JSON semantic acceptance
8. selected-page  TXT/DOCX/searchable-PDF acceptance
9. electronic-signature evidence/hash/attachment/consent acceptance
10. image-to-PDF fidelity acceptance
11. XPS/AVIF/HEIC hard-format acceptance
12. broad conversion acceptance
13. Processing Quality R15 semantic acceptance

Frontend CI additionally runs dependency install, consistency checks, lint, TypeScript, browser-PDF verification, production build and runtime verification.

## Deployment sequence

Do not enable API/cloud integrations merely by merging source code.

Recommended sequence:

1. pass R15 local validation
2. pass R16 local frontend + Docker validation
3. merge the clean MCP-free integration PR into `main` only after its GitHub CI and release gates are green
4. deploy backend with `AJN_PUBLIC_API_ENABLED=false`
5. verify normal site conversion//signing
6. generate API key locally and inject hashed API-key JSON through secret configuration
7. enable API deliberately
8. configure Google/Dropbox applications and allowed production origins
9. add cloud public env vars and rebuild frontend
10. verify cloud import/export using non-sensitive test documents

MCP transport/auth/tool source remains outside this R16 platform-depth scope.
