// Minimal static server for the HTML deck. No dependencies: Node 16+.
//   npm start                 -> http://localhost:8080
//   PORT=3000 HOST=0.0.0.0 node server.js
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = path.join(__dirname, "public");

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
};
// The deck loads Carlito and Inconsolata from Google Fonts and falls back to system fonts offline.
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors *";

const gzCache = new Map(); // file path -> { mtimeMs, buf }

function send(res, status, headers, body) {
  res.writeHead(status, Object.assign({ "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" }, headers));
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { Allow: "GET, HEAD" }, "Method Not Allowed");
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { return send(res, 400, {}, "Bad Request"); }
  if (pathname === "/healthz") return send(res, 200, { "Content-Type": "text/plain" }, "ok");
  if (pathname.endsWith("/")) pathname += "index.html";

  const file = path.normalize(path.join(ROOT, pathname));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 403, {}, "Forbidden");

  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, { "Content-Type": "text/plain" }, "Not found");
    const ext = path.extname(file).toLowerCase();
    const etag = '"' + st.size.toString(16) + "-" + Math.round(st.mtimeMs).toString(16) + '"';
    const headers = {
      "Content-Type": TYPES[ext] || "application/octet-stream", ETag: etag,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=86400",
      "Content-Security-Policy": CSP,
    };
    if (req.headers["if-none-match"] === etag) return send(res, 304, headers, "");
    const compressible = /^(text\/|application\/json|image\/svg)/.test(headers["Content-Type"]);
    if (compressible && /\bgzip\b/.test(req.headers["accept-encoding"] || "")) {
      headers["Content-Encoding"] = "gzip"; headers.Vary = "Accept-Encoding";
      const hit = gzCache.get(file);
      if (hit && hit.mtimeMs === st.mtimeMs) return send(res, 200, headers, req.method === "HEAD" ? "" : hit.buf);
      return fs.readFile(file, (e, data) => {
        if (e) return send(res, 500, {}, "Server error");
        const buf = zlib.gzipSync(data, { level: 9 });
        gzCache.set(file, { mtimeMs: st.mtimeMs, buf });
        send(res, 200, headers, req.method === "HEAD" ? "" : buf);
      });
    }
    headers["Content-Length"] = st.size;
    res.writeHead(200, Object.assign({ "X-Content-Type-Options": "nosniff" }, headers));
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  });
});

server.listen(PORT, HOST, () => console.log("Hello, Server deck on http://" + (HOST === "0.0.0.0" ? "localhost" : HOST) + ":" + PORT));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
