// Tests run on a copy of the vault in a temp folder, so your notes are never touched.
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

test("the MCP server offers the same four tools", async () => {
  const { server } = await import("../src/mcp");
  const client = new Client({ name: "test", version: "1.0.0" });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(a), client.connect(b)]);
  const names = (await client.listTools()).tools.map((t) => t.name).sort();
  expect(names).toEqual(["brain_add", "brain_remove", "brain_search", "brain_update"]);
  const result = await client.callTool({ name: "brain_search", arguments: { company: "englishmaa", rating: "good" } });
  expect(JSON.stringify(result)).toContain("englishmaa-meeting-phrases");
});
