// Restores vault/ and inbox/ to the starting files, so you can run the demo again.
// It uses git, so there is only one copy of the starting notes.
import { $ } from "bun";

await $`git checkout -- vault inbox`;
await $`git clean -fdq vault inbox`;
console.log("vault/ and inbox/ are back to the starting notes.");
