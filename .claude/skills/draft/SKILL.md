---
name: draft
description: Use when the user asks for a newsletter, post or hook for one company. Writes only from that company's good notes and cites every file.
---
# Draft from the brain

1. Name the company. Read `brands/<company>.md`.
2. Find the good notes to use: `bun run cli search --company <company> --rating good`.
3. Find the bad notes to avoid: `bun run cli search --company <company> --rating bad`.
4. For each good note you will use, run `bun run cli related --id <id> --depth 2 --company <company>`. Linked notes often hold the proof or the next point. Read them too.
5. Write the draft. Put the file path after every point, such as `[vault/ideas/learnwithparam-memory-is-files.md]`.
6. If the vault has no note for a point, leave the point out. Never invent a source.
7. End with the bad notes you avoided, and why.
