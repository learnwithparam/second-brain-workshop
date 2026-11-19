// Puts vault/ and inbox/ back to what the repo shipped, so you can run the demo again.
// It uses git, so the seed notes are never copied into a second place.
import { $ } from "bun";

await $`git checkout -- vault inbox`;
await $`git clean -fdq vault inbox`;
console.log("vault/ and inbox/ are back to the starting notes.");
