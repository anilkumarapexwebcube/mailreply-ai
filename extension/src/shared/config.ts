// The backend origin is injected at build time by Vite's `define`
// (see vite.config.extension.ts). It is replaced with a plain string literal,
// so there is never a reference to `process` in the shipped bundle.
declare const __MAILREPLY_API_BASE__: string;

export const MAILREPLY_API_BASE: string =
  typeof __MAILREPLY_API_BASE__ !== "undefined"
    ? __MAILREPLY_API_BASE__
    : "http://localhost:3000";
