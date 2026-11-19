// The terminal door to the brain. Claude Code runs this with bash.
// Usage: bun run cli <search|add|update|remove> ...
import { add, remove, search, update, type Company, type EntryType, type Rating } from "./brain";

const [command, ...args] = Bun.argv.slice(2);
// "all" or a missing word means "do not filter on this".
const pick = <T extends string>(word?: string) => (word && word !== "all" ? (word as T) : undefined);

try {
  if (command === "search") {
    const [company, rating, query] = args;
    const rows = search({ company: pick<Company>(company), rating: pick<Rating>(rating), query });
    console.table(rows.map(({ id, rating, reason, path }) => ({ id, rating, reason, path })));
  } else if (command === "add") {
    const [company, type, rating, title, reason, body] = args;
    console.log(add({ company: company as Company, type: type as EntryType, rating: rating as Rating, title, reason, tags: [], body }).path);
  } else if (command === "update") {
    const [id, rating, reason, note] = args;
    console.log(update(id, { rating: pick<Rating>(rating), reason, note }).path);
  } else if (command === "remove") {
    console.log(`removed ${remove(args[0])}`);
  } else {
    console.log("Usage: bun run cli <search|add|update|remove>\n  search <company|all> <rating|all> [word]\n  add <company> <type> <rating> <title> <reason> <body>\n  update <id> <rating|all> [reason] [note]\n  remove <id>");
  }
} catch (error) {
  // Say what went wrong and what to do, with no stack trace.
  console.error((error as Error).message);
  process.exit(1);
}
