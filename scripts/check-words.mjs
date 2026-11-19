// Reads every page a learner sees and fails when the words are too hard.
// The rules come from the teach repo's plain-english.mjs: grade 6, 25 words, no em dash.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { w1Grade, w2Sentences, w3Paragraphs, w5SimplerWords, w9EmDash, w10Expect, w11Links } from "./plain-english.mjs";

const PAGES = ["README.md", "prompts.md", "CLAUDE.md", ".claude/skills/ingest/SKILL.md", ".claude/skills/draft/SKILL.md", ".claude/skills/research/SKILL.md", "brands", "vault"];
const files = (path) => (statSync(path).isDirectory() ? readdirSync(path).flatMap((n) => files(join(path, n))) : path.endsWith(".md") ? [path] : []);

let problems = 0;
for (const file of PAGES.flatMap(files)) {
  if (file === "vault/log.md") continue;
  // A note starts with a YAML header. It is data, not prose, so only the body is graded.
  const text = readFileSync(file, "utf-8").replace(/^---\n[\s\S]*?\n---\n/, "");
  const found = [...w1Grade(text), ...w2Sentences(text), ...w3Paragraphs(text), ...w5SimplerWords(text), ...w9EmDash(text), ...w10Expect(text), ...w11Links(text)];
  for (const message of found) console.log(`${file}: ${message}`), problems++;
}
if (problems) process.exit(1);
console.log("Every page reads plainly, grade 6 or below.");
