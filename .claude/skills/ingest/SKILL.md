---
name: ingest
description: Use when the user gives raw text, a link or an image to save in the second brain. Files it as a rated note for the right company.
---
# Ingest a raw item

1. Read the item. For a link, fetch it. For an image, look at it and describe the picture and its main point.
2. Pick the company. If it fits two, make one note for each.
3. Read `brands/<company>.md`. Decide `good` or `bad`, and write a one-line reason.
4. For an image, copy it to `vault/references/media/` and name the file in the note.
5. Save the note with `bun run cli add`. Link related notes with `[[id]]`. Find them with `bun run cli search --word <topic words>`, then check what they connect to with `bun run cli related --id <id>`.
6. Show a table: path, company, type, rating, reason.
