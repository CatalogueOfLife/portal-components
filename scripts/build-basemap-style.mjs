#!/usr/bin/env node
// Writes basemap/style.json: the bundled basemap style with its glyph and
// sprite URLs pinned to this package version on jsDelivr. Runs as part of
// `npm run build:all`, so the published style always points at its own
// release. Non-col-browser clients (e.g. ChecklistBank) use it as a plain
// MapLibre style URL:
//   https://cdn.jsdelivr.net/npm/col-browser@<version>/basemap/style.json

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const template = readFileSync(join(ROOT, "basemap/style.template.json"), "utf8");
const assets = `https://cdn.jsdelivr.net/npm/col-browser@${version}/basemap`;
const style = JSON.parse(template.replaceAll("{{assets}}", assets));
writeFileSync(join(ROOT, "basemap/style.json"), JSON.stringify(style) + "\n");
console.log(`basemap/style.json -> ${assets}`);
