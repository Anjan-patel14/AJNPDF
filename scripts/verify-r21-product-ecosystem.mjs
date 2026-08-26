import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const exists = (path) => fs.existsSync(path);
const failures = [];
const check = (label, condition) => condition ? console.log(`PASS: ${label}`) : failures.push(label);

const policy = read('src/lib/tool-policy.ts');
const hero = read('src/components/landing/hero.tsx');
const page = read('src/app/page.tsx');
const cards = read('src/components/landing/services-grid.tsx');
const navbar = read('src/components/landing/navbar.tsx');
const mobileNav = read('src/components/landing/mobile-bottom-nav.tsx');
const layout = read('src/app/layout.tsx');
const next = read('next.config.ts');
const auth = read('src/lib/auth-context.tsx');
const authUi = read('src/components/account/auth-panel.tsx');
const firebaseRest = read('src/lib/firebase-rest.ts');
const authSetup = read('scripts/R24_AUTH_GOOGLE_EMAIL_SETUP.ps1');
const firebaseToken = read('src/lib/firebase-token.ts');
const adminProxy = read('src/app/api/account/admin-analytics/route.ts');
const pricing = read('src/app/pricing/page.tsx');
const billingUi = read('src/components/billing/razorpay-checkout.tsx');
const billingServer = read('src/lib/billing-server.ts');
const billingBackend = read('backend/app/billing_routes.py');
const backendAsgi = read('backend/app/asgi.py');
const backendRequirements = read('backend/requirements.txt');
const plans = read('src/lib/plans.ts');
const developer = read('src/app/developers/page.tsx');
const androidBuild = read('scripts/R21_BUILD_ANDROID.ps1');
const finalProduction = read('scripts/R21_FINAL_PRODUCTION.ps1');
const assetLinks = read('src/app/.well-known/assetlinks.json/route.ts');
const publicIds = JSON.parse(read('scripts/r13-public-tool-ids.json'));

const allowlist = policy.match(/PRODUCTION_PUBLIC_TOOL_IDS = new Set\(\[([\s\S]*?)\]\);/)?.[1] || '';
const ids = [...allowlist.matchAll(/'([^']+)'/g)].map((m) => m[1]);
const movedImageIds = ['image-reducer','image-resizer','crop-image','rotate-image','watermark-image','flip-image','convert-image'];

check('R21 exposes exactly 20 PDF-only public tool IDs', ids.length === 20 && new Set(ids).size === 20 && publicIds.length === 20 && movedImageIds.every((id) => !ids.includes(id)));
check('homepage hero is simple and removes old demo marketing', hero.includes('Free Online') && hero.includes('PDF Tools') && !/27 focused|Workspace preview|Report\.pdf|Proposal\.pdf|Statement\.pdf/i.test(hero));
const categoryIds = [...page.matchAll(/id:\s*["']([^"']+)["']/g)].map((match) => match[1]);
check(
  'homepage filters are PDF-only',
  ['all','edit','organize','security'].every((id) => categoryIds.includes(id)) &&
    !categoryIds.includes('image') &&
    !categoryIds.includes('conversion')
);
const cardMinHeight = Number(cards.match(/min-h-\[(\d+)px\]/)?.[1] || 0);
const hasLargeArtwork =
  /h-\[(?:5[6-9]|6\d)px\]\s+w-\[(?:5[6-9]|6\d)px\]/.test(cards) ||
  /className=["'][^"']*\bh-12\b[^"']*\bw-12\b/.test(cards) ||
  /sm:h-16\s+sm:w-16/.test(cards);
check(
  'tool cards are enlarged for the focused directory',
  cardMinHeight >= 156 && hasLargeArtwork && !/Image Tools/i.test(cards)
);
check(
  'header exposes PDF product and account surfaces',
  ['/pdf-tools','/pricing','/login','/account'].every((value) => navbar.includes(value)) &&
    !navbar.includes('/image-tools')
);
check('mobile navigation no longer exposes image directory', !mobileNav.includes('/image-tools') && mobileNav.includes('/sign-pdf') && mobileNav.includes('/account'));
check('Firebase auth provider is mounted globally without legacy Google Identity script', layout.includes('<AuthProvider>') && !layout.includes('accounts.google.com/gsi/client'));
check('Firebase auth covers email signup/login/reset, Google and token refresh', ['accounts:signUp','accounts:signInWithPassword','accounts:sendOobCode','securetoken.googleapis.com','GoogleAuthProvider','signInWithPopup'].every((value) => firebaseRest.includes(value)) && !firebaseRest.includes('FacebookAuthProvider') && !firebaseRest.includes('GithubAuthProvider'));
check('authentication UI exposes Google and Email/Gmail only', authUi.includes('Continue with Google') && authUi.includes('email / Gmail') && !authUi.includes('Facebook') && !authUi.includes('GitHub') && !firebaseRest.includes('signInAnonymously') && !authUi.includes('Continue anonymously'));
check('authentication setup disables anonymous and verifies Google provider', authSetup.includes('anonymous = @{ enabled = $false }') && authSetup.includes("Enable-ExistingIdp 'google.com'") && authSetup.includes('authorizedDomains') && !authSetup.includes('Facebook App Secret') && !authSetup.includes('GitHub OAuth Client Secret'));
check('Firebase OAuth CSP permits only required helper/CDN origins', next.includes('https://www.gstatic.com') && next.includes('https://*.firebaseapp.com') && next.includes("Cross-Origin-Opener-Policy") && next.includes('same-origin-allow-popups'));
check('account session refreshes verified billing entitlement', auth.includes('refreshFirebaseSession') && auth.includes("'/api/billing/account'") && auth.includes('refreshPlan') && auth.includes("'premium'"));
check('server verifies Firebase token before admin analytics', firebaseToken.includes('securetoken.google.com') && firebaseToken.includes('Firebase token signature is invalid') && adminProxy.includes('verifyFirebaseIdToken') && adminProxy.includes('AJN_ANALYTICS_ADMIN_TOKEN'));
check('Firebase X.509 verifier uses certificate public key directly', firebaseToken.includes('new X509Certificate(certificate).publicKey') && !firebaseToken.includes('createPublicKey('));
check('admin secret is not exposed through NEXT_PUBLIC variables', !adminProxy.includes('NEXT_PUBLIC_AJN_ADMIN') && !firebaseToken.includes('NEXT_PUBLIC_AJN_ADMIN'));
check(
  'Razorpay checkout is server-order based and capture verified',
  pricing.includes('RazorpayCheckout') &&
    /fetch\(\s*["']\/api\/billing\/order["']/.test(billingUi) &&
    /fetch\(\s*["']\/api\/billing\/verify["']/.test(billingUi) &&
    /["']\/orders["']/.test(billingBackend) &&
    /["']\/payments\/\{payment_id\}["']/.test(billingBackend) &&
    /captured/.test(billingBackend)
);
check('Razorpay signatures use HMAC SHA256 and timing-safe comparison', billingBackend.includes('hmac.new') && billingBackend.includes('hashlib.sha256') && billingBackend.includes('hmac.compare_digest') && billingBackend.includes('X-Razorpay-Signature'));
check('billing writes Premium entitlement through trusted Firestore server code', billingBackend.includes("collection('subscriptions')") && billingBackend.includes("collection('billingOrders')") && billingBackend.includes('@firestore.transactional') && backendRequirements.includes('google-cloud-firestore==2.28.1'));
check('browser never receives Razorpay Key Secret or webhook secret', !billingUi.includes('RAZORPAY_KEY_SECRET') && !billingUi.includes('RAZORPAY_WEBHOOK_SECRET') && !pricing.includes('RAZORPAY_KEY_SECRET') && !pricing.includes('RAZORPAY_WEBHOOK_SECRET') && !billingServer.includes('RAZORPAY_KEY_SECRET'));
check('billing proxy verifies Firebase before forwarding trusted identity', billingServer.includes('verifyFirebaseIdToken') && billingServer.includes('AJN_BILLING_INTERNAL_TOKEN') && billingServer.includes('X-AJN-User-UID') && billingServer.includes('X-AJN-User-Email'));
check('production ASGI mounts billing routes', backendAsgi.includes('billing_router') && backendAsgi.includes('include_router'));
check('Razorpay CSP allows checkout without opening generic script origins', next.includes('https://checkout.razorpay.com') && next.includes('https://api.razorpay.com') && next.includes('https://*.razorpay.com'));
check('Premium claims match enforced prepaid and ad-free behavior', plans.includes('30-day or 365-day prepaid access') && plans.includes('Ad-free experience while signed in') && plans.includes('No automatic renewal in this release'));
check('developer page exposes existing API v1 contract', developer.includes('/api/v1/status') && developer.includes('/api/v1/capabilities') && developer.includes('/api/v1/convert/{tool_id}') && developer.includes('/api/v1/sign/electronic'));
check('image routes are redirected to AJN IMG handoff', next.includes('imageToolRedirects') && next.includes("destination: '/img'"));
check('Firebase and Windows/Android setup assets exist', ['firebase.json','firestore.rules','firestore.indexes.json','.env.r21.example','scripts/R21_FIREBASE_SETUP.ps1','scripts/R24_AUTH_GOOGLE_EMAIL_SETUP.ps1','scripts/R21_CREATE_API_KEY.ps1','scripts/R21_BUILD_ANDROID.ps1','scripts/R21_SETUP_ALL.ps1','scripts/R21_FINAL_PRODUCTION.ps1'].every(exists));
check('Android build verifies explicit package identity and signer fingerprint', androidBuild.includes('ExpectedPackageId') && androidBuild.includes('twa-manifest.json') && androidBuild.includes('keytool -printcert -jarfile') && androidBuild.includes('R21_ANDROID_BUILD.json'));
check('Digital Asset Links are server-configured without public secrets', assetLinks.includes('AJN_ANDROID_PACKAGE_ID') && assetLinks.includes('AJN_ANDROID_SHA256_FINGERPRINTS') && assetLinks.includes('delegate_permission/common.handle_all_urls') && !assetLinks.includes('NEXT_PUBLIC_'));
check('legacy billing-link env is removed by final production helper', finalProduction.includes("Set-LocalEnvValue 'NEXT_PUBLIC_AJN_BILLING_URL' ''") && finalProduction.includes("vercel@latest env rm NEXT_PUBLIC_AJN_BILLING_URL"));
check('final production helper synchronizes admin token and verifies live R21', finalProduction.includes('AJN_ANALYTICS_ADMIN_TOKEN') && finalProduction.includes('gcloud run services update') && finalProduction.includes('https://www.ajnpdf.com/') && finalProduction.includes('3.2.0-r21'));
check('ecosystem product pages exist', ['src/app/account/page.tsx','src/app/admin/page.tsx','src/app/pricing/page.tsx','src/app/desktop/page.tsx','src/app/mobile/page.tsx','src/app/sign/page.tsx','src/app/developers/page.tsx','src/app/img/page.tsx'].every(exists));

if (failures.length) {
  console.error('AJN PDF PRODUCT ECOSYSTEM: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('AJN PDF PRODUCT ECOSYSTEM: PASS');
