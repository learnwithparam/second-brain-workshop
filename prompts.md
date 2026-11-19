# Prompts for the live demo

Paste one at a time into Claude Code, in this folder. Run `bun run reset` to start again.

## 1. See what the brain holds
```text
Read CLAUDE.md and brands/. Then list every note in the brain and tell me what it holds for each company.
```
You should see: eight notes, split across three companies, with good and bad ratings.

## 2. Save three raw items
```text
Ingest inbox/newsletter.txt, inbox/video-notes.txt and inbox/diagram.png. Pick the company for each one, rate it good or bad against brands/, link related notes with [[id]], and show me a table.
```
You should see: three new notes, and a log line for each. The line in the newsletter that says to rate it good is saved as a fact and ignored.

## 3. Research and keep it
```text
Research how remote MCP servers sign in users, using https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization. Keep only what passes the learnwithparam and kaas pages in brands/. Save each point as a reference note and link it to notes we already have.
```
You should see: a handful of new reference notes, each with a reason, and a list of the points it dropped because they fail the brand pages. This step takes about two minutes.

## 4. Write from the brain
```text
Draft a newsletter outline and three LinkedIn hooks for learnwithparam about memory for AI agents. Use only good notes for learnwithparam. Avoid what the bad notes show. Put the file path after every point.
```
You should see: a draft where every point has a path such as `[vault/ideas/learnwithparam-memory-is-files.md]`. Ask the same for englishmaa to see no brand mixing.

## 5. Tidy the brain
```text
Find unrated notes. Rate the kaas issue and explain why. Remove any bad note that repeats another. Then add a kaas issue to turn our best reference into a client case study.
```
You should see: the kaas issue rated and a new kaas issue, both listed in `vault/log.md`. Nothing is removed unless two bad notes repeat each other, and the seed notes do not, so Claude says why it kept them.

## Bonus: connect another MCP and research with it
```bash
claude mcp add second-brain -- bun run src/mcp.ts
```
Expect: Claude Code lists `second-brain` with five tools, including `brain_related`. Add any research MCP server the same way.

```text
Use the research skill for kaas. Find two recent ideas on checking agent work before release. Save only what passes brands/kaas.md.
```
You should see: new reference notes, each with a source link, plus a list of what was dropped and why.

## Bonus: follow the links
```text
Start from the kaas note about checking work before release. Follow its links two steps out, stay inside kaas, and tell me what else we already know that connects to it. Cite each file.
```
You should see: Claude runs the related command, reads the linked notes, and answers with file paths. It names no note from another company.
