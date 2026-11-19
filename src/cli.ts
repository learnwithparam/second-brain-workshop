// The command line way in to the brain. Claude Code runs this with bash.
// Each value has a name, so a command reads like a sentence:
//   bun run cli search --company kaas --rating unrated
import { parseArgs } from "node:util";
import { add, related, remove, search, update, type Company, type EntryType, type Rating } from "./brain";

const USAGE = `Usage: bun run cli <command> [--name value]

  search   --company kaas --type idea --rating unrated --word mcp   (all flags are optional)
  related  --id <id> [--depth 2] [--company kaas]   (notes linked to or from this one)
  add      --company kaas --type idea --rating good --title "..." --reason "..." --body "..." [--tags a,b]
  update   --id <id> [--rating good] [--reason "..."] [--note "..."]
  remove   --id <id>

Companies: learnwithparam, kaas, englishmaa. Types: idea, reference, issue. Ratings: good, bad, unrated.`;

const [command, ...rest] = Bun.argv.slice(2);

try {
  // An unknown flag stops the command with a message, so a typo is never ignored.
  const { values: v } = parseArgs({
    args: rest,
    options: {
      company: { type: "string" }, type: { type: "string" }, rating: { type: "string" }, word: { type: "string" },
      title: { type: "string" }, reason: { type: "string" }, body: { type: "string" }, tags: { type: "string" },
      id: { type: "string" }, note: { type: "string" }, depth: { type: "string" },
    },
  });
  // A missing flag gives a clear message instead of a crash.
  const need = (name: keyof typeof v) => v[name] ?? (() => { throw new Error(`Missing --${name}.\n\n${USAGE}`); })();

  if (command === "search") {
    const rows = search({ company: v.company as Company, type: v.type as EntryType, rating: v.rating as Rating, query: v.word });
    console.table(rows.map(({ id, title, rating, tags, path }) => ({ id, title, rating, tags: tags.join(","), path })));
  } else if (command === "related") {
    const rows = related(need("id"), v.depth ? Number(v.depth) : 1, v.company as Company);
    console.table(rows.map(({ id, title, via, distance, company, path }) => ({ id, title, via, distance, company, path })));
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
  // Show the problem and the fix, without a stack trace.
  console.error((error as Error).message);
  process.exit(1);
}
