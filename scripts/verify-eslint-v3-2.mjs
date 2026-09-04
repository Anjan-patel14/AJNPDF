import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const check = (label, ok) => ok ? console.log(`PASS: ${label}`) : failures.push(label);
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const runner = read("scripts/run-eslint.mjs");
const config = read("eslint.config.mjs");
const editor = read("src/components/junction/PdfEditorLab.tsx");

check("flat ESLint config exists", fs.existsSync(path.join(root, "eslint.config.mjs")));
check("runner explicitly selects eslint.config.mjs", runner.includes("'--config'") && runner.includes("eslintConfig"));
check("runner forces ESLINT_USE_FLAT_CONFIG=true", runner.includes("ESLINT_USE_FLAT_CONFIG: 'true'"));
check("runner pins cwd to project root", runner.includes("cwd: projectRoot"));
check("runner still treats warnings as failures", runner.includes("'--max-warnings'") && runner.includes("'0'"));
check("Next Core Web Vitals config remains enabled", config.includes("next/core-web-vitals"));
check("Next TypeScript lint config remains enabled", config.includes("next/typescript"));
check("editor documents local img preview exception", editor.startsWith("/* eslint-disable @next/next/no-img-element */"));
check("editor drawSpacedText is stable callback", editor.includes("const drawSpacedText = useCallback(async"));
check("export callback includes drawSpacedText dependency", editor.includes("[drawSpacedText, file?.name, objects, pages]"));
check("Ctrl+Z handler has no standalone ternary expression", !editor.includes("event.shiftKey ? redo() : undo()"));

if (failures.length) {
  console.error("\nAJN PDF ESLINT V3.3 CONTRACT: FAIL");
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}
console.log("\nAJN PDF ESLINT V3.3 CONTRACT: PASS");
