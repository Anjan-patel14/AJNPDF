import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const failures = [];
const check = (label, condition) => condition ? console.log(`PASS: ${label}`) : failures.push(label);

const contact = read('src/app/contact/page.tsx');
const privacy = read('src/app/privacy/page.tsx');
const terms = read('src/app/terms/page.tsx');
const disclaimer = read('src/app/disclaimer/page.tsx');
const footer = read('src/components/landing/main-footer.tsx');
const quick = read('src/components/landing/quick-tools-scroller.tsx');
const blog = read('src/app/blog/page.tsx');
const sitemap = read('src/app/sitemap.ts');

for (const [label, source, canonical] of [
  ['Contact', contact, '/contact'],
  ['Privacy', privacy, '/privacy'],
  ['Terms', terms, '/terms'],
  ['Disclaimer', disclaimer, '/disclaimer'],
]) {
  check(`${label} has unique Metadata export`, source.includes('export const metadata: Metadata'));
  check(`${label} has canonical metadata`, source.includes(`canonical: '${canonical}'`));
}

check('stale 26-tool homepage count removed', !quick.includes('View all 26'));
check('footer links to blog', footer.includes('["PDF Guides","/blog"]'));
check('footer links to privacy, terms, disclaimer and acceptable use',
  ['/privacy','/terms','/disclaimer','/acceptable-use'].every((href) => footer.includes(`"${href}"`)));
check('terms broken placeholder copy removed', !terms.includes('PDF, Office,  and image') && !terms.includes('may contain recognition errors'));
check('disclaimer broken spacing/copy removed', !disclaimer.includes('Conversion and  accuracy') && !disclaimer.includes('Conversion and  results'));
check('privacy copy has no doubled extracted-text spacing', !privacy.includes('extracted  text'));
check('blog has explicit editorial quality statement', blog.includes('Useful guidance, not filler content') && blog.includes('We avoid publishing copied, spun or keyword-only articles.'));
check('blog sitemap cadence is daily', sitemap.includes('path:"/blog", changeFrequency:"daily"'));

if (failures.length) {
  console.error('AJN PDF ADSENSE/TRUST SEO: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('AJN PDF ADSENSE/TRUST SEO: PASS');
