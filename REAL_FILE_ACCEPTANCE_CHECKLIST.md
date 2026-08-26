# AJN PDF Real-File Acceptance Checklist

For every public tool record PASS, LIMITED or FAIL.

## Input cases

- Valid small file
- Valid large file
- Wrong extension
- Corrupted or empty input
- Long and Unicode filename
- Repeat conversion
- Maximum supported file count
- Timeout or backend-unavailable state

## Output checks

- Correct extension and MIME type
- Non-empty downloadable file
- Opens in an independent desktop viewer/editor
- Page count and order correct
- Text, images and tables reviewed
- Reset, retry and duplicate-click prevention work
- Temporary files disappear after delivery

## Browser/UI checks

- Chrome and Edge
- 100%, 110%, 125% and 150% zoom
- 360px, 390px and 430px mobile widths
- 768px and 1024px tablet widths
- Keyboard navigation and focus states
- Reduced-motion setting
- No advertisement overlap or layout shift

## Security/ checks

- Protect PDF user and owner passwords
- Printing/copy/edit permissions in Adobe Reader
- Unlock correct password
- Unlock wrong password rejection
- Already-encrypted input
-  English, Hindi, Telugu, Tamil, Kannada and Malayalam samples
- Handwriting result labelled best-effort
- URL-to-PDF rejects localhost and private-network targets
