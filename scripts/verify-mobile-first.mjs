import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const home = read("src/app/page.tsx");
const hero = read("src/components/landing/hero.tsx");
const quick = read("src/components/landing/quick-tools-scroller.tsx");
const mobileHero = read("src/components/landing/mobile-home-hero.tsx");
const bottomNav = read("src/components/landing/mobile-bottom-nav.tsx");
const grid = read("src/components/landing/services-grid.tsx");
const css = read("src/app/globals.css");

let failed = false;
const pass = (message) => console.log(`PASS: ${message}`);
const fail = (message) => { failed = true; console.error(`FAIL: ${message}`); };
const check = (label, condition) => condition ? pass(label) : fail(label);

check(
  "single responsive hero is present before the tool directory",
  home.includes("<Hero />") &&
    home.indexOf("<Hero />") < home.indexOf('id="public-tools"') &&
    !home.includes("MobileHomeHero"),
);

check(
  "quick-access row exposes real PDF tool routes below the simple hero",
  home.includes("<QuickToolsScroller />") &&
    home.indexOf("<Hero />") < home.indexOf("<QuickToolsScroller />") &&
    home.indexOf("<QuickToolsScroller />") < home.indexOf('id="public-tools"') &&
    quick.includes("toolPath(tool.id)") &&
    ["merge-pdf", "compress-pdf", "split-pdf", "sign-pdf", "protect-pdf", "organize-pdf"]
      .every((id) => quick.includes(`id: "${id}"`) || quick.includes(`id: '${id}'`)),
);

check(
  "hero presents the approved V9 PDF-only value proposition",
  hero.includes("Free Online PDF Tools") &&
    hero.includes("Merge, compress, split, organize, edit, sign and protect PDF files") &&
    hero.includes("all in one simple workspace."),
);

check(
  "unused standalone mobile hero does not expose retired directories",
  !mobileHero.includes("/conversion-tools") && !mobileHero.includes("/image-tools"),
);

check(
  "homepage contains one primary search id",
  (home.match(/id="home-tool-search"/g) || []).length === 1 &&
    !home.includes("mobile-home-tool-search"),
);

check(
  "mobile search and category controls are horizontally usable",
  home.includes("ajn-scrollbar-hide flex gap-2 overflow-x-auto") &&
    home.includes('aria-label="Filter PDF tools"'),
);

check(
  "mobile category state is accessible",
  home.includes("aria-pressed={activeCategory === category.id}"),
);

const categoryIds = [...home.matchAll(/id:\s*["']([^"']+)["']/g)].map((match) => match[1]);
check(
  "V9 filters include All, Edit, Organize and Security only",
  ["all", "edit", "organize", "security"].every((id) => categoryIds.includes(id)) &&
    ["image", "pdf", "conversion"].every((id) => !categoryIds.includes(id)),
);

check(
  "phone tool grid uses one full-width card per row before responsive breakpoints",
  grid.includes("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"),
);

check(
  "phone cards remain readable and touch-friendly",
  grid.includes("min-h-[158px]") &&
    grid.includes("h-[58px] w-[58px]") &&
    grid.includes("line-clamp-2"),
);

check(
  "all 20 PDF tools are grouped without progressive hiding",
  ["Popular PDF Tools", "Organize PDF", "Edit & Sign PDF", "Protect & Repair"]
    .every((label) => grid.includes(label)) &&
    !grid.includes("INITIAL_VISIBLE_TOOLS") &&
    !grid.includes("showMore"),
);

check(
  "search includes task aliases and typo-tolerant ranking",
  grid.includes("SEARCH_EXPANSIONS") &&
    grid.includes("distanceAtMostTwo") &&
    grid.includes("searchScore"),
);

check("phone cards expose keyboard focus styling", grid.includes("focus-visible:ring-2"));

check(
  "bottom navigation uses focused PDF/account destinations",
  bottomNav.includes('href: "/"') &&
    bottomNav.includes('href: "/pdf-tools"') &&
    bottomNav.includes('href: "/sign-pdf"') &&
    bottomNav.includes('"/account"') &&
    bottomNav.includes('"/login"') &&
    !bottomNav.includes("/conversion-tools") &&
    !bottomNav.includes("/image-tools") &&
    !bottomNav.includes("/pdf-utilities"),
);

check(
  "bottom navigation has three fixed destinations plus dynamic account/login",
  (bottomNav.match(/\{ label:/g) || []).length === 4 &&
    bottomNav.includes('auth.session ? "Account" : "Login"'),
);

check(
  "bottom navigation has safe-area-aware fixed mobile styling",
  css.includes(".ajn-mobile-bottom-nav") &&
    css.includes(".ajn-mobile-bottom-nav-inner") &&
    css.includes(".ajn-mobile-nav-item") &&
    css.includes("env(safe-area-inset-bottom)") &&
    css.includes("grid-template-columns: repeat(4, minmax(0, 1fr))"),
);

check(
  "mobile page shell reserves space for bottom navigation",
  css.includes("AJN PDF V9 MOBILE NAVIGATION") &&
    css.includes("padding-bottom: calc(5.35rem + env(safe-area-inset-bottom))"),
);

check("reduced-motion behavior remains present", css.includes("@media (prefers-reduced-motion: reduce)"));

if (failed) process.exit(1);
console.log("AJN PDF V9 MOBILE-FIRST VERIFICATION: PASS");