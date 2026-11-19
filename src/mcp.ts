// The MCP door to the brain. Claude Desktop, Cursor or any MCP client can use it.
// It calls the same functions as the CLI. Run it with: bun run mcp
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { add, COMPANIES, RATINGS, related, remove, search, TYPES, update } from "./brain";

export const server = new McpServer({ name: "second-brain", version: "1.0.0" });

const company = z.enum(COMPANIES);
const type = z.enum(TYPES);
const rating = z.enum(RATINGS);
const reply = (value: unknown) => ({ content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] });

server.registerTool(
  "brain_search",
  { description: "Find notes by company, type, rating or a word", inputSchema: { company: company.optional(), type: type.optional(), rating: rating.optional(), query: z.string().optional() } },
  async (filter) => reply(search(filter)),
);

server.registerTool(
  "brain_related",
  { description: "Follow [[links]] from one note to the notes it links to and the notes that link to it. depth 2 goes one step further", inputSchema: { id: z.string(), depth: z.number().int().min(1).max(5).optional(), company: company.optional() } },
  async ({ id, depth, company }) => reply(related(id, depth, company)),
);

server.registerTool(
  "brain_add",
  { description: "Save a new note. The reason says why it is good or bad for the company", inputSchema: { company, type, rating, title: z.string(), reason: z.string(), tags: z.array(z.string()), body: z.string() } },
  async (input) => reply(add(input)),
);

server.registerTool(
  "brain_update",
  { description: "Change a note's rating, reason or tags, or add a line to it", inputSchema: { id: z.string(), rating: rating.optional(), reason: z.string().optional(), tags: z.array(z.string()).optional(), note: z.string().optional() } },
  async ({ id, ...change }) => reply(update(id, change)),
);

server.registerTool("brain_remove", { description: "Delete a note by id", inputSchema: { id: z.string() } }, async ({ id }) => reply(remove(id)));

// Only start listening when run as a program, so a test can import the server.
if (import.meta.main) await server.connect(new StdioServerTransport());
