import { createFileRoute } from "@tanstack/react-router";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

// Minimal ZIP builder using only Node built-ins (no external deps).
// Supports STORE (no compression) which is fine for a small extension bundle.
function u16le(n: number) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n, 0);
  return b;
}
function u32le(n: number) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n, 0);
  return b;
}

function crc32(buf: Buffer): number {
  const table = crc32Table();
  let crc = 0xffffffff;
  for (const byte of buf) crc = (crc >>> 8) ^ (table[(crc ^ byte) & 0xff] as number);
  return (crc ^ 0xffffffff) >>> 0;
}

let _crcTable: number[] | null = null;
function crc32Table(): number[] {
  if (_crcTable) return _crcTable;
  _crcTable = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    _crcTable[i] = c;
  }
  return _crcTable;
}

interface ZipEntry {
  name: string;
  data: Buffer;
  crc: number;
  offset: number;
}

function buildZip(files: { name: string; data: Buffer }[]): Buffer {
  const entries: ZipEntry[] = [];
  const localParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = Buffer.from(file.name, "utf8");
    const crc = crc32(file.data);
    entries.push({ name: file.name, data: file.data, crc, offset });

    // Local file header
    const local = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]), // signature
      u16le(20), // version needed
      u16le(0), // flags
      u16le(0), // compression: STORE
      u16le(0),
      u16le(0), // mod time/date
      u32le(crc),
      u32le(file.data.length),
      u32le(file.data.length),
      u16le(nameBytes.length),
      u16le(0), // extra field len
      nameBytes,
      file.data,
    ]);
    localParts.push(local);
    offset += local.length;
  }

  const centralParts: Buffer[] = [];
  let centralOffset = offset;

  for (const e of entries) {
    const nameBytes = Buffer.from(e.name, "utf8");
    const central = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x01, 0x02]), // signature
      u16le(20),
      u16le(20),
      u16le(0),
      u16le(0), // compression: STORE
      u16le(0),
      u16le(0), // mod time/date
      u32le(e.crc),
      u32le(e.data.length),
      u32le(e.data.length),
      u16le(nameBytes.length),
      u16le(0),
      u16le(0),
      u16le(0),
      u16le(0), // disk / attrs
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
    u32le(centralOffset),
    u16le(0),
  ]);

  return Buffer.concat([...localParts, ...centralParts, eocd]);
}

export const Route = createFileRoute("/api/public/download-extension")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const reqUrl = new URL(request.url);
        const apiBase = `${reqUrl.protocol}//${reqUrl.host}`;

        // On Vercel (and any deployed environment), the extension/ source directory
        // is not available in the server runtime. Serve the pre-built static zip
        // directly from /public, which Vercel hosts as a static asset.
        // In local dev, we still build dynamically so the correct localhost URL
        // gets injected into background.js / config.js / manifest.json.
        const isProduction = !!process.env['VERCEL'] || process.env['NODE_ENV'] === 'production';

        if (isProduction) {
          // Redirect to the static pre-built zip served from /public
          return new Response(null, {
            status: 302,
            headers: {
              Location: `${apiBase}/mailreply-ai-extension.zip`,
            },
          });
        }

        // ── Local dev: build ZIP dynamically so localhost URL is injected ──
        const extensionDir = join(process.cwd(), "extension");
        const fileNames = await readdir(extensionDir);

        const files: { name: string; data: Buffer }[] = [];

        for (const name of fileNames) {
          let data = await readFile(join(extensionDir, name));

          // Inject the correct API base URL into background.js and config.js
          if (name === "background.js" || name === "config.js") {
            const text = data
              .toString("utf8")
              .replace(
                /const MAILREPLY_API_BASE\s*=\s*["'][^"']*["']/g,
                `const MAILREPLY_API_BASE = "${apiBase}"`,
              );
            data = Buffer.from(text, "utf8");
          }

          // Inject the correct host_permissions into manifest.json
          if (name === "manifest.json") {
            const manifest = JSON.parse(data.toString("utf8")) as {
              host_permissions?: string[];
              [key: string]: unknown;
            };
            manifest.host_permissions = [`${apiBase}/*`];
            data = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");
          }

          files.push({ name, data });
        }

        const zip = buildZip(files);

        return new Response(zip as unknown as BodyInit, {
          status: 200,
          headers: {
            "content-type": "application/zip",
            "content-disposition": 'attachment; filename="mailreply-ai-extension.zip"',
            "content-length": String(zip.length),
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
