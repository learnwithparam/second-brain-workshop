---
name: research
description: Use when the user asks to research a topic and keep the good parts. Uses any search tool or MCP server that is connected, then saves only what passes the brand page.
---
# Research and keep

1. Name the company. Read `brands/<company>.md`.
2. Find sources with the search tools you have. A connected MCP server, such as a research or social search server, counts. If none is connected, open the link the user gave.
3. Keep a point only if it passes the Good list on the brand page. Drop the rest, and say why.
4. Save each kept point with `bun run cli add`, with the type `reference`. Put the source link in the body.
5. Find notes we already have with `bun run cli search --word <topic words>`. Link each new note to them with `[[id]]`, so the graph grows.
6. Show a table with the path, rating and reason. Then list what you dropped.
