// The terminal door to the brain. Claude Code runs this with bash.
// Every value has a name, so a command reads like a sentence:
//   bun run cli search --company kaas --rating unrated
import { parseArgs } from "node:util";
import { add, remove, search, update, type Company, type EntryType, type Rating } from "./brain";

const USAGE = `Usage: bun run cli <command> [--name value]

  search   --company kaas --type idea --rating unrated --word mcp   (all flags are optional)
  add      --company kaas --type idea --rating good --title "..." --reason "..." --body "..." [--tags a,b]
  update   --id <id> [--rating good] [--reason "..."] [--note "..."]
  remove   --id <id>

Companies: learnwithparam, kaas, englishmaa. Types: idea, reference, issue. Ratings: good, bad, unrated.`;

const [command, ...rest] = Bun.argv.slice(2);

try {
  // strict: false would hide a mistyped flag, so a typo stops with a message instead.
  const { values: v } = parseArgs({
    args: rest,
    options: {
      company: { type: "string" }, type: { type: "string" }, rating: { type: "string" }, word: { type: "string" },
      title: { type: "string" }, reason: { type: "string" }, body: { type: "string" }, tags: { type: "string" },
      id: { type: "string" }, note: { type: "string" },
    },
  });
  // A missing flag becomes a clear message, not a crash further down.
  const need = (name: keyof typeof v) => v[name] ?? (() => { throw new Error(`Missing --${name}.\n\n${USAGE}`); })();

  if (command === "search") {
    const rows = search({ company: v.company as Company, type: v.type as EntryType, rating: v.rating as Rating, query: v.word });
    console.table(rows.map(({ id, rating, reason, path }) => ({ id, rating, reason, path })));
  } else if (command === "add") {
    const tags = v.tags ? v.tags.split(",").map((t) => t.trim()) : [];
    console.log(add({ company: need("company") as Company, type: need("type") as EntryType, rating: need("rating") as Rating, title: need("title"), reason: need("reason"), tags, body: need("body") }).path);
  } else if (command === "update") {
    console.log(update(need("id"), { rating: v.rating as Rating, reason: v.reason, note: v.note }).path);
  } else if (command === "remove") {
    console.log(`removed ${remove(need("id"))}`);
  } else {
    console.log(USAGE);
  }
} catch (error) {
  // Say what went wrong and what to do, with no stack trace.
  console.error((error as Error).message);
  process.exit(1);
}
