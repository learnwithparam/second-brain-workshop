// The whole brain: four functions that work on Markdown files in vault/.
// The CLI and the MCP server both call these, so they can never disagree.
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const COMPANIES = ["learnwithparam", "kaas", "englishmaa"] as const;
export const TYPES = ["idea", "reference", "issue"] as const;
export const RATINGS = ["good", "bad", "unrated"] as const;

export type Company = (typeof COMPANIES)[number];
export type EntryType = (typeof TYPES)[number];
export type Rating = (typeof RATINGS)[number];

export type Entry = {
  id: string;
  title: string;
  company: Company;
  type: EntryType;
  rating: Rating;
  reason: string;
  tags: string[];
  path: string; // relative to the brain folder, so an answer can cite it
  body: string;
};

// Tests point BRAIN_DIR at a temp folder so they never touch your notes.
const root = () => process.env.BRAIN_DIR ?? join(import.meta.dir, "..");
const FOLDER: Record<EntryType, string> = { idea: "ideas", reference: "references", issue: "issues" };

// The CLI and MCP both pass plain strings, so the core checks them. A bad company could otherwise write outside vault/.
function must<T extends string>(list: readonly T[], value: unknown, name: string): T {
  if (!list.includes(value as T)) throw new Error(`${name} must be one of: ${list.join(", ")}. You gave "${value}".`);
  return value as T;
}

// An id is the company plus the title in lowercase words, so a person can read it.
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

// Write one line to vault/log.md, so you can always see what the brain changed.
function log(action: string, entry: string) {
  appendFileSync(join(root(), "vault", "log.md"), `- ${new Date().toISOString().slice(0, 16)} ${action} ${entry}\n`);
}

// A note is a block of "key: value" lines between two --- lines, then the body.
function parse(text: string, path: string): Entry {
  const [, head = "", ...rest] = text.split(/^---\s*$/m);
  const field = (key: string) => head.match(new RegExp(`^${key}:\\s*(.*)$`, "m"))?.[1].trim().replace(/^"|"$/g, "") ?? "";
  return {
    id: field("id"),
    title: field("title"),
    company: field("company") as Company,
    type: field("type") as EntryType,
    rating: (field("rating") || "unrated") as Rating,
    reason: field("reason"),
    tags: field("tags").replace(/^\[|\]$/g, "").split(",").map((t) => t.trim()).filter(Boolean),
    path,
    body: rest.join("---").trim(),
  };
}

function render(e: Omit<Entry, "path">): string {
  const head = ["id", "title", "company", "type", "rating", "reason"].map((k) => `${k}: ${JSON.stringify((e as never)[k])}`);
  return `---\n${head.join("\n")}\ntags: [${e.tags.join(", ")}]\n---\n\n${e.body.trim()}\n`;
}

export function search(filter: { company?: Company; type?: EntryType; rating?: Rating; query?: string } = {}): Entry[] {
  const found: Entry[] = [];
  for (const type of TYPES) {
    const dir = join(root(), "vault", FOLDER[type]);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      const text = readFileSync(join(dir, file), "utf-8");
      const entry = parse(text, `vault/${FOLDER[type]}/${file}`);
      const matches =
        (!filter.company || entry.company === filter.company) &&
        (!filter.type || entry.type === filter.type) &&
        (!filter.rating || entry.rating === filter.rating) &&
        (!filter.query || text.toLowerCase().includes(filter.query.toLowerCase()));
      if (matches) found.push(entry);
    }
  }
  return found;
}

export function add(input: Omit<Entry, "id" | "path">): Entry {
  must(COMPANIES, input.company, "company");
  must(TYPES, input.type, "type");
  must(RATINGS, input.rating, "rating");
  const id = `${input.company}-${slug(input.title)}`;
  const path = `vault/${FOLDER[input.type]}/${id}.md`;
  if (existsSync(join(root(), path))) throw new Error(`${path} already exists. Update it instead.`);
  mkdirSync(dirname(join(root(), path)), { recursive: true });
  writeFileSync(join(root(), path), render({ ...input, id }));
  log("add", path);
  return { ...input, id, path };
}

export function update(id: string, change: { rating?: Rating; reason?: string; tags?: string[]; note?: string }): Entry {
  if (change.rating) must(RATINGS, change.rating, "rating");
  const old = search().find((e) => e.id === id);
  if (!old) throw new Error(`No note with id "${id}". Run search to see the ids.`);
  const next = { ...old, ...(change.rating && { rating: change.rating }), ...(change.reason && { reason: change.reason }), ...(change.tags && { tags: change.tags }) };
  next.body = change.note ? `${old.body}\n\n${change.note.trim()}` : old.body;
  writeFileSync(join(root(), old.path), render(next));
  log("update", old.path);
  return next;
}

export function remove(id: string): string {
  const old = search().find((e) => e.id === id);
  if (!old) throw new Error(`No note with id "${id}". Run search to see the ids.`);
  unlinkSync(join(root(), old.path));
  log("remove", old.path);
  return old.path;
}
