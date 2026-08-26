import fs from "node:fs";

const componentPath = "src/components/junction/tool-editorial-content.tsx";
const translationsPath = "src/lib/i18n/translations.ts";
const englishPath = "src/i18n/locales/en.json";

const component = fs.readFileSync(componentPath, "utf8");
const translations = fs.readFileSync(translationsPath, "utf8");
const en = JSON.parse(fs.readFileSync(englishPath, "utf8"));

const pairs = [];

function collect(regex) {
  for (const match of translations.matchAll(regex)) {
    let literal = match[1]
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");

    let key = match[2]
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");

    pairs.push([literal, key]);
  }
}

collect(/^\s*'((?:\\.|[^'])*)'\s*:\s*'((?:\\.|[^'])*)'\s*,?\s*$/gm);
collect(/^\s*"((?:\\.|[^"])*)"\s*:\s*"((?:\\.|[^"])*)"\s*,?\s*$/gm);

const changed = [];
const seen = new Set();

for (const [literal, key] of pairs) {
  if (!component.includes(literal)) continue;
  if (!(key in en)) continue;

  const signature = `${key}\u0000${literal}`;
  if (seen.has(signature)) continue;
  seen.add(signature);

  if (en[key] !== literal) {
    changed.push({
      key,
      before: en[key],
      after: literal,
    });

    en[key] = literal;
  }
}

/*
 * These two labels are already proven by the React hydration traces.
 * Keep their English values identical to the React source.
 */
if ("common.recommended" in en && en["common.recommended"] !== "Recommended") {
  changed.push({
    key: "common.recommended",
    before: en["common.recommended"],
    after: "Recommended",
  });

  en["common.recommended"] = "Recommended";
}

/*
 * Current diagnostic:
 * React client/source = Important limitations
 * rendered English     = Important limits
 *
 * The generic mapping above normally fixes this. If the mapping key is
 * represented differently, locate its current English value safely.
 */
if (component.includes("Important limitations")) {
  for (const key of Object.keys(en)) {
    if (en[key] !== "Important limits") continue;

    const mapped = pairs.some(
      ([literal, mappedKey]) =>
        literal === "Important limitations" && mappedKey === key
    );

    if (!mapped) continue;

    changed.push({
      key,
      before: en[key],
      after: "Important limitations",
    });

    en[key] = "Important limitations";
  }
}

fs.writeFileSync(
  englishPath,
  JSON.stringify(en, null, 2) + "\n",
  "utf8"
);

console.log("============================================================");
console.log(" AJN PDF EDITORIAL I18N HYDRATION ROOT FIX");
console.log("============================================================");

if (changed.length === 0) {
  console.log("INFO: no additional English locale normalization was required.");
} else {
  for (const item of changed) {
    console.log(
      `PASS: ${item.key}: "${item.before}" -> "${item.after}"`
    );
  }
}

console.log(`PASS: ${changed.length} English hydration mapping(s) aligned.`);
console.log("AJN PDF EDITORIAL HYDRATION ROOT FIX: COMPLETE");
