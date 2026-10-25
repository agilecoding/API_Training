# Hello, Server: HTML deck

A self-contained HTML version of the PPTX deck: 64 slides, animated diagrams, speaker notes, outline, keyboard and swipe navigation. It is a backup to `Hello-Server-A-Journey-from-Telnet-to-Microservices.pptx` and is generated from the same slide definitions.

## Run it on Node.js

```bash
cd html-deck
npm start                      # http://localhost:8080
PORT=3000 HOST=0.0.0.0 node server.js
```

`server.js` has no dependencies (Node 16+). It serves `public/`, gzips text, sends ETag and CSP headers, blocks path traversal and exposes `/healthz`.

### Already have an Express app?

Copy `public/index.html` into your static folder:

```js
app.use("/deck", express.static(path.join(__dirname, "public")));
```

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

Behind nginx or a load balancer, proxy to the Node port and use `/healthz` for health checks.

## Using the deck

| Key | Action |
|---|---|
| Right arrow, Space, Page Down | Next slide |
| Left arrow, Page Up | Previous slide |
| N | Speaker notes |
| O | Outline (jump to any slide) |
| F | Full screen |
| R | Replay the slide's animation |
| ? | Shortcut help |

Every slide has a link such as `index.html#s26`. On touch screens, swipe left or right.

The deck loads the Carlito and Inconsolata fonts from Google Fonts and falls back to Calibri and Consolas when offline.

## Regenerate

From the parent `presentation/` folder, after editing `build.js`:

```bash
node build.js        # PPTX
node build-html.js   # html-deck/public/index.html
```
