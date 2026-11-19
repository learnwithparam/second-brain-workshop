// Tests use a copy of vault/ in a temp folder, so your real notes are never changed.
import { afterEach, beforeEach, expect, test } from "bun:test";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

let dir = "";
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "brain-"));
  cpSync(join(import.meta.dir, "../vault"), join(dir, "vault"), { recursive: true });
  process.env.BRAIN_DIR = dir;
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const brain = () => import("../src/brain");

test("search keeps companies apart", async () => {
  const { search } = await brain();
  const rows = search({ company: "kaas" });
  expect(rows.length).toBeGreaterThan(0);
  expect(rows.every((r) => r.company === "kaas")).toBe(true);
});

test("search filters by rating and by word", async () => {
  const { search } = await brain();
  expect(search({ rating: "bad" }).every((r) => r.rating === "bad")).toBe(true);
  expect(search({ query: "past perfect" }).map((r) => r.id)).toEqual(["englishmaa-grammar-wall"]);
});

test("add writes a note, reads it back and logs it", async () => {
  const { add, search } = await brain();
  const note = add({ company: "kaas", type: "idea", rating: "good", title: "Show the cost first", reason: "Names the cost.", tags: ["cost"], body: "Body with --- inside." });
  expect(note.id).toBe("kaas-show-the-cost-first");
  expect(search({ query: "Body with" })[0].body).toContain("---");
  expect(readFileSync(join(dir, "vault/log.md"), "utf-8")).toContain("add vault/ideas/kaas-show-the-cost-first.md");
});

test("add refuses a second note with the same id", async () => {
  const { add } = await brain();
  const input = { company: "kaas" as const, type: "idea" as const, rating: "good" as const, title: "Same", reason: "r", tags: [], body: "b" };
  add(input);
  expect(() => add(input)).toThrow("already exists");
});

test("add refuses a company or type that could escape vault/", async () => {
  const { add } = await brain();
  const note = { type: "idea" as const, rating: "good" as const, title: "x", reason: "r", tags: [], body: "b" };
  expect(() => add({ ...note, company: "../../x" as never })).toThrow("company must be one of");
  expect(() => add({ ...note, company: "kaas", type: "../../x" as never })).toThrow("type must be one of");
  expect(existsSync(join(dir, "..", "x-x.md"))).toBe(false);
});

test("update changes the rating and keeps the body", async () => {
  const { update, search } = await brain();
  update("kaas-issue-case-study", { rating: "good", reason: "Worth a client story." });
  const [note] = search({ query: "one-page case study" });
  expect(note.rating).toBe("good");
  expect(note.body).toContain("[[kaas-eval-before-ship]]");
});

test("remove deletes the file and an unknown id says what to do", async () => {
  const { remove } = await brain();
  remove("kaas-chatbot-toy");
  expect(existsSync(join(dir, "vault/references/kaas-chatbot-toy.md"))).toBe(false);
  expect(() => remove("nope")).toThrow("Run search");
});

test("the MCP server offers the same tools as the CLI", async () => {
  const { server } = await import("../src/mcp");
  const client = new Client({ name: "test", version: "1.0.0" });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(a), client.connect(b)]);
  const names = (await client.listTools()).tools.map((t) => t.name).sort();
  expect(names).toEqual(["brain_add", "brain_related", "brain_remove", "brain_search", "brain_update"]);
  const result = await client.callTool({ name: "brain_search", arguments: { company: "englishmaa", rating: "good" } });
  expect(JSON.stringify(result)).toContain("englishmaa-meeting-phrases");
});

// The command line tool runs here as a real program. A renamed flag or a changed message fails the test.
const cli = (...args: string[]) => Bun.spawnSync(["bun", "run", join(import.meta.dir, "../src/cli.ts"), ...args], { env: { ...process.env, BRAIN_DIR: dir } });
const text = (out: Uint8Array) => new TextDecoder().decode(out);

test("the cli takes named flags and filters with them", () => {
  const all = text(cli("search").stdout);
  const kaas = text(cli("search", "--company", "kaas", "--rating", "unrated").stdout);
  expect(kaas).toContain("kaas-issue-case-study");
  expect(kaas).not.toContain("englishmaa-");
  expect(all.length).toBeGreaterThan(kaas.length);
});

test("the cli adds a note from flags and says what is missing or mistyped", () => {
  const ok = cli("add", "--company", "kaas", "--type", "idea", "--rating", "good", "--title", "Flag test", "--reason", "Test", "--body", "Body");
  expect(ok.exitCode).toBe(0);
  expect(existsSync(join(dir, "vault/ideas/kaas-flag-test.md"))).toBe(true);
  const missing = cli("add", "--company", "kaas");
  expect(missing.exitCode).toBe(1);
  expect(text(missing.stderr)).toContain("Missing --type");
  expect(cli("search", "--compny", "kaas").exitCode).toBe(1);
});

test("search finds a note by several words in any order, even in a big brain", async () => {
  const { add, search } = await brain();
  for (let i = 0; i < 300; i++) add({ company: "kaas", type: "reference", rating: "good", title: `Filler note ${i}`, reason: "Filler.", tags: ["filler"], body: `Nothing special here ${i}.` });
  add({ company: "kaas", type: "reference", rating: "good", title: "Token audience check", reason: "Names a risk.", tags: ["mcp"], body: "A server must check who a token was issued for." });
  const start = performance.now();
  const hits = search({ query: "issued token mcp" });
  expect(hits.map((h) => h.id)).toEqual(["kaas-token-audience-check"]);
  expect(performance.now() - start).toBeLessThan(1000);
});

test("search matches several words in any order, and stays fast with hundreds of notes", async () => {
  const { add, search } = await brain();
  for (let i = 0; i < 300; i++) add({ company: "kaas", type: "reference", rating: "good", title: `Filler note ${i}`, reason: "Filler.", tags: ["filler"], body: `Nothing special here ${i}.` });
  add({ company: "kaas", type: "reference", rating: "good", title: "Token audience check", reason: "Names a risk.", tags: ["mcp"], body: "A server must check who a token was issued for." });
  const start = performance.now();
  expect(search({ query: "issued token mcp" }).map((e) => e.id)).toEqual(["kaas-token-audience-check"]);
  expect(performance.now() - start).toBeLessThan(2000);
});

test("related walks links in both directions, two steps out, and can stay in one company", async () => {
  const { add, related } = await brain();
  const note = (title: string, body: string, company: "kaas" | "englishmaa" = "kaas") => add({ company, type: "idea", rating: "good", title, reason: "r", tags: [], body });
  note("Hub", "Points at [[kaas-spoke-one]].");
  note("Spoke one", "Points at [[kaas-far-away]].");
  note("Far away", "End of the chain.");
  note("Pointer", "I link back to [[kaas-hub]].");
  note("Other brand", "Also links [[kaas-hub]].", "englishmaa");
  const one = related("kaas-hub");
  expect(one.map((e) => `${e.id}:${e.via}`).sort()).toEqual(["englishmaa-other-brand:linked from", "kaas-pointer:linked from", "kaas-spoke-one:links to"]);
  expect(related("kaas-hub", 2).map((e) => e.id)).toContain("kaas-far-away");
  expect(related("kaas-hub", 1).map((e) => e.id)).not.toContain("kaas-far-away");
  expect(related("kaas-hub", 2, "kaas").some((e) => e.company !== "kaas")).toBe(false);
  expect(() => related("nope")).toThrow("Run search");
});

test("the cli runs related on the seeded notes", () => {
  const out = text(cli("related", "--id", "kaas-eval-before-ship").stdout);
  expect(out).toContain("kaas-issue-case-study");
});
