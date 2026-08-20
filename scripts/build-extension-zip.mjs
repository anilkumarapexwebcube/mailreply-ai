/**
 * Builds public/mailreply-ai-extension.zip with the production Vercel URL injected.
 * Run: node scripts/build-extension-zip.mjs
 */
import {
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  copyFileSync,
  rmSync,
  mkdirSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const extDir = join(root, "extension");
const distDir = join(root, "extension", "dist");
const API_BASE = "https://mailreplyai.vercel.app";

// 1. Build each entry as a self-contained IIFE (no shared ESM chunks, which
//    classic content/service-worker/popup scripts cannot load).
console.log("Building extension scripts with Vite...");
rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
for (const entry of ["background", "content", "popup"]) {
  try {
    execSync("npx vite build -c vite.config.extension.ts", {
      stdio: "inherit",
      cwd: root,
      env: { ...process.env, MAILREPLY_API_BASE: API_BASE, EXT_ENTRY: entry },
    });
  } catch (error) {
    console.error(`Vite build failed for entry "${entry}"!`);
    process.exit(1);
  }
}

// 2. Copy static files to dist/
const staticFiles = ["manifest.json", "popup.html", "content.css", "icon.png"];
for (const file of staticFiles) {
  try {
    copyFileSync(join(extDir, file), join(distDir, file));
  } catch (e) {
    console.warn(`Could not copy ${file}:`, e.message);
  }
}

function u16le(n) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n, 0);
  return b;
}
function u32le(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n, 0);
  return b;
}

let _crcTable = null;
function crc32Table() {
  if (_crcTable) return _crcTable;
  _crcTable = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    _crcTable[i] = c;
  }
  return _crcTable;
}
function crc32(buf) {
  const table = crc32Table();
  let crc = 0xffffffff;
  for (const byte of buf) crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(files) {
  const entries = [];
  const localParts = [];
  let offset = 0;
  for (const file of files) {
    const nameBytes = Buffer.from(file.name, "utf8");
    const crc = crc32(file.data);
    entries.push({ name: file.name, data: file.data, crc, offset });
    const local = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      u16le(20),
      u16le(0),
      u16le(0),
      u16le(0),
      u16le(0),
      u32le(crc),
      u32le(file.data.length),
      u32le(file.data.length),
      u16le(nameBytes.length),
      u16le(0),
      nameBytes,
      file.data,
    ]);
    localParts.push(local);
    offset += local.length;
  }
  const centralParts = [];
  for (const e of entries) {
    const nameBytes = Buffer.from(e.name, "utf8");
    const central = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x01, 0x02]),
      u16le(20),
      u16le(20),
      u16le(0),
      u16le(0),
      u16le(0),
      u16le(0),
      u32le(e.crc),
      u32le(e.data.length),
      u32le(e.data.length),
      u16le(nameBytes.length),
      u16le(0),
      u16le(0),
      u16le(0),
      u16le(0),
      u32le(0),
      u32le(e.offset),
      nameBytes,
    ]);
    centralParts.push(central);
  }
  const centralSize = centralParts.reduce((s, b) => s + b.length, 0);
  const eocd = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x05, 0x06]),
    u16le(0),
    u16le(0),
    u16le(entries.length),
    u16le(entries.length),
    u32le(centralSize),
    u32le(offset),
    u16le(0),
  ]);
  return Buffer.concat([...localParts, ...centralParts, eocd]);
}

const fileNames = readdirSync(distDir).filter((name) => {
  const fullPath = join(distDir, name);
  return statSync(fullPath).isFile();
});
const files = [];

for (const name of fileNames) {
  let data = readFileSync(join(distDir, name));

  if (name === "manifest.json") {
    const manifest = JSON.parse(data.toString("utf8"));
    manifest.host_permissions = [`${API_BASE}/*`, "https://web.whatsapp.com/*"];
    data = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");
  }

  files.push({ name, data });
}

const zip = buildZip(files);
const outPath = join(root, "public", "mailreply-ai-extension.zip");
writeFileSync(outPath, zip);
console.log(`✓ Extension ZIP built: ${zip.length} bytes → ${outPath}`);
console.log(`  API_BASE = ${API_BASE}`);
