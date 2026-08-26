import fs from 'node:fs';
const home=fs.readFileSync('src/app/page.tsx','utf8');
const hero=fs.readFileSync('src/components/landing/hero.tsx','utf8');
const mobileHero=fs.readFileSync('src/components/landing/mobile-home-hero.tsx','utf8');
const bottomNav=fs.readFileSync('src/components/landing/mobile-bottom-nav.tsx','utf8');
const grid=fs.readFileSync('src/components/landing/services-grid.tsx','utf8');
const css=fs.readFileSync('src/app/globals.css','utf8');
const checks=[
 ['single responsive hero is present before the tool directory',home.includes('<Hero />')&&home.indexOf('<Hero />')<home.indexOf('id="public-tools"')&&!home.includes('MobileHomeHero')],
 ['responsive hero exposes real tool routes',hero.includes('href="#public-tools"')&&hero.includes('href="/merge-pdf"')],
 ['hero presents R21 PDF-only value proposition',hero.includes('Free Online')&&hero.includes('PDF Tools')&&hero.includes('Merge, split, compress, edit, organize, sign and protect PDF files online.')],
 ['unused standalone mobile hero does not expose retired directories',!mobileHero.includes('/conversion-tools')&&!mobileHero.includes('/image-tools')],
 ['homepage contains one primary search id',(home.match(/id="home-tool-search"/g)||[]).length===1&&!home.includes('mobile-home-tool-search')],
 ['mobile search and filter controls remain sticky',home.includes('sticky top-[64px]')],
 ['mobile category state is accessible',home.includes('aria-pressed={activeCategory === category.id}')],
 ['R21 filters include All, Edit, Organize and Security only',['all','edit','organize','security'].every(id=>home.includes(`id: '${id}'`))&&['image','pdf','conversion'].every(id=>!home.includes(`id: '${id}'`))],
 ['phone tool grid uses one full-width card per row',grid.includes('grid grid-cols-1 gap-4 sm:grid-cols-2')],
 ['phone cards remain readable and touch-friendly',grid.includes('min-h-[156px]')&&grid.includes('h-14 w-14')&&grid.includes('line-clamp-2')],
 ['all 20 PDF tools are grouped without progressive hiding',['Popular PDF Tools','Organize PDF','Edit & Sign PDF','PDF Security & Recovery'].every(label=>grid.includes(label))&&!grid.includes('INITIAL_VISIBLE_TOOLS')&&!grid.includes('showMore')],
 ['search includes task aliases and typo-tolerant ranking',grid.includes('SEARCH_EXPANSIONS')&&grid.includes('distanceAtMostTwo')&&grid.includes('searchScore')],
 ['phone cards expose keyboard focus styling',grid.includes('focus-visible:ring-2')],
 ['bottom navigation uses R21 PDF/account destinations',bottomNav.includes('href: "/"')&&bottomNav.includes('href: "/pdf-tools"')&&bottomNav.includes('href: "/sign-pdf"')&&bottomNav.includes('"/account"')&&bottomNav.includes('"/login"')&&!bottomNav.includes('/conversion-tools')&&!bottomNav.includes('/image-tools')&&!bottomNav.includes('/pdf-utilities')],
 ['bottom navigation has three fixed destinations plus dynamic account/login',(bottomNav.match(/\{ label:/g)||[]).length===4&&bottomNav.includes('auth.session ? "Account" : "Login"')],
 ['bottom navigation respects mobile safe area',css.includes('env(safe-area-inset-bottom)')],
 ['mobile page shell reserves bottom navigation space',css.includes('.ajn-page-shell')&&/padding-bottom\s*:\s*5\.35rem/.test(css)]];
for(const[label,ok]of checks){if(!ok){console.error(`FAIL: ${label}`);process.exit(1)}console.log(`PASS: ${label}`)}
console.log('AJN PDF R21 PDF-only mobile-first verification completed successfully.');
