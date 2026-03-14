import { cp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = resolve(fileURLToPath(new URL(".", import.meta.url)));
const repoRoot = resolve(here, "..", "..");
const src = resolve(repoRoot, "infrastructure");
const dest = resolve(repoRoot, "web", "infra-templates");

await rm(dest, { recursive: true, force: true });
await cp(src, dest, { recursive: true });
