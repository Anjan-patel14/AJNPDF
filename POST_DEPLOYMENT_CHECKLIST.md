# AJN PDF Post-Deployment Checklist

1. Verify `https://www.ajnpdf.com`, `https://api.ajnpdf.com/health` and HTTPS redirects.
2. Verify `/robots.txt`, `/sitemap.xml`, `/image-sitemap.xml`, `/feed.xml` and `/ads.txt`.
3. Verify `/developer`, `/ajn-studio`, `/discover` and a published image detail page.
4. Confirm admin routes are noindex and excluded from AdSense.
5. Publish one original image through `/admin/media`, verify same-domain public-media delivery, then delete a test post.
6. Run Protect, Unlock, Repair, DOCX-to-PDF, PDF-to-DOCX, image-to-PDF and PDF-to-image real-file tests.
7. Confirm temporary conversion files disappear and public media persists.
8. Confirm analytics receives only consented aggregate events and stores no filenames,  text or IP addresses.
9. Configure Search Console, submit both sitemaps and inspect core URLs.
10. Configure Google Privacy & Messaging/CMP where required and test accept/reject/manage choices.
11. Verify ad placement does not touch upload, processing, result, download, admin or legal interfaces.
12. Request AdSense review only after useful content and real tools are publicly working.
