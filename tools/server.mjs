import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".png": "image/png",
  ".ogg": "audio/ogg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
};
http
  .createServer((req, res) => {
    try {
      const url = new URL(req.url, "http://localhost"),
        rel = decodeURIComponent(url.pathname);
      if (!(rel === "/" || rel === "/index.html" || rel.startsWith("/src/") || rel.startsWith("/assets/"))) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      let file = path.resolve(root, rel === "/" ? "index.html" : "." + rel);
      if (rel.startsWith("/assets/"))
        file = path.resolve(root, "public", "." + rel);
      const contentRoot = rel.startsWith("/assets/")
        ? path.join(root, "public", "assets")
        : rel.startsWith("/src/") ? path.join(root, "src") : null;
      if (
        (contentRoot ? !file.startsWith(contentRoot + path.sep) : file !== path.join(root, "index.html")) ||
        !fs.existsSync(file) ||
        !fs.statSync(file).isFile() ||
        (contentRoot && !fs.realpathSync(file).startsWith(contentRoot + path.sep))
      ) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.setHeader(
        "Content-Type",
        mime[path.extname(file)] || "application/octet-stream",
      );
      res.setHeader("Cache-Control", "no-cache");
      fs.createReadStream(file).pipe(res);
    } catch (e) {
      res.writeHead(400);
      res.end("Bad request");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Loopit Car Game: http://127.0.0.1:${port}`),
  );
