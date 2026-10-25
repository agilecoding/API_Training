const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
p.title = "Hello, Server: A Journey from Telnet to Microservices";

const C = { navy: "0B1F3A", teal: "0F9D8F", amber: "F59E0B", coral: "E5484D", sky: "3B82F6", violet: "7C5CFC",
  bg: "F7F9FC", ink: "1F2937", mute: "64748B", line: "CBD5E1", white: "FFFFFF", mint: "DDF4F0", sand: "FEF3C7", rose: "FDE4E4", ice: "E0ECFF", lav: "ECE7FF" };
const F = "Calibri", M = "Consolas";
let n = 0, section = "";

function S(title, notes, o = {}) {
  const s = p.addSlide(); n++;
  s.background = { color: o.dark ? C.navy : C.bg };
  if (!o.dark) {
    s.addShape("rect", { x: 0, y: 0, w: 13.33, h: 1.0, fill: { color: C.navy } });
    s.addShape("rect", { x: 0, y: 1.0, w: 13.33, h: 0.06, fill: { color: C.teal } });
    s.addText(title, { x: 0.5, y: 0.1, w: 10.6, h: 0.8, fontFace: F, fontSize: 28, bold: true, color: C.white, valign: "middle", margin: 0 });
    if (section) s.addText(section, { x: 10.3, y: 0.1, w: 2.6, h: 0.8, fontFace: F, fontSize: 12, color: "9FB3C8", align: "right", valign: "middle", margin: 0 });
    s.addText(`${n}`, { x: 12.3, y: 7.05, w: 0.7, h: 0.3, fontFace: F, fontSize: 10, color: C.mute, align: "right", margin: 0 });
  }
  if (notes) s.addNotes(notes);
  return s;
}
const T = (s, text, x, y, w, h, o = {}) => s.addText(text, Object.assign({ x, y, w, h, fontFace: F, fontSize: 16, color: C.ink, valign: "middle", margin: 0.04 }, o));
function B(s, text, x, y, w, h, o = {}) {
  s.addText(text, Object.assign({ x, y, w, h, shape: o.round === false ? "rect" : "roundRect", rectRadius: 0.08, fill: { color: o.fill || C.white },
    line: { color: o.border || o.fill || C.line, width: 1.25 }, fontFace: F, fontSize: 14, color: C.ink, align: "center", valign: "middle", margin: 0.08 }, o, { round: undefined, border: undefined }));
}
const A = (s, x1, y1, x2, y2, color = C.mute, o = {}) => {
  s.addShape("line", Object.assign({ x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    flipH: x2 < x1, flipV: y2 < y1, line: { color, width: 2, endArrowType: "triangle" } }, o));
};
const CODE = (s, text, x, y, w, h, fs = 12) => s.addText(text, { x, y, w, h, fontFace: M, fontSize: fs, color: "E2E8F0", fill: { color: "111827" }, valign: "top", margin: 0.15, shape: "roundRect", rectRadius: 0.06 });
const TIP = (s, text, y = 6.35, fill = C.sand, bar = C.amber) => {
  s.addShape("rect", { x: 0.5, y, w: 0.09, h: 0.6, fill: { color: bar } });
  T(s, text, 0.65, y, 12.1, 0.6, { fontSize: 14, fill: { color: fill }, color: C.ink, margin: 0.12 });
};
const bullets = (s, items, x, y, w, h, fs = 18) => s.addText(items.map(t => ({ text: t, options: { bullet: { indent: 18 }, breakLine: true, paraSpaceAfter: 8 } })),
  { x, y, w, h, fontFace: F, fontSize: fs, color: C.ink, valign: "top", margin: 0.05 });
// sequence diagram: actors [{name,x}], msgs [{from,to,y,text,color}]
function seq(s, actors, msgs, top, bottom) {
  actors.forEach(a => {
    B(s, a.name, a.x - 0.9, top, 1.8, 0.55, { fill: a.fill || C.navy, color: C.white, bold: true });
    s.addShape("line", { x: a.x, y: top + 0.55, w: 0, h: bottom - top - 0.55, line: { color: C.line, width: 1.5, dashType: "dash" } });
  });
  msgs.forEach(m => {
    const x1 = actors[m.from].x, x2 = actors[m.to].x;
    A(s, x1, m.y, x2, m.y, m.color || C.teal);
    T(s, m.text, Math.min(x1, x2) + 0.1, m.y - 0.36, Math.abs(x2 - x1) - 0.2, 0.32, { fontSize: 13, align: "center", color: m.color || C.teal, bold: true });
  });
}
function quiz(title, qs, ans, notes) {
  const s = S(title, notes);
  qs.forEach((q, i) => {
    B(s, "", 0.6, 1.45 + i * 1.75, 12.1, 1.55, { fill: C.white });
    T(s, `Q${i + 1}`, 0.75, 1.55 + i * 1.75, 0.8, 0.6, { fontSize: 26, bold: true, color: C.teal });
    T(s, q.q, 1.5, 1.5 + i * 1.75, 11, 0.7, { fontSize: 19, bold: true });
    T(s, q.o, 1.5, 2.2 + i * 1.75, 11, 0.7, { fontSize: 15, color: C.mute });
  });
  s.addNotes(notes + "\n\nANSWERS: " + ans);
}
function divider(num, title, sub, notes) {
  section = title;
  const s = S(title, notes, { dark: true });
  s.addShape("rect", { x: 0.7, y: 2.2, w: 0.12, h: 2.2, fill: { color: C.teal } });
  T(s, `PART ${num}`, 1.1, 2.1, 6, 0.5, { fontSize: 16, color: C.amber, bold: true, charSpacing: 4 });
  T(s, title, 1.1, 2.6, 11, 1.1, { fontSize: 44, bold: true, color: C.white });
  T(s, sub, 1.1, 3.7, 10.5, 0.8, { fontSize: 20, color: "9FB3C8" });
  return s;
}

// ---------------- 1 TITLE ----------------
{
  const s = S("", "Welcome. Together we travel from room-sized computers to microservices, and by the end you will know why almost every API you test is a REST API over HTTP. Audience: manual testers, automation engineers and business analysts. No coding needed.", { dark: true });
  T(s, "Hello, Server", 0.8, 1.3, 11.5, 1.3, { fontSize: 72, bold: true, color: C.white });
  T(s, "A Journey from Telnet to Microservices", 0.8, 2.4, 11.5, 0.7, { fontSize: 32, bold: true, color: C.teal });
  T(s, "How computers learned to talk: protocols, HTTP, RESTful services and microservices, and why every tester needs to know the story", 0.8, 3.2, 11, 0.9, { fontSize: 24, color: "9FB3C8" });
  ["🖥️", "➜", "🌐", "➜", "🔗", "➜", "☁️"].forEach((e, i) => T(s, e, 0.8 + i * 0.95, 4.4, 0.9, 0.9, { fontSize: 40, align: "center", color: e === "➜" ? C.teal : C.white }));
  T(s, "A foundation for manual testers, automation engineers and business analysts", 0.8, 6.2, 11, 0.5, { fontSize: 16, color: C.amber });
}
// ---------------- 2 AGENDA ----------------
{
  const s = S("What we will cover", "Set expectations. Point out the quiz after each part. Mention the glossary handout.");
  const rows = [["1", "Before the Internet", "Mainframes, ARPANET, Telnet, FTP, email", C.sky],
    ["2", "TCP/IP: the rules of the road", "Layers, IP, TCP, DNS, ports", C.teal],
    ["3", "The Web and HTTP", "URLs, requests, JSON, methods, status codes, auth, HTTP versions, HTTPS", C.violet],
    ["4", "From web pages to APIs", "SOAP, REST, OpenAPI, real-world REST, GraphQL, gRPC, real-time push", C.amber],
    ["5", "Microservices", "Monolith vs services, where REST fits, events and brokers, testing", C.coral],
    ["6", "Wrap-up", "Role takeaways, hands-on next steps, Q&A", C.navy]];
  rows.forEach((r, i) => {
    const y = 1.4 + i * 0.82;
    B(s, r[0], 0.6, y, 0.7, 0.7, { fill: r[3], color: C.white, bold: true, fontSize: 24 });
    T(s, r[1], 1.5, y - 0.02, 4.2, 0.4, { fontSize: 20, bold: true });
    T(s, r[2], 1.5, y + 0.32, 8, 0.35, { fontSize: 14, color: C.mute });
  });
  TIP(s, "Goal: after this session you can read a raw HTTP request, explain why REST won, and describe how microservices talk to each other.", 6.55, C.mint, C.teal);
}

// ================= PART 1 =================
divider(1, "Before the Internet", "1950s to 1980s: islands of computing, the first connections, and the first bug");
// 4 mainframes
{
  const s = S("1950s-60s: One giant computer, many dumb screens", "Computers were room-sized, rented time. People submitted punch cards, later used 'dumb terminals' that only displayed text. All the thinking happened in the one mainframe. Analogy: a library with one librarian; everyone queues at one desk. Key point for BAs: the first 'users' were operators, no one owned a computer.");
  B(s, "🏢\nMAINFRAME\n(all processing + all data)", 5.0, 2.0, 3.3, 2.0, { fill: C.navy, color: C.white, bold: true, fontSize: 18 });
  [[0.8, 1.5], [0.8, 3.7], [10.2, 1.5], [10.2, 3.7]].forEach(([x, y], i) => {
    B(s, "🖥️\nDumb terminal", x, y, 2.3, 1.3, { fill: C.ice, border: C.sky });
    A(s, i < 2 ? x + 2.3 : x, y + 0.65, i < 2 ? 5.0 : 8.3, 3.0, C.sky);
  });
  bullets(s, ["Terminals = keyboard + screen, no brain", "Computers could not talk to each other; moving data meant carrying tapes or cards (\"sneakernet\")", "Each vendor (IBM, DEC) used its own private networking rules"], 0.8, 5.3, 11.7, 1.4, 16);
}
// 5 Packet switching
{
  const s = S("The big idea: packet switching (1960s)", "Circuit switching = phone call: a line is reserved the whole time. Packet switching = break the message into numbered envelopes; each finds its own route; reassemble at the end. Invented by Paul Baran (US) and Donald Davies (UK). It makes networks resilient: if one path fails, packets take another. This is the foundation of the Internet.");
  T(s, "Circuit switching (phone call)", 0.6, 1.3, 5.8, 0.4, { fontSize: 18, bold: true, color: C.coral });
  B(s, "A", 0.8, 2.5, 0.8, 0.8, { fill: C.coral, color: C.white, bold: true, fontSize: 22 });
  B(s, "B", 5.2, 2.5, 0.8, 0.8, { fill: C.coral, color: C.white, bold: true, fontSize: 22 });
  s.addShape("line", { x: 1.6, y: 2.9, w: 3.6, h: 0, line: { color: C.coral, width: 6 } });
  T(s, "One dedicated line, reserved for the whole call, even during silence", 0.6, 3.5, 5.8, 0.7, { fontSize: 14, color: C.mute, align: "center" });
  T(s, "Packet switching (Internet)", 6.9, 1.3, 5.8, 0.4, { fontSize: 18, bold: true, color: C.teal });
  B(s, "A", 7.0, 2.5, 0.8, 0.8, { fill: C.teal, color: C.white, bold: true, fontSize: 22 });
  B(s, "B", 12.0, 2.5, 0.8, 0.8, { fill: C.teal, color: C.white, bold: true, fontSize: 22 });
  [[9.2, 1.8], [9.2, 3.5]].forEach(([x, y]) => B(s, "router", x, y, 1.1, 0.5, { fill: C.mint, border: C.teal, fontSize: 12 }));
  A(s, 7.8, 2.8, 9.2, 2.05, C.teal); A(s, 10.3, 2.05, 12.0, 2.8, C.teal); A(s, 7.8, 3.0, 9.2, 3.75, C.teal); A(s, 10.3, 3.75, 12.0, 3.0, C.teal);
  T(s, "Message cut into numbered packets; each takes any free route", 6.9, 4.3, 5.8, 0.6, { fontSize: 14, color: C.mute, align: "center" });
  ["1", "2", "3", "4"].forEach((k, i) => B(s, k, 7.4 + i * 1.2, 5.0, 0.9, 0.5, { fill: C.sand, border: C.amber, bold: true }));
  T(s, "packets", 12.2, 5.0, 1, 0.5, { fontSize: 12, color: C.mute });
  TIP(s, "Why testers care: networks are unreliable by design. Packets get lost, delayed or reordered, so protocols must handle it. This is why timeouts and retries exist.", 6.1);
}
// 6 ARPANET
{
  const s = S("1969: ARPANET connects four computers", "On 29 Oct 1969 UCLA sent 'LOGIN' to Stanford; the system crashed after 'LO'. First message: 'LO'. By 1971 15 nodes. Funded by the US Department of Defense research agency ARPA. Note the nodes: UCLA, Stanford Research Institute, UC Santa Barbara, University of Utah.");
  const nodes = [["UCLA", 1.5, 3.2], ["Stanford (SRI)", 5.0, 1.7], ["UC Santa Barbara", 5.0, 4.7], ["Univ. of Utah", 8.5, 3.2]];
  nodes.forEach(([t, x, y]) => B(s, "🖥️\n" + t, x, y, 2.2, 1.2, { fill: C.ice, border: C.sky, bold: true }));
  A(s, 3.7, 3.6, 5.0, 2.5, C.sky); A(s, 3.7, 4.2, 5.0, 5.2, C.sky); A(s, 7.2, 2.4, 8.5, 3.5, C.sky); A(s, 7.2, 5.2, 8.5, 4.1, C.sky); A(s, 6.1, 2.9, 6.1, 4.7, C.sky);
  B(s, "29 Oct 1969\nFirst message sent: \"LO\"\n(the system crashed before \"LOGIN\" finished!)", 10.9, 2.5, 2.1, 2.4, { fill: C.sand, border: C.amber, fontSize: 13 });
  TIP(s, "The first message ever sent over a network crashed it. Arguably the first bug report in networking history.", 6.0, C.rose, C.coral);
}
// 7 Timeline
{
  const s = S("Timeline: the road to the Web", "Walk left to right quickly. Highlight 1983 as the 'birthday of the Internet' when ARPANET switched to TCP/IP. Highlight 1989-91 for the Web. Highlight 2000 for REST. Details are in the next slides.");
  s.addShape("line", { x: 0.6, y: 3.6, w: 12.1, h: 0, line: { color: C.navy, width: 4 } });
  const ev = [["1969", "ARPANET", "4 nodes", C.sky], ["1971", "Email, FTP", "", C.sky], ["1974", "TCP/IP designed", "", C.sky], ["1983", "TCP/IP switch", "Internet is born", C.teal], ["1984", "DNS", "names not numbers", C.teal], ["1991", "World Wide Web", "HTTP + HTML", C.violet], ["1996", "HTTP/1.0", "", C.violet], ["2000", "REST", "Fielding thesis", C.amber], ["2015", "gRPC / HTTP/2 / GraphQL", "", C.coral]];
  ev.forEach(([y, t, d, col], i) => {
    const x = 0.6 + i * 1.4, up = i % 2 === 0;
    s.addShape("ellipse", { x: x + 0.45, y: 3.45, w: 0.3, h: 0.3, fill: { color: col }, line: { color: C.white, width: 2 } });
    B(s, `${y}\n${t}${d ? "\n" + d : ""}`, x - 0.05, up ? 1.75 : 4.05, 1.4, 1.35, { fill: C.white, border: col, fontSize: 12, bold: false });
    s.addShape("line", { x: x + 0.6, y: up ? 3.1 : 3.75, w: 0, h: 0.35 + (up ? 0 : 0.3) - (up ? 0 : 0.3), line: { color: col, width: 1.5 } });
  });
}
// 8 Telnet FTP SMTP
{
  const s = S("Text commands out, numeric codes back","A protocol is an agreed set of rules. Telnet: log in to a remote computer and type commands as if you were sitting there. Everything including passwords was plain text, so it is insecure; replaced by SSH in 1995. FTP: move files. SMTP: send mail. All three are TEXT protocols: humans can read the conversation. Foreshadow: HTTP is also text based, and that is why we can read it.");
  s.addNotes("A protocol is an agreed set of rules. Walk the four cards left to right. Telnet (1969, port 23) is the odd one out: it has no 3-digit status codes; it negotiates options using single bytes: IAC=255, WILL=251, WONT=252, DO=253, DONT=254. Everything typed, including the password, travels as plain text. FTP (1971, ports 21/20): commands USER, PASS, RETR; replies 220 Service ready, 331 Password required, 230 Logged in, 226 Transfer complete. SMTP (email 1971, SMTP 1982, port 25): HELO, MAIL FROM, RCPT TO; replies 250 OK, 550 Mailbox unavailable. HTTP (1991, port 80/443): methods GET/POST with headers; replies 200 OK, 404 Not Found. Same recipe each time: client sends a readable text command, server answers with a number. The first digit means the same family everywhere: 2 = success, 3 = need more, 4/5 = failure. Callout for testers: when you read HTTP status codes later, you are using an idea that is 50 years old.");
  const cards = [
    ["Telnet", "1969 · port 23", "Remote login", C.sky,
      [["$ telnet host 23", "c"], ["IAC DO ECHO (255 253)", "s"], ["login: alice", "s"], ["Password: ****", "c"], ["Welcome to host", "s"], ["$ ls", "c"]],
      "Keystrokes, plus option requests: DO / DONT", "No status codes. Option bytes: IAC 255, WILL 251, DO 253, DONT 254"],
    ["FTP", "1971 · port 21", "Move files", C.teal,
      [["220 Service ready", "s"], ["USER alice", "c"], ["331 Password required", "s"], ["PASS ****", "c"], ["230 Logged in", "s"], ["RETR report.csv", "c"], ["226 Transfer complete", "s"]],
      "USER · PASS · RETR · STOR · QUIT", "220 Service ready · 331 Password required · 230 Logged in · 226 Done"],
    ["SMTP", "email 1971 · SMTP 1982 · port 25", "Send email", C.violet,
      [["220 mail.x.com ready", "s"], ["HELO client.com", "c"], ["250 OK", "s"], ["MAIL FROM:<a@x.com>", "c"], ["250 OK", "s"], ["RCPT TO:<zz@y.com>", "c"], ["550 Mailbox unavailable", "s"]],
      "HELO · MAIL FROM · RCPT TO · DATA · QUIT", "250 OK · 550 Mailbox unavailable"],
    ["HTTP", "1991 · port 80 / 443", "Fetch web pages & APIs", C.amber,
      [["GET /users/99 HTTP/1.1", "c"], ["Host: api.shop.com", "c"], ["", "c"], ["HTTP/1.1 404 Not Found", "s"], ["Content-Type: application/json", "s"], ["", "s"], ["{\"error\":\"no such user\"}", "s"]],
      "Methods GET · POST · PUT · DELETE + headers", "200 OK · 404 Not Found"]];
  s.addText([{ text: "■ client sends   ", options: { color: "3B82F6" } }, { text: "■ server replies", options: { color: "16A34A" } }], { x: 8.6, y: 1.1, w: 4.2, h: 0.3, fontFace: F, fontSize: 12, align: "right", margin: 0 });
  cards.forEach(([t, yr, d, col, lines, sends, replies], i) => {
    const x = 0.6 + i * 3.05, w = 2.95;
    B(s, t, x, 1.45, w, 0.6, { fill: col, color: C.white, bold: true, fontSize: 22, round: false });
    T(s, yr, x, 2.07, w, 0.3, { fontSize: 11, color: C.mute, align: "center" });
    T(s, d, x, 2.35, w, 0.35, { fontSize: 15, bold: true, align: "center" });
    s.addText(lines.map(([tx, who]) => ({ text: tx, options: { color: who === "c" ? "93C5FD" : "86EFAC", breakLine: true } })),
      { x, y: 2.75, w, h: 1.95, fontFace: M, fontSize: 11, fill: { color: "111827" }, valign: "top", margin: 0.1, shape: "roundRect", rectRadius: 0.06 });
    B(s, "CLIENT SENDS", x, 4.8, w, 0.28, { fill: C.ice, border: C.sky, bold: true, fontSize: 10, color: C.sky, round: false });
    T(s, sends, x, 5.08, w, 0.5, { fontSize: 12, align: "center" });
    B(s, "SERVER REPLIES", x, 5.6, w, 0.28, { fill: C.mint, border: C.teal, bold: true, fontSize: 10, color: C.teal, round: false });
    T(s, replies, x, 5.88, w, 0.6, { fontSize: 12, align: "center", bold: true });
  });
  TIP(s, "Same recipe for 50 years: text command out, number back. First digit: 2 = success, 3 = more needed, 4 or 5 = failure.", 6.52, C.mint, C.teal);
}
quiz("Knowledge check 1: before the Internet", [
  { q: "What does packet switching do differently from a phone call?", o: "A) Reserves one line  B) Splits data into packets that find their own routes  C) Needs a mainframe" },
  { q: "Why was Telnet replaced by SSH?", o: "A) It was too slow  B) It sent everything, even passwords, as plain text  C) It only worked on mainframes" },
  { q: "What do FTP, SMTP and HTTP have in common?", o: "A) Text commands from a client and numeric replies from a server  B) They all use binary only  C) They were invented in 1969" }],
  "A mini poll. Ask for a show of hands per option.".concat(""), "Q1: B. Q2: B. Q3: A.");

// ================= PART 2 =================
divider(2, "TCP/IP: the rules of the road", "Different networks, one common language");
{
  const s = S("What is a protocol? A shared language plus manners", "Use the postal-letter analogy: address format, envelope, stamps, delivery rules. Both sides must agree or nothing works. Business analysts: a protocol is like an interface contract between two systems.");
  B(s, "👩 Alice", 0.8, 1.7, 2.2, 1.2, { fill: C.ice, border: C.sky, bold: true, fontSize: 18 });
  B(s, "🧑 Bob", 10.3, 1.7, 2.2, 1.2, { fill: C.ice, border: C.sky, bold: true, fontSize: 18 });
  A(s, 3.0, 2.0, 10.3, 2.0, C.teal); A(s, 10.3, 2.6, 3.0, 2.6, C.coral);
  T(s, "\"Hello, may I have the page /home?\"", 3.3, 1.55, 6.8, 0.4, { align: "center", color: C.teal, bold: true });
  T(s, "\"OK, here it is.\" (or \"Sorry, not found\")", 3.3, 2.65, 6.8, 0.4, { align: "center", color: C.coral, bold: true });
  const rules = [["Format", "What does a message look like?"], ["Order", "Who speaks first? What comes next?"], ["Errors", "What if a message is lost or wrong?"], ["Meaning", "What does each code or word mean?"]];
  rules.forEach(([t, d], i) => { B(s, t, 0.8 + i * 3.1, 3.7, 2.9, 0.6, { fill: C.navy, color: C.white, bold: true, round: false }); B(s, d, 0.8 + i * 3.1, 4.3, 2.9, 0.9, { fill: C.white, round: false }); });
  TIP(s, "A protocol = the contract between two systems. An API is also a contract. Same idea, higher level.", 5.7, C.mint, C.teal);
}
{
  const s = S("Layers: each layer does one job", "Show the four-layer TCP/IP model. Analogy: sending a parcel. You write the letter (application), put it in a box with a tracking number (transport), the post office adds street addresses and sorting (internet), the truck drives on roads (link). Each layer only talks to the layer above and below. HTTP lives at the top. Testers: when you see 'connection refused' it is a lower layer; 404 is the top layer.");
  const L = [["Application", "HTTP, FTP, SMTP, DNS: what we want to say", C.violet, "Letter"], ["Transport", "TCP / UDP: reliable delivery, ports", C.teal, "Tracking number & box"], ["Internet", "IP: addresses and routing", C.sky, "Street addresses & sorting"], ["Link", "Wi-Fi, Ethernet: physical wires/radio", C.navy, "Delivery truck & roads"]];
  L.forEach(([t, d, col, an], i) => {
    const y = 1.45 + i * 1.15;
    B(s, t, 0.6, y, 2.6, 0.95, { fill: col, color: C.white, bold: true, fontSize: 20, round: false });
    B(s, d, 3.2, y, 5.6, 0.95, { fill: C.white, round: false, align: "left", fontSize: 16 });
    B(s, "📦 " + an, 8.8, y, 3.9, 0.95, { fill: C.sand, border: C.amber, round: false, fontSize: 15 });
  });
  T(s, "Layer", 0.6, 1.15, 2.6, 0.3, { fontSize: 12, color: C.mute, bold: true }); T(s, "What it does", 3.2, 1.15, 5, 0.3, { fontSize: 12, color: C.mute, bold: true }); T(s, "Parcel analogy", 8.8, 1.15, 3, 0.3, { fontSize: 12, color: C.mute, bold: true });
  TIP(s, "Debugging cheat code: \"connection refused / timeout\" = lower layers (network, server down). \"404 / 500\" = the application layer is answering.", 6.1);
}
{
  const s = S("OSI vs TCP/IP: 7 layers vs 4 layers", "Both models describe the same networking, with different granularity. OSI (Open Systems Interconnection) was created by ISO as a theoretical blueprint with 7 rigid, specialised layers. It is rarely implemented literally, but it is the common language network engineers use to troubleshoot: people say 'a layer 7 issue' or 'a layer 3 problem'. TCP/IP, the Internet Protocol Suite, came from DARPA and the US Department of Defense; it is pragmatic and built around the real protocols that run the Internet (TCP, IP, Ethernet). The mapping: TCP/IP Application covers OSI layers 7, 6 and 5 (application, presentation, session); in TCP/IP, formatting such as JSON, encryption such as TLS, and session handling are done by the application protocols themselves. TCP/IP Transport equals OSI layer 4; TCP and UDP behave the same in both models. TCP/IP Internet equals OSI layer 3 (network): IP addressing and routing. TCP/IP Network Access (link) covers OSI layers 2 and 1 (data link and physical): MAC addresses, framing, cables and radio. Tester takeaway: when someone says layer 7 they mean the application (HTTP, your API); layer 4 is TCP ports; layer 3 is IP and routing. Most API testing lives at layer 7.");
  T(s, "OSI MODEL  ·  ISO, 7 layers", 0.6, 1.15, 4.6, 0.28, { fontSize: 11, bold: true, color: C.mute, charSpacing: 2 });
  T(s, "TCP/IP MODEL  ·  DARPA, 4 layers", 5.5, 1.15, 3.2, 0.28, { fontSize: 11, bold: true, color: C.mute, charSpacing: 2 });
  T(s, "EXAMPLES AND JOB", 8.9, 1.15, 3.8, 0.28, { fontSize: 11, bold: true, color: C.mute, charSpacing: 2 });
  const osi = [["7", "Application", C.violet], ["6", "Presentation", "9B87FB"], ["5", "Session", "B9ABFC"], ["4", "Transport", C.teal], ["3", "Network", C.sky], ["2", "Data Link", C.navy], ["1", "Physical", "475569"]];
  const p = 0.65, y0 = 1.45;
  osi.forEach(([n_, t, col], i) => B(s, `${n_}   ${t}`, 0.6, y0 + i * p, 4.6, 0.6, { fill: col, color: C.white, bold: true, fontSize: 14, round: false, align: "left", margin: 12 }));
  const tcp = [["Application", 3, C.violet, "HTTP, FTP, DNS, SMTP, TLS, JSON. User-facing software, data formatting, encryption, sessions."], ["Transport", 1, C.teal, "TCP (reliable), UDP (fast). End-to-end delivery and flow control."], ["Internet", 1, C.sky, "IP, ICMP. Addressing and routing across networks."], ["Network Access", 2, C.navy, "Ethernet, Wi-Fi. MAC addresses, framing, bits on the wire."]];
  let r = 0;
  tcp.forEach(([t, span, col, d]) => {
    const y = y0 + r * p, h = span * p - 0.05;
    B(s, t, 5.5, y, 3.2, h, { fill: col, color: C.white, bold: true, fontSize: 16, round: false });
    B(s, d, 8.9, y, 3.8, h, { fill: C.white, border: col, fontSize: 12, round: false, align: "left", margin: 10 });
    r += span;
  });
  TIP(s, "OSI is the common language for troubleshooting (\"a layer 7 issue\"). TCP/IP is what the Internet actually runs. Your API tests live at layer 7.", 6.1);
}
{
  const s = S("Encapsulation: each layer wraps the data in its own envelope", "Encapsulation is how data travels down the stack. Each layer takes what it receives from the layer above and adds its own header (the link layer also adds a trailer), like putting a letter in an envelope, then into a box, then onto a truck. Application layer: the browser creates the HTTP request; this is just data or a message. Transport layer: TCP breaks the data into chunks and adds a header with source and destination port numbers (for example port 80 or 443), sequence numbers so the pieces can be reassembled in order, acknowledgment numbers and flow-control flags; data plus TCP header is a segment (a datagram for UDP). Internet layer: IP adds a header with source and destination IP addresses, a time-to-live (TTL) and a protocol identifier; the result is a packet. Link layer: the packet is wrapped in a frame with source and destination MAC addresses for delivery on the local network, plus a trailer, the frame check sequence (FCS), a checksum for error detection. Physical layer: the frame becomes bits sent as electrical pulses, light or radio waves. At the destination the process is reversed, called decapsulation: the link layer checks the FCS and strips its header and trailer; IP checks the destination address and strips its header; TCP uses ports and sequence numbers to reassemble the data, detect missing pieces and strip its header; finally the application receives the original HTTP message. Tester takeaway: the HTTP request you test is only the innermost payload. Tools such as Wireshark show all the layers, which helps when diagnosing network problems.");
  T(s, "LAYER", 0.6, 1.2, 2.1, 0.25, { fontSize: 10, bold: true, color: C.mute, charSpacing: 3 });
  T(s, "UNIT", 2.8, 1.2, 1.5, 0.25, { fontSize: 10, bold: true, color: C.mute, charSpacing: 3 });
  T(s, "WHAT GETS WRAPPED AROUND THE DATA", 4.45, 1.2, 5, 0.25, { fontSize: 10, bold: true, color: C.mute, charSpacing: 3 });
  T(s, "WHAT THIS LAYER ADDS", 9.85, 1.2, 3, 0.25, { fontSize: 10, bold: true, color: C.mute, charSpacing: 3 });
  const seg = { data: ["HTTP data", 1.3, C.violet], tcp: ["TCP hdr", 0.85, C.teal], ip: ["IP hdr", 0.8, C.sky], mac: ["MAC hdr", 0.95, C.navy], fcs: ["FCS", 0.6, C.mute] };
  const rows = [["Application", "Data / message", ["data"], "The HTTP request itself", C.violet],
    ["Transport (TCP)", "Segment", ["tcp", "data"], "Ports, sequence numbers, ACKs, flow control", C.teal],
    ["Internet (IP)", "Packet", ["ip", "tcp", "data"], "Source and destination IP address, TTL", C.sky],
    ["Link", "Frame", ["mac", "ip", "tcp", "data", "fcs"], "Source and destination MAC address, FCS checksum", C.navy]];
  rows.forEach(([layer, pdu, parts, adds, col], i) => {
    const y = 1.5 + i * 0.88;
    B(s, layer, 0.6, y, 2.1, 0.75, { fill: col, color: C.white, bold: true, fontSize: 14, round: false });
    B(s, pdu, 2.8, y, 1.5, 0.75, { fill: C.white, border: col, bold: true, fontSize: 13, round: false });
    let x = 4.45;
    parts.forEach(k => { const [t, w, c] = seg[k]; B(s, t, x, y, w, 0.75, { fill: c, color: C.white, bold: true, fontSize: 11, round: false, border: C.white }); x += w + 0.04; });
    T(s, adds, 9.85, y, 2.9, 0.75, { fontSize: 12, color: C.ink });
    if (i < 3) A(s, 1.65, y + 0.75, 1.65, y + 0.88, C.mute);
  });
  B(s, "Physical: bits on the wire   0101 1100 1010 ...   (electrical pulses, light, radio waves)", 0.6, 5.05, 12.1, 0.55, { fill: "111827", color: "86EFAC", fontFace: M, fontSize: 13, round: false });
  TIP(s, "The receiver reverses it (decapsulation): link checks FCS and strips its header, IP checks the address, TCP reorders by sequence number, the app reads the HTTP message.", 5.8, C.mint, C.teal);
}
{
  const s = S("Follow one request down the stack", "A worked example of encapsulation with real-looking values. You type a URL and press Enter. Step 1, application layer: the browser builds the HTTP request, for example GET /index.html HTTP/1.1 with headers such as Host, User-Agent and Cookie. It hands this down; no network headers have been added yet. Step 2, transport layer: the operating system splits the message into chunks and adds a TCP header: a source port chosen randomly by your OS (for example 51514), a destination port (443 for HTTPS or 80 for HTTP), sequence numbers and acknowledgment flags for reliable, ordered delivery. The unit is now a segment. Step 3, internet layer: IP adds a header with your source IP address and the destination server's IP address, which DNS resolved earlier, plus a TTL. The unit is now a packet. Step 4, link layer: the packet is wrapped in a frame with a MAC header and an FCS trailer for error checking. Important detail: the destination MAC address is NOT the web server; it is your local router (the next hop). MAC addresses only work on the local link and are rewritten at every hop, while the IP addresses stay the same end to end. Finally the network card turns the frame into electrical voltages on copper, pulses of light on fibre or radio waves on Wi-Fi, and the journey across the Internet begins. At the other end the process runs in reverse.");
  const st = [["1", "Application", "HTTP request", C.violet, "GET /index.html HTTP/1.1\nHost: shop.example.com\nUser-Agent: Chrome\nCookie: sid=abc123", "Still pure HTTP. No network headers yet."],
    ["2", "Transport", "TCP segment", C.teal, "Src port: 51514\n  (random, chosen by your OS)\nDst port: 443  (HTTPS)\nSeq no. + ACK flags", "Data is split into numbered chunks."],
    ["3", "Internet", "IP packet", C.sky, "Src IP: 192.168.1.10  (you)\nDst IP: 93.184.216.34\n  (found via DNS)\nTTL: 64", "End-to-end addresses: you to the server."],
    ["4", "Link", "Frame", C.navy, "Src MAC: your network card\nDst MAC: your ROUTER\n  (next hop, not the server)\nFCS: error-check trailer", "MAC is for the local hop only."]];
  st.forEach(([n_, layer, unit, col, code, note], i) => {
    const x = 0.6 + i * 3.05, w = 2.95;
    B(s, `${n_}. ${layer}`, x, 1.25, w, 0.5, { fill: col, color: C.white, bold: true, fontSize: 16, round: false });
    B(s, unit, x, 1.75, w, 0.4, { fill: C.white, bold: true, fontSize: 13, round: false });
    CODE(s, code, x, 2.25, w, 1.55, 10);
    B(s, note, x, 3.85, w, 0.55, { fill: C.bg, border: C.line, fontSize: 12, round: false, margin: 6 });
    if (i < 3) A(s, x + w, 1.5, x + w + 0.1, 1.5, C.mute);
  });
  T(s, "THE JOURNEY IN ONE LINE", 0.6, 4.6, 6, 0.26, { fontSize: 11, bold: true, color: C.teal, charSpacing: 3 });
  [["HTTP request", C.violet], ["+ TCP header\n= Segment", C.teal], ["+ IP header\n= Packet", C.sky], ["+ MAC header/trailer\n= Frame", C.navy], ["Bits on the wire\nor in the air", C.amber]].forEach(([t, col], i) => {
    const x = 0.6 + i * 2.45;
    B(s, t, x, 4.9, 2.2, 0.8, { fill: col, color: C.white, bold: true, fontSize: 12, round: false });
    if (i < 4) A(s, x + 2.2, 5.3, x + 2.45, 5.3, C.mute);
  });
  TIP(s, "IP addresses stay the same all the way to the server. MAC addresses change at every hop. The receiver reverses all this (decapsulation).", 5.95, C.sand, C.amber);
}
{
  const s = S("IP: every device gets an address; routers forward packets", "IP = Internet Protocol, 1981. Gives each device an address (IPv4 like 192.168.1.10; IPv6 for the future because IPv4 ran out of ~4.3 billion addresses). Routers read the destination and pass the packet one hop closer, like postal sorting offices. IP is best-effort: no guarantee of delivery. Ports: apartment numbers in the building. IP address picks the building, port picks the apartment/application. Port 80 HTTP, 443 HTTPS, 22 SSH.");
  B(s, "💻\n192.168.1.10", 0.6, 2.6, 2.2, 1.2, { fill: C.ice, border: C.sky, bold: true });
  [[3.6, 1.8], [5.8, 3.4], [8.0, 1.8]].forEach(([x, y]) => B(s, "router", x, y, 1.4, 0.6, { fill: C.mint, border: C.teal }));
  B(s, "🖥️ Server\n93.184.216.34", 10.3, 2.6, 2.4, 1.2, { fill: C.ice, border: C.sky, bold: true });
  A(s, 2.8, 3.0, 3.6, 2.2, C.teal); A(s, 5.0, 2.2, 5.8, 3.7, C.teal); A(s, 7.2, 3.7, 8.0, 2.4, C.teal); A(s, 9.4, 2.2, 10.3, 3.0, C.teal);
  T(s, "Each hop forwards the packet closer to the destination address", 3, 4.2, 7, 0.4, { align: "center", color: C.mute });
  B(s, "Server building 93.184.216.34", 0.8, 5.0, 6.4, 0.5, { fill: C.navy, color: C.white, bold: true, round: false });
  [["80", "HTTP"], ["443", "HTTPS"], ["22", "SSH"], ["25", "SMTP"]].forEach(([pt, nm], i) => B(s, `Port ${pt}\n${nm}`, 0.8 + i * 1.6, 5.5, 1.5, 0.9, { fill: C.sand, border: C.amber, fontSize: 13, round: false }));
  T(s, "IP address = which building.\nPort = which door (application).", 7.6, 5.0, 5.2, 1.3, { fontSize: 18, bold: true, color: C.navy });
}
{
  const s = S("TCP: reliable delivery on top of unreliable IP", "TCP = Transmission Control Protocol. Three-way handshake: SYN, SYN-ACK, ACK, then data flows. If a packet is lost, the receiver does not acknowledge it and the sender resends. Packets are numbered so they are reassembled in order. UDP skips all this: faster, no guarantees: used for video calls, games, DNS. HTTP/3 uses QUIC over UDP, we will see that later.");
  seq(s, [{ name: "Client", x: 2.0 }, { name: "Server", x: 6.0, fill: C.teal }],
    [{ from: 0, to: 1, y: 2.7, text: "SYN \"can we talk?\"" }, { from: 1, to: 0, y: 3.5, text: "SYN-ACK \"yes, ready\"", color: C.sky }, { from: 0, to: 1, y: 4.3, text: "ACK \"great, sending\"" }, { from: 0, to: 1, y: 5.1, text: "DATA (numbered)", color: C.violet }, { from: 1, to: 0, y: 5.8, text: "ACK or resend request", color: C.coral }], 1.3, 6.3);
  T(s, "TCP", 8.3, 1.4, 2.2, 0.5, { fontSize: 22, bold: true, color: C.teal });
  bullets(s, ["Handshake first", "Numbered, ordered", "Lost? Resent", "Slower, safe"], 8.3, 1.9, 2.3, 2.4, 15);
  T(s, "UDP", 10.7, 1.4, 2.2, 0.5, { fontSize: 22, bold: true, color: C.coral });
  bullets(s, ["No handshake", "No guarantee", "Fast", "Video, games, DNS"], 10.7, 1.9, 2.2, 2.4, 15);
  TIP(s, "Tester takeaway: \"Network timeout\" or \"connection reset\" errors come from this layer, not from the API's business logic.", 6.4, C.rose, C.coral);
}
{
  const s = S("DNS: the Internet's phone book (1983-84)", "Computers use numbers, humans use names. DNS translates 'example.com' to 93.184.216.34. Before DNS everyone downloaded one HOSTS.TXT file. Flow: browser asks local resolver; resolver asks root, then .com, then the domain's name server; answer is cached. Testers: wrong environment URL or stale DNS cache is a classic 'works on my machine' cause. Also note 1 Jan 1983 flag day: ARPANET switched to TCP/IP, the Internet as we know it was born.");
  seq(s, [{ name: "Browser", x: 1.6 }, { name: "DNS resolver", x: 5.2, fill: C.violet }, { name: "Web server", x: 11.2, fill: C.teal }],
    [{ from: 0, to: 1, y: 2.6, text: "Where is shop.example.com?" }, { from: 1, to: 0, y: 3.4, text: "93.184.216.34", color: C.sky }, { from: 0, to: 2, y: 4.4, text: "Now connect to 93.184.216.34 and ask for the page (HTTP)", color: C.navy }, { from: 2, to: 0, y: 5.2, text: "Here is the page", color: C.coral }], 1.3, 5.9);
  TIP(s, "1 January 1983, the \"flag day\": ARPANET switched to TCP/IP. Many historians call this the birthday of the Internet.", 6.2, C.mint, C.teal);
}
quiz("Knowledge check 2: TCP/IP", [
  { q: "Which layer decides where a packet goes: Link, Internet (IP), Transport or Application?", o: "Hint: it reads addresses, like a postal sorting office." },
  { q: "What does the TCP three-way handshake do?", o: "A) Encrypts data  B) Sets up a reliable connection (SYN, SYN-ACK, ACK)  C) Looks up names" },
  { q: "Your API call fails with \"could not resolve host\". Which service is the likely culprit?", o: "A) HTTP  B) DNS  C) JSON parser" }],
  "Pause for answers.", "Q1: Internet (IP) layer. Q2: B. Q3: B (DNS).");

// ================= PART 3 =================
divider(3, "The Web and HTTP", "1989-today: a simple idea that changed the world");
{
  const s = S("1989-91: Tim Berners-Lee invents the Web", "At CERN, Tim Berners-Lee wanted scientists to share documents easily. He combined three ideas: URL (address of anything), HTTP (how to fetch it), HTML (how to write the document with links). First website 1991 info.cern.ch. In 1993 CERN made it royalty-free. Pre-web internet was for experts using command lines (Telnet, FTP); the web made it for everyone. Point: the Web is an application on the Internet; Internet is not the Web.");
  [["URL", "Where is it?", "https://info.cern.ch/hypertext/", C.sky, "🏠"], ["HTTP", "How do I fetch it?", "GET /hypertext/ HTTP/1.1", C.teal, "🚚"], ["HTML", "What does it look like?", "<a href=\"next.html\">link</a>", C.violet, "📄"]].forEach(([t, q, ex, col, ic], i) => {
    const x = 0.7 + i * 4.15;
    B(s, ic, x, 1.5, 3.8, 1.1, { fill: col, color: C.white, fontSize: 40, round: false });
    B(s, t, x, 2.6, 3.8, 0.6, { fill: C.navy, color: C.white, bold: true, fontSize: 22, round: false });
    B(s, q, x, 3.2, 3.8, 0.7, { fill: C.white, bold: true, round: false });
    CODE(s, ex, x, 3.9, 3.8, 0.8, 12);
  });
  bullets(s, ["Before: Internet used by experts via command lines (Telnet, FTP)", "After: anyone can click a link. Internet is the road; the Web is one service that drives on it"], 0.7, 5.1, 12, 1.4, 18);
}
{
  const s = S("Anatomy of a URL", "Read a URL piece by piece. Scheme tells the protocol. Host is the server (resolved by DNS). Port is optional (80 and 443 are defaults). Path identifies the resource. Query string passes filters. Fragment is only for the browser. REST APIs lean heavily on path and query. Tester tip: path parameters identify, query parameters filter.");
  const parts = [["https", "scheme\nprotocol", C.violet, 1.3], ["://", "", C.mute, 0.8], ["api.shop.com", "host\n(DNS)", C.sky, 2.8], [":443", "port\n(optional)", C.teal, 1.4], ["/users/42/orders", "path\n(which resource)", C.amber, 3.0], ["?status=open&page=2", "query\n(filters)", C.coral, 3.3]];
  let x = 0.6;
  parts.forEach(([t, d, col, w]) => { B(s, t, x, 2.0, w, 0.9, { fill: col === C.mute ? C.bg : col, color: col === C.mute ? C.ink : C.white, bold: true, fontFace: M, fontSize: 17, line: { color: C.bg } }); if (d) T(s, d, x, 3.0, w, 0.8, { align: "center", fontSize: 14, color: col, bold: true }); x += w + 0.05; });
  bullets(s, ["Path identifies a thing: /users/42", "Query refines or filters: ?status=open", "Same URL + different HTTP method = different action (coming up)"], 0.8, 4.3, 11.5, 1.8, 18);
  TIP(s, "BA tip: URLs are the \"nouns\" of an API. Good API design starts with naming the nouns (users, orders, invoices).", 6.2, C.mint, C.teal);
}
{
  const s = S("HTTP in one picture: request and response", "HTTP is stateless request-response over TCP. The client always starts. Each request is independent; the server does not remember previous requests unless you send something like a token or cookie. Walk through the picture. In manual testing tools like Flashpost/Postman you are playing the client.");
  B(s, "💻\nClient\n(browser, mobile app, Flashpost, Karate)", 0.7, 2.2, 3.2, 2.2, { fill: C.ice, border: C.sky, bold: true, fontSize: 15 });
  B(s, "🖥️\nServer\n(web / API)", 9.4, 2.2, 3.2, 2.2, { fill: C.mint, border: C.teal, bold: true, fontSize: 15 });
  A(s, 3.9, 2.8, 9.4, 2.8, C.sky); A(s, 9.4, 3.9, 3.9, 3.9, C.coral);
  B(s, "REQUEST\nGET /users/42", 4.7, 2.0, 3.8, 0.7, { fill: C.sky, color: C.white, bold: true });
  B(s, "RESPONSE\n200 OK + {\"name\":\"Asha\"}", 4.7, 4.0, 3.8, 0.7, { fill: C.coral, color: C.white, bold: true });
  [["Stateless", "Each request stands alone"], ["Client starts", "Server only answers"], ["Text based", "Readable by humans"]].forEach(([t, d], i) => { B(s, t, 0.7 + i * 4.15, 5.2, 3.8, 0.55, { fill: C.navy, color: C.white, bold: true, round: false }); B(s, d, 0.7 + i * 4.15, 5.75, 3.8, 0.6, { fill: C.white, round: false }); });
}
{
  const s = S("Inside a request and a response", "Left: the request has a request line (method, path, version), headers (metadata) and an optional body. Right: the response has a status line (version, status code, reason), headers and a body. Blank line separates headers from body. Content-Type tells how to read the body; Authorization carries credentials; Accept says what the client wants back. Every API test you write checks these pieces: status, headers, body.");
  T(s, "REQUEST", 0.6, 1.25, 5, 0.4, { bold: true, color: C.sky, fontSize: 18 });
  CODE(s, "POST /users HTTP/1.1\nHost: api.shop.com\nContent-Type: application/json\nAccept: application/json\nAuthorization: Bearer eyJhbGci...\n\n{\n  \"name\": \"Asha\",\n  \"email\": \"asha@mail.com\"\n}", 0.6, 1.7, 6.0, 3.6, 14);
  T(s, "RESPONSE", 6.9, 1.25, 5, 0.4, { bold: true, color: C.coral, fontSize: 18 });
  CODE(s, "HTTP/1.1 201 Created\nContent-Type: application/json\nLocation: /users/43\nCache-Control: no-store\n\n{\n  \"id\": 43,\n  \"name\": \"Asha\",\n  \"email\": \"asha@mail.com\"\n}", 6.9, 1.7, 5.9, 3.6, 14);
  [["Start line", "method + path\nor status code", C.violet], ["Headers", "metadata:\ntype, auth, caching", C.teal], ["Body", "the actual data\n(JSON, XML...)", C.amber]].forEach(([t, d, col], i) => { B(s, t, 0.6 + i * 4.15, 5.5, 1.5, 0.9, { fill: col, color: C.white, bold: true, round: false }); B(s, d, 2.1 + i * 4.15, 5.5, 2.5, 0.9, { fill: C.white, round: false, fontSize: 13 }); });
}
{
  const s = S("JSON and content negotiation: the language of REST", "JSON (JavaScript Object Notation) is the text format most REST APIs use. It is lighter than XML and readable by humans. Six types: string, number, boolean, null, object and array. Go through the sample on the left and map each field to a type. Content negotiation is how client and server agree on the format: Content-Type says what I am sending, Accept says what I want back. If the server cannot produce the requested format it returns 406 Not Acceptable; if it cannot read what you sent it returns 415 Unsupported Media Type. Testers: most JSON bugs are small: trailing commas, missing quotes, null versus a missing field, and a number sent as a string.");
  CODE(s, "{\n  \"id\": 42,\n  \"name\": \"Asha\",\n  \"active\": true,\n  \"manager\": null,\n  \"roles\": [\"tester\", \"admin\"],\n  \"address\": { \"city\": \"Pune\" }\n}", 0.6, 1.3, 5.2, 3.0, 15);
  const ty = [["string", "\"Asha\"", C.sky], ["number", "42  or  9.5", C.teal], ["boolean", "true / false", C.violet], ["null", "no value", C.mute], ["object { }", "named fields", C.amber], ["array [ ]", "ordered list", C.coral]];
  ty.forEach(([t, d, col], i) => {
    const x = 6.2 + (i % 2) * 3.3, y = 1.3 + Math.floor(i / 2) * 1.02;
    B(s, t, x, y, 1.45, 0.9, { fill: col, color: C.white, bold: true, fontSize: 14, round: false });
    B(s, d, x + 1.45, y, 1.7, 0.9, { fill: C.white, fontFace: M, fontSize: 12, round: false });
  });
  T(s, "CONTENT NEGOTIATION: client and server agree on the format", 0.6, 4.5, 8, 0.28, { fontSize: 11, bold: true, color: C.teal, charSpacing: 3 });
  [["Content-Type", "what I am sending", "Content-Type: application/json", C.sky], ["Accept", "what I want back", "Accept: application/json", C.teal], ["If it fails", "server cannot comply", "406 Not Acceptable · 415 Unsupported Media Type", C.coral]].forEach(([t, d, ex, col], i) => {
    const x = 0.6 + i * 4.15;
    B(s, `${t}: ${d}`, x, 4.8, 3.95, 0.5, { fill: col, color: C.white, bold: true, fontSize: 13, round: false });
    B(s, ex, x, 5.3, 3.95, 0.55, { fill: C.white, fontFace: M, fontSize: 11, round: false });
  });
  TIP(s, "Classic JSON bugs: trailing comma, missing quotes, null vs missing field, number sent as a string (\"42\" instead of 42).", 6.1);
}
{
  const s = S("HTTP methods: the verbs", "Methods tell the server what to do with the resource. GET reads, POST creates, PUT replaces, PATCH partially updates, DELETE removes. Safe means no change to server data. Idempotent means repeating gives the same end result: calling DELETE twice leaves the thing deleted; calling POST twice creates two. This is a very common test design topic: idempotency tests, duplicate-submit tests.");
  const rows = [["Method", "Purpose", "CRUD", "Safe?", "Idempotent?", "Example"],
    ["GET", "Read", "Read", "Yes", "Yes", "GET /users/42"], ["POST", "Create / trigger", "Create", "No", "No", "POST /users"], ["PUT", "Replace whole", "Update", "No", "Yes", "PUT /users/42"],
    ["PATCH", "Change part", "Update", "No", "Not guaranteed", "PATCH /users/42"], ["DELETE", "Remove", "Delete", "No", "Yes", "DELETE /users/42"], ["HEAD / OPTIONS", "Metadata / allowed methods", "-", "Yes", "Yes", "OPTIONS /users"]];
  s.addTable(rows.map((r, i) => r.map(c => ({ text: c, options: { bold: i === 0 || false, color: i === 0 ? C.white : C.ink, fill: { color: i === 0 ? C.navy : (i % 2 ? C.white : C.ice) }, fontFace: F, fontSize: 15, align: "left", valign: "middle" } }))),
    { x: 0.6, y: 1.4, w: 12.1, colW: [1.9, 2.5, 1.2, 1.1, 2.2, 3.2], rowH: 0.52, border: { type: "solid", color: C.line, pt: 0.75 } });
  TIP(s, "Test idea: send the same POST twice. Do you get two records? Send DELETE twice. Is the second one 404 or 204? Is that what the spec says?", 5.6, C.sand, C.amber);
}
{
  const s = S("Safe, idempotent, state-changing: three different questions", "These are three separate properties; do not mix them up. Safe: the method never changes server data, it is read-only (GET, HEAD, OPTIONS). Idempotent: repeating the call gives the same end result as calling it once (GET, HEAD, OPTIONS, PUT, DELETE). State-changing: the method modifies data on the server (POST, PUT, PATCH, DELETE). Note that DELETE also changes state, and it is idempotent: deleting twice leaves the same end state. So the groups overlap: GET is safe and idempotent; PUT and DELETE change state but are idempotent; POST changes state and is not idempotent; PATCH changes state and is generally not idempotent. Walk through the three examples. POST /users sent twice creates two records with two different IDs. PUT /users/42 sent twice with the same data replaces the record twice; the final state is identical. PATCH depends on the operation: setting an email to the same value is repeatable, but an increment such as login_count +1 changes the state further each time. A word of caution: here 'stateful' only means 'changes data on the server'. HTTP itself remains a stateless protocol, which the next slides explain. Tester takeaway: send the call twice and compare the end state, not just the status code.");
  const g = [["Safe", "GET · HEAD · OPTIONS", "Read-only. Never changes server data.", C.teal],
    ["Idempotent", "GET · HEAD · OPTIONS · PUT · DELETE", "Repeat it: same end result as calling it once.", C.sky],
    ["State-changing", "POST · PUT · PATCH · DELETE", "Creates, updates or removes data on the server.", C.coral]];
  g.forEach(([t, m, d, col], i) => {
    const x = 0.6 + i * 4.15, w = 3.95;
    B(s, t, x, 1.25, w, 0.5, { fill: col, color: C.white, bold: true, fontSize: 17, round: false });
    B(s, m, x, 1.75, w, 0.45, { fill: C.white, fontFace: M, bold: true, fontSize: 12, round: false });
    B(s, d, x, 2.2, w, 0.6, { fill: C.bg, border: C.line, fontSize: 12, round: false, margin: 6 });
  });
  const c = [["POST", "Not idempotent", C.coral, "POST /users {\"name\":\"Asha\"}\n→ 201 Created  id: 43\nPOST /users {\"name\":\"Asha\"}\n→ 201 Created  id: 44", "Two records, two IDs. State grows with every call."],
    ["PUT", "Idempotent", C.teal, "PUT /users/42 {\"name\":\"Asha\"}\n→ 200 OK   (replaced)\nPUT /users/42 {\"name\":\"Asha\"}\n→ 200 OK   (same result)", "Changes state once; repeating it changes nothing more."],
    ["PATCH", "Generally not idempotent", C.amber, "PATCH /users/42\n{\"$inc\":{\"login_count\":1}}\n→ login_count: 5 → 6 → 7\n(set email twice = same)", "Depends on the operation: an increment compounds."]];
  c.forEach(([m, tag, col, code, res], i) => {
    const x = 0.6 + i * 4.15, w = 3.95;
    B(s, `${m}  ·  ${tag}`, x, 3.0, w, 0.5, { fill: col, color: C.white, bold: true, fontSize: 15, round: false });
    CODE(s, code, x, 3.5, w, 1.25, 11);
    B(s, res, x, 4.75, w, 0.65, { fill: C.white, border: col, fontSize: 12, round: false, margin: 6 });
  });
  TIP(s, "Test it: send the call twice, then compare the end state, not just the status code. (\"Stateful\" here means \"changes server data\"; HTTP itself is still stateless.)", 5.75, C.sand, C.amber);
}
{
  const s = S("Status codes: the server's answer in three digits", "First digit tells the family. 2xx success; 3xx redirect; 4xx client made a mistake; 5xx server made a mistake. Memorise the most important ones: 200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503. Teaching point: 401 is 'who are you', 403 is 'I know you but not allowed'. 4xx vs 5xx decides who to blame: very useful in defect triage.");
  const g = [["2xx", "Success", "200 OK\n201 Created\n204 No Content", C.teal], ["3xx", "Redirect", "301 Moved\n304 Not Modified", C.sky], ["4xx", "Client error\n(your request)", "400 Bad Request\n401 Unauthorized\n403 Forbidden\n404 Not Found\n409 Conflict\n422 Unprocessable\n429 Too Many Requests", C.amber], ["5xx", "Server error\n(their fault)", "500 Internal Error\n502 Bad Gateway\n503 Unavailable\n504 Timeout", C.coral]];
  g.forEach(([c, t, l, col], i) => {
    const x = 0.6 + i * 3.1;
    B(s, c, x, 1.4, 2.9, 0.9, { fill: col, color: C.white, bold: true, fontSize: 34, round: false });
    B(s, t, x, 2.3, 2.9, 0.8, { fill: C.white, bold: true, round: false });
    B(s, l, x, 3.1, 2.9, 2.4, { fill: C.white, round: false, fontSize: 14, valign: "top" });
  });
  TIP(s, "Triage rule: 4xx = look at the request or the requirement. 5xx = look at the server. 401 = who are you? 403 = I know you, but no.", 5.8, C.mint, C.teal);
}
{
  const s = S("Stateless protocol, stateful data: resolving the paradox", "Stateless is one of the founding principles that let the web scale to billions of users. Definition: each HTTP request-response pair is independent and self-contained. The server treats every request as if it has never seen the client before; it keeps no memory or session history, so every request must carry everything needed to process it: authentication token, cookie, parameters. Benefits. Scalability and simplicity: servers do not track whether you are on step 1 or step 5 of a workflow, so they do not run out of memory holding conversations for millions of users. Load balancing and fault tolerance: if Server A handles your POST and your next GET lands on Server B, nothing breaks, because no server holds exclusive memory of you. Reliability: if the network drops mid-transaction, no half-open conversation is left hanging. The apparent paradox: a POST clearly changes server state. The distinction is where the state lives. Protocol statelessness is at the network layer: the channel between client and server keeps no session memory. Application state is at the database layer: the database changes and remembers things such as a saved profile or a recorded payment. The server updates its database for one self-contained request, then the conversation is forgotten. The next slide shows how real applications add identity back with cookies, sessions and tokens.");
  s.addShape("rect", { x: 0.6, y: 1.25, w: 6.3, h: 2.5, fill: { color: C.white }, line: { color: C.line, width: 1 } });
  B(s, "Client", 0.75, 2.0, 1.1, 0.8, { fill: C.ice, border: C.sky, bold: true });
  B(s, "Load\nbalancer", 2.3, 2.0, 1.1, 0.8, { fill: C.sand, border: C.amber, bold: true, fontSize: 12 });
  B(s, "Server A", 4.1, 1.4, 1.2, 0.6, { fill: C.mint, border: C.teal, bold: true, fontSize: 12 });
  B(s, "Server B", 4.1, 2.8, 1.2, 0.6, { fill: C.mint, border: C.teal, bold: true, fontSize: 12 });
  B(s, "🗄️\nDatabase", 5.75, 2.0, 1.05, 0.8, { fill: C.lav, border: C.violet, bold: true, fontSize: 12 });
  A(s, 1.85, 2.4, 2.3, 2.4, C.sky); A(s, 3.4, 2.3, 4.1, 1.75, C.teal); A(s, 3.4, 2.5, 4.1, 3.1, C.teal); A(s, 5.3, 1.8, 5.75, 2.2, C.violet); A(s, 5.3, 3.1, 5.75, 2.7, C.violet);
  T(s, "POST /accounts → A", 2.0, 1.3, 2.2, 0.3, { fontSize: 11, color: C.teal, bold: true });
  T(s, "GET /accounts/9 → B", 2.0, 3.4, 2.3, 0.3, { fontSize: 11, color: C.teal, bold: true });
  const d = [["Stateless =", "each request-response is independent and self-contained. The server keeps no memory of earlier requests."], ["So every request carries", "what the server needs: token, cookie or parameters."]];
  d.forEach(([t, x], i) => B(s, `${t} ${x}`, 7.2, 1.25 + i * 1.3, 5.5, 1.2, { fill: i ? C.mint : C.ice, border: i ? C.teal : C.sky, fontSize: 14, round: false, margin: 10 }));
  const b = [["Scalability", "No per-user conversation to hold in memory. Free resources after each request.", C.sky], ["Load balancing", "A and B are interchangeable: any server handles any request.", C.teal], ["Reliability", "A dropped connection leaves no half-open conversation hanging.", C.violet]];
  b.forEach(([t, x, col], i) => {
    const xx = 0.6 + i * 4.15;
    B(s, t, xx, 3.95, 3.95, 0.45, { fill: col, color: C.white, bold: true, fontSize: 14, round: false });
    B(s, x, xx, 4.4, 3.95, 0.7, { fill: C.white, fontSize: 12, round: false, margin: 6 });
  });
  [["Protocol (network layer)", "The channel keeps no session memory. Stateless.", C.sky], ["Application (database layer)", "Data changes and persists: profile saved, payment recorded.", C.violet]].forEach(([t, x, col], i) => {
    const xx = 0.6 + i * 6.15;
    B(s, `${t}: ${x}`, xx, 5.25, 5.95, 0.6, { fill: C.white, border: col, fontSize: 12, round: false, margin: 8 });
  });
  TIP(s, "The server updates its database for one self-contained request, then forgets the conversation. Next: how apps add identity back.", 6.0, C.mint, C.teal);
}
{
  const s = S("HTTP is stateless, so how do apps remember you?", "Because every request stands alone, the server does not remember you. Solutions: cookies (the server hands a small token, browser sends it back every time), session IDs, bearer tokens like JWT, API keys. REST APIs prefer tokens in headers. Testers: always check what happens with missing, expired or wrong tokens.");
  seq(s, [{ name: "Client", x: 1.8 }, { name: "Server", x: 6.2, fill: C.teal }],
    [{ from: 0, to: 1, y: 2.7, text: "POST /login (user, password)" }, { from: 1, to: 0, y: 3.5, text: "200 OK + token: abc123", color: C.coral }, { from: 0, to: 1, y: 4.4, text: "GET /orders  Authorization: Bearer abc123", color: C.violet }, { from: 1, to: 0, y: 5.2, text: "200 OK + orders", color: C.coral }], 1.3, 5.8);
  T(s, "Ways to carry identity", 8.5, 1.4, 4.4, 0.5, { bold: true, fontSize: 18 });
  bullets(s, ["Cookie / session ID", "Bearer token (JWT, OAuth)", "API key header (x-api-key)", "Basic auth (user:pass)"], 8.5, 1.95, 4.3, 2.4, 16);
  TIP(s, "Security test checklist: no token (401), bad token (401), valid but not allowed (403), expired token.", 6.2, C.rose, C.coral);
}
{
  const s = S("Authentication vs authorization: who, then what", "Two different questions. Authentication: who are you? Failure gives 401 Unauthorized (the name is historical; it really means unauthenticated). Authorization: what are you allowed to do? Failure gives 403 Forbidden. Then the four common ways APIs identify callers. Basic auth: username and password Base64-encoded on every call; only safe over HTTPS. API key: a secret string identifying the calling application, usually in a header such as x-api-key. Bearer token (JWT): a signed token with three parts, header.payload.signature; the server verifies the signature and keeps no session; the payload is only encoded, not encrypted, so anyone can read it, and it has an expiry. OAuth 2.0: a framework for delegated access (for example 'Sign in with Google'); it issues short-lived access tokens, refresh tokens and scopes. OAuth is how you get a token; the token itself is often a JWT. Testers: no token, expired token, tampered token, valid token with the wrong role or scope, and another user's data.");
  [["Authentication", "Who are you?", "401 Unauthorized", C.sky], ["Authorization", "What may you do?", "403 Forbidden", C.coral]].forEach(([t, q, c, col], i) => {
    const x = 0.6 + i * 6.15;
    B(s, `${t}: ${q}   →   ${c}`, x, 1.25, 5.95, 0.65, { fill: col, color: C.white, bold: true, fontSize: 16, round: false });
  });
  const m = [["Basic auth", "Base64 of user:password on every call", "Authorization: Basic YWxpY2U6cGFzcw==", "HTTPS only. Simple but weak.", C.mute],
    ["API key", "Secret string that identifies the calling app", "x-api-key: 7f3a9c1e...", "Identifies the app, not the user.", C.sky],
    ["Bearer token (JWT)", "Signed token: header.payload.signature. Server keeps no session", "Authorization: Bearer eyJhbGciOi...", "Readable (encoded, not encrypted). Has an expiry.", C.teal],
    ["OAuth 2.0", "Delegated access, e.g. \"Sign in with Google\". Access + refresh tokens, scopes", "POST /oauth/token  →  access_token", "A way to get tokens, not a token format.", C.violet]];
  m.forEach(([t, d, ex, note, col], i) => {
    const x = 0.6 + i * 3.05, w = 2.95;
    B(s, t, x, 2.1, w, 0.55, { fill: col, color: C.white, bold: true, fontSize: 15, round: false });
    B(s, d, x, 2.65, w, 1.3, { fill: C.white, fontSize: 12, round: false, margin: 8 });
    CODE(s, ex, x, 4.05, w, 0.5, 10);
    T(s, note, x, 4.65, w, 0.75, { fontSize: 12, color: C.mute, align: "center", valign: "top" });
  });
  TIP(s, "Test list: no token (401) · expired token (401) · tampered token (401) · valid token, wrong role or scope (403) · another user's data (403/404).", 5.85, C.rose, C.coral);
}
{
  const s = S("HTTP evolves: 0.9 to 3", "HTTP/0.9 1991: only GET, only HTML. HTTP/1.0 1996: headers, status codes, other content types. HTTP/1.1 1997: persistent connections, host header, still the foundation of most APIs and the one you see in tools. HTTP/2 2015: binary, multiplexing many requests on one connection, header compression. HTTP/3 2022: runs on QUIC over UDP to avoid TCP head-of-line blocking. For a tester: the methods, status codes and headers are unchanged across versions; only the transport is faster.");
  s.addShape("line", { x: 0.7, y: 3.0, w: 11.9, h: 0, line: { color: C.navy, width: 4 } });
  [["0.9", "1991", "GET only\nHTML only", C.line], ["1.0", "1996", "Headers\nStatus codes", C.sky], ["1.1", "1997", "Keep-alive\nHost header\n(still king)", C.teal], ["2", "2015", "Binary\nMultiplexing", C.violet], ["3", "2022", "QUIC / UDP\nFaster mobile", C.coral]].forEach(([v, y, d, col], i) => {
    const x = 0.7 + i * 2.45;
    s.addShape("ellipse", { x: x + 0.85, y: 2.8, w: 0.4, h: 0.4, fill: { color: col }, line: { color: C.white, width: 2 } });
    B(s, `HTTP/${v}`, x + 0.1, 1.7, 1.9, 0.7, { fill: col, color: C.white, bold: true, fontSize: 20, round: false });
    T(s, y, x + 0.1, 3.3, 1.9, 0.4, { align: "center", bold: true, color: C.mute });
    B(s, d, x + 0.1, 3.8, 1.9, 1.2, { fill: C.white, fontSize: 13, round: false });
  });
  TIP(s, "Good news for testers: the methods, status codes and headers you learn today work the same in every version.", 5.6, C.mint, C.teal);
}
{
  const s = S("HTTPS: HTTP inside a secure tunnel (TLS)", "HTTP is plain text: anyone on the path (Wi-Fi, ISP) can read or alter it. HTTPS wraps HTTP in TLS: server proves identity with a certificate, then both sides agree on keys and encrypt. The padlock. Certificates expire: a classic production incident. For testing: use HTTPS in all non-local environments, test with expired/self-signed certs where relevant.");
  B(s, "HTTP\n(postcard: anyone can read)", 0.7, 1.7, 5.7, 1.5, { fill: C.rose, border: C.coral, bold: true, fontSize: 18 });
  B(s, "HTTPS\n(sealed, tamper-proof envelope)", 6.9, 1.7, 5.7, 1.5, { fill: C.mint, border: C.teal, bold: true, fontSize: 18 });
  [["1", "Client says hello, lists ciphers"], ["2", "Server sends certificate (proof of identity)"], ["3", "Both agree on secret keys"], ["4", "All HTTP traffic is encrypted"]].forEach(([k, t], i) => {
    B(s, k, 0.7 + i * 3.1, 3.7, 0.6, 0.6, { fill: C.teal, color: C.white, bold: true, fontSize: 20 });
    T(s, t, 1.35 + i * 3.1, 3.6, 2.4, 0.8, { fontSize: 14 });
  });
  bullets(s, ["Provides: privacy, integrity, server identity", "Port 443; certificates expire, so an expired certificate is a classic outage"], 0.7, 4.8, 12, 1.1, 17);
  TIP(s, "Real-world bug: Heartbleed (2014), a missing bounds check in OpenSSL's TLS heartbeat, let attackers read server memory. Secure protocols still need testing.", 6.1, C.rose, C.coral);
}
{
  const s = S("Each HTTP version fixed the last one's bottleneck", "Tell this as a relay race: every version solved one pain and exposed the next. 0.9 (1991): one command, GET /index.html, raw HTML back, connection closed; no headers, no status codes, text only. 1.0 (1996): headers and status codes let us send images and styles (Content-Type: image/jpeg) and report errors (200, 404); but every file needed a brand-new TCP connection. 1.1 (1997): persistent connections (Keep-Alive) and the Host header (many sites on one IP); but requests are answered one at a time, so a slow first file blocks the rest (head-of-line blocking) and browsers open about 6 parallel connections as a workaround. HTTP/2 (2015): multiplexing (many streams on one connection, binary frames) and HPACK header compression; but it still rides on TCP, so one lost packet freezes every stream. HTTP/3 (2022): QUIC over UDP, so only the affected stream pauses, and the handshake is faster. What next: QUIC tuning for 5G, satellite and moving vehicles; WebTransport (built on HTTP/3) for low-latency two-way streaming, a modern alternative to WebSockets; and research into AI-aware packet prioritisation. Treat the last one as research, not a product. Tester tip: methods, status codes and headers are the same in every version, so your API tests do not change.");
  const v = [["0.9", "1991", "One-shot fetch", C.mute, "Browser can ask for a document:\nGET /index.html", "Text only. No headers, no status codes (no 404). Connection closed after every reply."],
    ["1.0", "1996", "Multimedia update", C.sky, "Headers + status codes: images via Content-Type, errors via 200 / 404", "A new TCP connection for every file: page, each image, CSS, script."],
    ["1.1", "1997", "The workhorse", C.teal, "Keep-Alive reuses one connection. Host header: many sites on one IP", "Head-of-line blocking: requests queue one by one. Browsers open ~6 connections to cope."],
    ["2", "2015", "Speed & parallelism", C.violet, "Multiplexing: many streams on one connection. HPACK shrinks headers", "TCP head-of-line blocking: one lost packet freezes every stream."],
    ["3", "2022", "Ditch TCP for QUIC", C.coral, "QUIC over UDP: only the hit stream pauses. Faster handshake, TLS built in", "Newest: adoption still growing (details on next slide)."]];
  v.forEach(([ver, yr, nick, col, fix, bot], i) => {
    const x = 0.6 + i * 2.45, w = 2.35;
    B(s, `HTTP/${ver}  ·  ${yr}`, x, 1.3, w, 0.5, { fill: col, color: C.white, bold: true, fontSize: 16, round: false });
    B(s, nick, x, 1.8, w, 0.4, { fill: C.white, bold: true, fontSize: 13, round: false });
    T(s, "FIXED", x, 2.3, w, 0.25, { fontSize: 10, bold: true, color: C.teal, charSpacing: 3 });
    B(s, fix, x, 2.55, w, 1.35, { fill: C.mint, border: C.teal, fontSize: 12, round: false, margin: 9 });
    T(s, "NEW BOTTLENECK", x, 4.0, w, 0.25, { fontSize: 10, bold: true, color: C.coral, charSpacing: 3 });
    B(s, bot, x, 4.25, w, 1.2, { fill: C.rose, border: C.coral, fontSize: 12, round: false, margin: 9 });
    if (i < 4) A(s, x + w, 1.55, x + w + 0.1, 1.55, C.mute);
  });
  T(s, "WHAT'S NEXT", 0.6, 5.55, 3, 0.25, { fontSize: 10, bold: true, color: C.amber, charSpacing: 3 });
  [["QUIC tuning", "better congestion control for 5G, satellite, moving vehicles"], ["WebTransport", "low-latency, two-way, multi-stream on HTTP/3 (WebSockets successor)"], ["AI-aware priority", "research: favour live audio over background prefetch"]].forEach(([t, d], i) =>
    B(s, `${t}: ${d}`, 0.6 + i * 4.1, 5.82, 4.0, 0.8, { fill: C.sand, border: C.amber, fontSize: 12, round: false, margin: 8 }));
}
{
  const s = S("QUIC: the engine under HTTP/3", "QUIC began at Google and was standardised by the IETF (RFC 9000, 2021). It is now just a name, no longer treated as an acronym (it once stood for Quick UDP Internet Connections). It runs on UDP but adds the reliability TCP used to provide, plus encryption (TLS 1.3 built in) and independent streams. Three wins. 1) Independent streams: if one packet is lost, only its stream waits, fixing TCP head-of-line blocking. 2) Faster connections: transport and TLS handshake are combined (1 round trip), and returning visitors can resume with 0-RTT. 3) Connection migration: a connection is identified by a connection ID, not by IP and port, so switching from Wi-Fi to mobile data does not drop the session. Tester takeaway: the HTTP you test (methods, status codes, headers) is unchanged; if UDP is blocked, clients fall back to HTTP/2 over TCP, so test both paths.");
  const stack = (x, title, rows) => {
    T(s, title, x, 1.3, 2.6, 0.4, { fontSize: 18, bold: true, align: "center", color: C.navy });
    rows.forEach(([t, col, y, h]) => B(s, t, x, y, 2.6, h, { fill: col, color: C.white, bold: true, fontSize: 13, round: false }));
  };
  stack(0.6, "HTTP/2 stack", [["HTTP/2", C.violet, 1.8, 0.65], ["TLS (encryption)", C.sky, 2.5, 0.65], ["TCP (reliability)", C.coral, 3.2, 0.65], ["IP", C.navy, 3.9, 0.65]]);
  stack(3.4, "HTTP/3 stack", [["HTTP/3", C.violet, 1.8, 0.65], ["QUIC: streams + TLS 1.3 + loss recovery", C.teal, 2.5, 0.65], ["UDP", C.amber, 3.2, 0.65], ["IP", C.navy, 3.9, 0.65]]);
  T(s, "Same HTTP on top (methods, status codes, headers). Only the transport underneath changed.", 0.6, 4.7, 5.4, 0.7, { fontSize: 13, color: C.mute, align: "center" });
  const k = [["1", "Independent streams", "A lost packet pauses only its own stream. Others keep flowing. (Fixes TCP head-of-line blocking.)", C.teal],
    ["2", "Faster connections", "Transport + TLS handshake combined into one step (1-RTT). Returning visitors: 0-RTT.", C.sky],
    ["3", "Connection migration", "Connection ID instead of IP + port: Wi-Fi to mobile data without dropping the session.", C.violet]];
  k.forEach(([n_, t, d, col], i) => {
    const y = 1.3 + i * 1.5;
    B(s, "", 6.5, y, 6.2, 1.35, { fill: C.white, border: col });
    B(s, n_, 6.65, y + 0.2, 0.6, 0.6, { fill: col, color: C.white, bold: true, fontSize: 20 });
    T(s, t, 7.4, y + 0.1, 5.2, 0.4, { fontSize: 17, bold: true, color: C.navy });
    T(s, d, 7.4, y + 0.5, 5.2, 0.8, { fontSize: 13, color: C.ink, valign: "top" });
  });
  TIP(s, "QUIC = from Google, standardised by the IETF (RFC 9000). Testers: if UDP is blocked, clients fall back to HTTP/2 over TCP, so test both paths.", 6.1, C.mint, C.teal);
}
quiz("Knowledge check 3: HTTP", [
  { q: "Which part of a URL identifies the resource, and which part filters it?", o: "Look at: https://api.shop.com/users/42/orders?status=open" },
  { q: "A client sends valid credentials but is not permitted to delete a record. Which status code?", o: "A) 401  B) 403  C) 404  D) 500" },
  { q: "You send the same DELETE /users/42 twice. What property makes this safe to retry?", o: "A) Safe  B) Idempotent  C) Stateful" }],
  "Pause for answers.", "Q1: path /users/42/orders identifies; ?status=open filters. Q2: B 403. Q3: B Idempotent.");

// ================= PART 4 =================
{
  section = "The Web and HTTP";
  const s = S("Today: HTTP/1.1, 2 and 3 all run side by side", "The modern internet uses HTTP/2 and HTTP/3 at the same time, alongside a still-massive amount of HTTP/1.1. The transition is gradual and tiered. HTTP/1.1 is the legacy fallback, supported almost everywhere for older clients, proxies and legacy internal services. HTTP/2 is the current workhorse: deployed on the vast majority of major sites, CDNs such as Cloudflare and Akamai, and cloud providers, and it carries the bulk of standard browsing. HTTP/3 is the modern standard: widely adopted and growing fast; Google, YouTube, Meta and Cloudflare serve a large share of traffic over QUIC on UDP, and Chrome, Safari, Edge and Firefox have enabled it by default for years. Why not 100 percent HTTP/3? Older servers, firewalls and enterprise networks sometimes block or misconfigure UDP, forcing a fallback to TCP (HTTP/2 or 1.1). And processing UDP/QUIC takes slightly more server CPU than TCP, though hardware acceleration and optimisation are closing the gap. Tester tip: because clients fall back automatically, a test can pass on HTTP/2 while HTTP/3 is broken, or the reverse, so test with each version where it matters.");
  s.addShape("rect", { x: 0.55, y: 1.25, w: 6.5, h: 3.59, fill: { color: C.navy }, line: { color: C.navy } });
  s.addImage({ path: "images/http-evolution.png", x: 0.6, y: 1.3, w: 6.4, h: 3.49 });
  const tiers = [["HTTP/1.1", "Legacy fallback", "Universal fallback for older clients, proxies and legacy internal services.", C.teal],
    ["HTTP/2", "Current workhorse", "Most major sites, CDNs (Cloudflare, Akamai) and clouds. Carries the bulk of browsing today.", C.violet],
    ["HTTP/3", "Modern standard", "Growing fast: Google, YouTube, Meta and Cloudflare serve a large share over QUIC/UDP. On by default in Chrome, Safari, Edge, Firefox.", C.amber]];
  tiers.forEach(([v, role, d, col], i) => {
    const y = 1.25 + i * 1.2;
    B(s, "", 7.3, y, 5.4, 1.15, { fill: C.white, border: col });
    B(s, `${v}\n${role}`, 7.3, y, 1.55, 1.15, { fill: col, color: C.white, bold: true, fontSize: 13, round: false });
    T(s, d, 8.95, y, 3.7, 1.15, { fontSize: 12 });
  });
  T(s, "WHY NOT 100% HTTP/3 YET?", 0.6, 5.0, 6, 0.28, { fontSize: 11, bold: true, color: C.coral, charSpacing: 3 });
  [["Server & network infrastructure", "Older servers, firewalls and enterprise networks may block or misconfigure UDP, forcing fallback to TCP (HTTP/2 or 1.1)."], ["CPU overhead", "Processing UDP/QUIC takes slightly more server CPU than TCP. Hardware offload and optimisation are closing the gap."]].forEach(([t, d], i) => {
    const x = 0.6 + i * 6.15;
    B(s, "", x, 5.3, 5.95, 0.95, { fill: C.rose, border: C.coral });
    T(s, t, x + 0.15, 5.33, 5.6, 0.35, { fontSize: 14, bold: true, color: C.navy });
    T(s, d, x + 0.15, 5.65, 5.65, 0.58, { fontSize: 12, valign: "top" });
  });
  TIP(s, "Tester tip: clients fall back silently, so a test can pass over HTTP/2 while HTTP/3 is broken. Test each version where it matters.", 6.4, C.mint, C.teal);
}
divider(4, "From web pages to APIs", "Programs talking to programs: RPC, SOAP, REST, GraphQL, gRPC");
{
  const s = S("The next leap: machines, not people, as clients", "The web was built for humans with browsers. By the late 1990s businesses wanted their systems to talk to each other: payment to bank, order to warehouse. That is an API: Application Programming Interface. Analogy: a restaurant menu and waiter. You (client) order from the menu (API); the kitchen (server) stays hidden. Early attempts: RPC (call a function on another machine), CORBA, DCOM, XML-RPC, then SOAP. REST arrived in 2000 and became the default. In 2015 two newer styles appeared for specific needs: GraphQL (clients ask for exactly the fields they need) and gRPC (fast, binary, contract-first RPC over HTTP/2). We cover both later in this part.");
  B(s, "👩 Customer\n(client app)", 0.7, 2.0, 2.8, 1.6, { fill: C.ice, border: C.sky, bold: true, fontSize: 16 });
  B(s, "📋 Menu + 🧑‍🍳 Waiter\n= the API", 5.0, 2.0, 3.3, 1.6, { fill: C.sand, border: C.amber, bold: true, fontSize: 16 });
  B(s, "🍳 Kitchen\n(server, database, logic)", 9.8, 2.0, 2.9, 1.6, { fill: C.mint, border: C.teal, bold: true, fontSize: 16 });
  A(s, 3.5, 2.8, 5.0, 2.8, C.sky); A(s, 8.3, 2.8, 9.8, 2.8, C.teal);
  T(s, "You see only what the menu offers. You do not need to know how the kitchen works.", 0.7, 3.9, 12, 0.5, { fontSize: 16, align: "center", color: C.mute });
  const e = [["1980s", "RPC", "call a remote function", C.mute], ["1991", "CORBA", "heavy distributed objects", C.mute], ["1998", "XML-RPC", "XML over HTTP", C.mute], ["1998-2000", "SOAP", "XML envelope + WSDL contract", C.mute], ["2000", "REST", "use HTTP as designed", C.teal], ["2015", "GraphQL", "ask for exactly the fields you need", C.violet], ["2015", "gRPC", "fast binary RPC over HTTP/2", C.coral]];
  T(s, "HOW API STYLES EVOLVED", 0.6, 4.35, 6, 0.28, { fontSize: 11, bold: true, color: C.teal, charSpacing: 3 });
  e.forEach(([y, t, d, col], i) => { B(s, `${y}
${t}`, 0.6 + i * 1.75, 4.7, 1.65, 0.95, { fill: col === C.mute ? C.white : col, color: col === C.mute ? C.ink : C.white, bold: true, fontSize: 14, round: false }); T(s, d, 0.6 + i * 1.75, 5.7, 1.65, 0.7, { fontSize: 11, align: "center", color: C.mute, valign: "top" }); if (i < 6) A(s, 0.6 + i * 1.75 + 1.65, 5.17, 0.6 + (i + 1) * 1.75, 5.17, C.line); });
}
{
  const s = S("40 years of APIs: what it was, how it worked, the catch", "Walk the table top to bottom as a story of 40 years; each step fixed the pain of the one before. RPC (1980s): pretend the remote server is local; you called a function as if it lived on your machine; the catch was tight coupling to languages and hardware, for example a C server and a Fortran client broke. CORBA (1991): a universal enterprise standard with a central broker and rigid interface files; bloated, hard to set up and a nightmare through firewalls; it buckled under its own weight. XML-RPC (1998): let's use the web instead; the function call is wrapped in XML and sent as an HTTP POST; XML is verbose, but it proved HTTP was the right transport. SOAP (1998-2000): XML-RPC plus thousands of pages of rules: security, transactions, WSDL contracts; painfully bureaucratic, the symbol of enterprise over-engineering. REST (2000): back to simplicity; resources as nouns and HTTP verbs; intuitive, readable, scales easily, the backbone of public web and mobile APIs. GraphQL (2015): ask for exactly what you want; fixes over-fetching and under-fetching; the cost moves to the server and caching is trickier. gRPC (2015): Google's high-speed RPC; compact binary Protocol Buffers over HTTP/2; perfect for internal microservices, rarely used where humans must read the traffic.");
  const rows = [["1980s", "RPC", "\"Pretend the remote server is local\"", "Remote Procedure Call: the first attempt to run code on another computer.", "Call a function as if it lived on your machine, though it ran across the network.", "Locked to specific languages and hardware. C server + Fortran client = broken.", C.mute],
    ["1991", "CORBA", "\"Universal enterprise heavyweight\"", "Common Object Request Broker Architecture: one standard so any language talks to any language.", "A central broker plus rigid interface files translate calls between systems.", "Bloated, hard to set up, a nightmare through firewalls. Buckled under its own weight.", C.sky],
    ["1998", "XML-RPC", "\"Let's use the web instead\"", "CORBA stripped down to standard HTTP plus XML text.", "Wrap the function call in an XML document and send it as an HTTP POST.", "XML is verbose and heavy. Proved HTTP was the right transport; needed a sturdier framework.", C.teal],
    ["1998-2000", "SOAP", "\"Corporate enterprise standard\"", "Simple Object Access Protocol (neither simple nor object-based): XML-RPC plus thousands of pages of rules.", "Built-in security, transaction guarantees and auto-generated contracts (WSDL).", "Bureaucratic: a simple lookup needs a block of boilerplate XML. Symbol of over-engineering.", C.violet],
    ["2000", "REST", "\"Back to simplicity\"", "Roy Fielding's style: copy how the real World Wide Web works.", "Everything is a resource (noun). Use HTTP verbs: GET reads, POST creates, DELETE removes. Light JSON or XML.", "WHY IT WON: intuitive, human-readable, scales easily. Backbone of public web and mobile APIs.", C.amber],
    ["2015", "GraphQL", "\"Ask for exactly what you want\"", "Facebook's fix for REST over-fetching (too much data) and under-fetching (too little).", "Client sends a query describing the exact JSON shape it wants. Server returns only that.", "Pushes query parsing and optimisation onto the server. Caching is trickier than REST.", C.coral],
    ["2015", "gRPC", "\"High-speed internal microservices\"", "Google's modern RPC, built for speed and backend systems.", "Compact binary Protocol Buffers over HTTP/2. No human-readable text at all.", "WHERE IT SHINES: internal microservices. Rarely used where humans must read the traffic.", C.navy]];
  const hdr = ["Era", "What it was", "How it worked", "The catch"].map((h, i) => ({ text: h, options: { bold: true, color: C.white, fill: { color: i === 3 ? C.coral : C.navy }, fontFace: F, fontSize: 13, valign: "middle" } }));
  const body = rows.map(([yr, nm, tag, what, how, catchTx, col], i) => {
    const good = catchTx.startsWith("WHY") || catchTx.startsWith("WHERE");
    return [
      { text: [{ text: `${yr}  ${nm}\n`, options: { bold: true, fontSize: 13 } }, { text: tag, options: { fontSize: 10, italic: true } }], options: { color: C.white, fill: { color: col }, fontFace: F, valign: "middle" } },
      { text: what, options: { fontFace: F, fontSize: 11, color: C.ink, fill: { color: C.white }, valign: "middle" } },
      { text: how, options: { fontFace: F, fontSize: 11, color: C.ink, fill: { color: C.ice }, valign: "middle" } },
      { text: catchTx, options: { fontFace: F, fontSize: 11, color: C.ink, bold: good, fill: { color: good ? C.mint : C.rose }, valign: "middle" } }];
  });
  s.addTable([hdr, ...body], { x: 0.6, y: 1.25, w: 12.1, colW: [2.5, 3.0, 3.3, 3.3], rowH: [0.4, 0.66, 0.66, 0.66, 0.66, 0.66, 0.66, 0.66], margin: 5, border: { type: "solid", color: C.line, pt: 0.75 } });
  TIP(s, "Each step fixed the pain of the one before it. The pendulum swings between powerful-but-heavy and simple-but-limited.", 6.62, C.mint, C.teal);
}
{
  const s = S("SOAP: powerful, but heavy (1998-2000s)", "SOAP = Simple Object Access Protocol, though it is not simple. Messages are XML in an envelope; the contract is a WSDL file; standards like WS-Security exist. Strengths: strict contracts, enterprise security, transactions. Weaknesses: verbose, heavy tooling, hard to read and debug by hand, mostly POST to a single endpoint. Still widely used in banking, insurance, government. Testers will meet it in legacy systems.");
  T(s, "A SOAP request to get a user", 0.6, 1.25, 6, 0.4, { bold: true, color: C.violet, fontSize: 18 });
  CODE(s, "POST /UserService HTTP/1.1\nContent-Type: text/xml\nSOAPAction: \"GetUser\"\n\n<soap:Envelope xmlns:soap=\"...\">\n  <soap:Header>...</soap:Header>\n  <soap:Body>\n    <GetUser>\n      <UserId>42</UserId>\n    </GetUser>\n  </soap:Body>\n</soap:Envelope>", 0.6, 1.7, 6.6, 4.3, 14);
  T(s, "The same idea in REST", 7.6, 1.25, 5, 0.4, { bold: true, color: C.teal, fontSize: 18 });
  CODE(s, "GET /users/42 HTTP/1.1\nAccept: application/json", 7.6, 1.7, 5.1, 1.1, 14);
  bullets(s, ["Strict WSDL contract", "XML only, verbose", "Always POST to one endpoint", "Great for enterprise security & transactions", "Still alive in banking, insurance, government"], 7.6, 3.0, 5.1, 3.1, 15);
}
{
  const s = S("REST: Roy Fielding's idea (2000)", "Roy Fielding, co-author of HTTP, described REST in his PhD thesis in 2000: REpresentational State Transfer. It is NOT a protocol or a standard; it is an architectural style: a set of constraints that, when followed, make web systems scalable and simple. Walk through the six constraints. Most 'REST APIs' in the wild are 'REST-ish' (JSON over HTTP). That is fine; knowing the constraints helps to evaluate designs. Statelessness and uniform interface are the two testers meet most.");
  const c = [["Client–Server", "UI and data are separate; evolve independently", C.sky], ["Stateless", "Every request carries everything the server needs", C.teal], ["Cacheable", "Responses say if they can be reused", C.violet], ["Uniform interface", "Same verbs and URLs, resources as nouns", C.amber], ["Layered system", "Proxies, gateways, load balancers in between", C.coral], ["Code on demand", "(optional) Server can send executable code", C.mute]];
  c.forEach(([t, d, col], i) => {
    const x = 0.6 + (i % 3) * 4.15, y = 1.4 + Math.floor(i / 3) * 2.25;
    B(s, t, x, y, 3.9, 0.7, { fill: col, color: C.white, bold: true, fontSize: 19, round: false });
    B(s, d, x, y + 0.7, 3.9, 1.2, { fill: C.white, round: false, fontSize: 15 });
  });
  TIP(s, "REST is a style, not a standard. An API that follows these constraints is called RESTful.", 5.95, C.mint, C.teal);
}
{
  const s = S("REST in practice: resources are nouns, HTTP methods are verbs", "Show how one resource, 'users', maps to a handful of URL and verb combinations. This is the CRUD mapping. Resources are nouns in plural. IDs in the path. Representation is usually JSON. Status codes tell the result. Nested resources like /users/42/orders express relationships. This is exactly the structure of the Flashpost exercise API later.");
  const rows = [["Action", "Request", "Success response"], ["List users", "GET /users", "200 + array of users"], ["Read one", "GET /users/42", "200 + user (or 404)"], ["Create", "POST /users  + JSON body", "201 + Location header"], ["Replace", "PUT /users/42  + JSON body", "200 or 204"], ["Partial update", "PATCH /users/42", "200"], ["Delete", "DELETE /users/42", "204 No Content"], ["Related data", "GET /users/42/orders", "200 + orders of user 42"]];
  s.addTable(rows.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: i === 0, fontFace: j === 1 && i > 0 ? M : F, color: i === 0 ? C.white : C.ink, fill: { color: i === 0 ? C.navy : (i % 2 ? C.white : C.ice) }, fontSize: 15, valign: "middle" } }))),
    { x: 0.6, y: 1.35, w: 12.1, colW: [2.4, 5.2, 4.5], rowH: 0.5, border: { type: "solid", color: C.line, pt: 0.75 } });
  TIP(s, "Naming rule: URLs are nouns (/users), never verbs (/getUser, /deleteUser). The HTTP method carries the verb.", 5.65, C.sand, C.amber);
}
{
  const s = S("2000-2014: how REST quietly took over", "This is the missing middle of the story. In 2000 Salesforce and eBay launched some of the first commercial web APIs, mostly XML/SOAP. Amazon Web Services followed in 2002, and S3 in 2006 offered a simple REST interface. Flickr (2004) and Twitter (2006) showed that a few simple HTTP URLs returning data was enough for a whole ecosystem of apps. JSON, popularised by Douglas Crockford, replaced bulky XML. The iPhone in 2007 created huge demand for light APIs for mobile apps. Around 2011-2014 teams such as Netflix split monoliths into small services, and Martin Fowler and James Lewis published the 'Microservices' article in March 2014. Swagger (2011) became the OpenAPI standard in 2015. Dates are approximate for the first public releases; the pattern is what matters.");
  const ev = [["2000", "Salesforce & eBay launch early web APIs", "mostly XML / SOAP", C.mute], ["2002", "Amazon Web Services", "APIs as a product", C.sky], ["2004-06", "Flickr, then Twitter APIs", "simple URLs + data", C.teal], ["2006", "Amazon S3", "REST over HTTP in the cloud", C.teal],
    ["~2006", "JSON overtakes XML", "lighter, readable", C.violet], ["2007", "iPhone", "mobile apps need light APIs", C.amber], ["2011-14", "Netflix & co. split monoliths", "\"Microservices\" named (2014)", C.coral], ["2015", "Swagger becomes OpenAPI", "a standard contract for REST", C.navy]];
  ev.forEach(([y, t, d, col], i) => {
    const x = 0.6 + (i % 4) * 3.1, yy = 1.4 + Math.floor(i / 4) * 2.1;
    B(s, y, x, yy, 2.9, 0.6, { fill: col, color: C.white, bold: true, fontSize: 20, round: false });
    B(s, t, x, yy + 0.6, 2.9, 0.8, { fill: C.white, bold: true, round: false, fontSize: 14 });
    B(s, d, x, yy + 1.4, 2.9, 0.5, { fill: C.bg, border: C.line, round: false, fontSize: 12, color: C.mute });
  });
  TIP(s, "The recipe that made REST win: simple HTTP + JSON + mobile + cloud. Testers: this is why almost every API you test today looks like this.", 5.75, C.mint, C.teal);
}
{
  const s = S("Why REST won: the advantages", "Link each advantage to an audience. Simplicity and readable: testers can try with a browser or Postman. Uses existing HTTP so no new infrastructure: caching, load balancers, security work already. Stateless: easy to scale horizontally. Language neutral: any system that speaks HTTP. JSON is lighter than XML. Loose coupling and independent deployment: fits microservices. Honest limits: over/under fetching, no strict contract by default, chatty.");
  const adv = [["🧩", "Simple & familiar", "Uses plain HTTP verbs and URLs everyone already knows"], ["📖", "Human readable", "JSON, easily tested with a browser or a tool"], ["📈", "Scales easily", "Stateless: add more servers behind a load balancer"], ["⚡", "Cacheable", "Reuse responses; less load, faster"], ["🌍", "Language neutral", "Java, .NET, JS, Python, mobile: all speak HTTP"], ["🔌", "Loosely coupled", "Client and server evolve independently"]];
  adv.forEach(([ic, t, d], i) => {
    const x = 0.6 + (i % 3) * 4.15, y = 1.4 + Math.floor(i / 3) * 2.05;
    B(s, "", x, y, 3.9, 1.85, { fill: C.white });
    T(s, ic, x + 0.15, y + 0.15, 0.9, 0.9, { fontSize: 36 });
    T(s, t, x + 1.05, y + 0.15, 2.8, 0.8, { fontSize: 18, bold: true, color: C.navy });
    T(s, d, x + 0.15, y + 1.0, 3.6, 0.8, { fontSize: 14, color: C.mute, valign: "top" });
  });
  TIP(s, "Honest trade-offs: no built-in strict contract (use OpenAPI), can be chatty, over- and under-fetching of data.", 5.8, C.rose, C.coral);
}
{
  const s = S("Richardson Maturity Model: how RESTful is your API?", "Leonard Richardson's model grades APIs in four levels. Level 0: one URL, one verb (SOAP style RPC over HTTP). Level 1: separate resources (many URLs). Level 2: proper HTTP verbs and status codes: this is where most real-world 'REST APIs' stop and are perfectly good. Level 3: hypermedia (HATEOAS): responses contain links to next actions. Use it to talk with developers and BAs about expectations.");
  const lv = [["Level 3", "Hypermedia (HATEOAS)", "Responses include links to next actions", C.violet, 2.0], ["Level 2", "HTTP verbs + status codes", "GET/POST/PUT/DELETE and 200/201/404 (most real APIs)", C.teal, 3.2], ["Level 1", "Resources", "Many URLs: /users/42, /orders/7", C.sky, 4.4], ["Level 0", "One endpoint (RPC)", "Everything is POST /service", C.mute, 5.6]];
  lv.forEach(([l, t, d, col, w], i) => {
    const y = 1.4 + i * 1.15, x = 0.7 + (4 - i) * 0.0;
    B(s, l, 0.7, y, 1.6, 0.95, { fill: col, color: C.white, bold: true, fontSize: 18, round: false });
    B(s, t, 2.3, y, 3.4, 0.95, { fill: C.white, bold: true, round: false });
    B(s, d, 5.7, y, 7.0, 0.95, { fill: C.bg, border: C.line, round: false, align: "left" });
  });
  CODE(s, "{ \"id\": 42, \"name\": \"Asha\",\n  \"links\": { \"self\": \"/users/42\", \"orders\": \"/users/42/orders\" } }", 0.7, 6.05, 12.0, 0.75, 13);
}
{
  const s = S("OpenAPI: the contract for a REST API", "REST has no built-in contract, so the industry standardised how to describe one. Swagger was created in 2011; it became the OpenAPI Specification under the Linux Foundation in 2015; OpenAPI 3.0 came in 2017 and 3.1 in 2021. An OpenAPI file (YAML or JSON) lists every path, method, parameter, request body, response and status code. From that one file you get interactive documentation (Swagger UI), generated client and server code, a mock server, and automatic validation of requests and responses. Contract-first means the BA, developers and testers agree on the file before code is written. Testers: validate real responses against the contract; any drift is a bug in the API or in the contract.");
  CODE(s, "openapi: 3.0.3\ninfo: { title: User API, version: 1.0.0 }\npaths:\n  /users/{id}:\n    get:\n      summary: Get one user\n      parameters:\n        - { name: id, in: path,\n            required: true,\n            schema: { type: integer } }\n      responses:\n        '200': { description: OK }\n        '404': { description: Not found }", 0.6, 1.3, 5.9, 4.4, 13);
  const u = [["Documentation", "Interactive docs (Swagger UI) that always match the API", C.sky], ["Mock server", "Frontend and testers start before the backend exists", C.teal], ["Code generation", "Client and server stubs in many languages", C.violet], ["Validation", "Check real requests and responses against the contract", C.amber], ["Contract-first", "BA, dev and QA agree the file before code is written", C.coral]];
  u.forEach(([t, d, col], i) => {
    const y = 1.3 + i * 0.88;
    B(s, t, 6.8, y, 1.9, 0.78, { fill: col, color: C.white, bold: true, fontSize: 13, round: false });
    B(s, d, 8.7, y, 4.0, 0.78, { fill: C.white, fontSize: 12, round: false, align: "left", margin: 8 });
  });
  TIP(s, "History: Swagger (2011) → OpenAPI Initiative (2015) → OpenAPI 3.0 (2017) → 3.1 (2021). Ask for the OpenAPI file before you start testing.", 5.95, C.mint, C.teal);
}
{
  const s = S("REST in the real world: what testers hit first", "Four practical topics that appear in almost every real REST API. Versioning: APIs change, so the version is put in the URL (/v1/users, most common) or in a header; old versions must keep working until retired. Pagination: lists are returned in pages (?page=2&size=20, or a cursor); test first page, last page, empty result, a page beyond the end and a size above the limit. Rate limiting: to protect the server, too many calls get 429 Too Many Requests, usually with a Retry-After header telling you when to try again. Idempotency: GET, PUT, DELETE are idempotent, POST is not; payment APIs use an Idempotency-Key header so a retried POST does not charge twice.");
  const q = [["Versioning", "/v1/users   vs   /v2/users", "Old version must keep working. Check breaking changes.", C.sky],
    ["Pagination", "GET /users?page=2&size=20", "Test first, last, empty and out-of-range page; max size.", C.teal],
    ["Rate limiting", "429 Too Many Requests\nRetry-After: 30", "Exceed the limit, then confirm the reset and the header.", C.coral],
    ["Idempotency", "POST /payments\nIdempotency-Key: 9b1c...", "Retry the same call: one charge, not two.", C.violet]];
  q.forEach(([t, ex, test, col], i) => {
    const x = 0.6 + (i % 2) * 6.15, y = 1.3 + Math.floor(i / 2) * 2.45;
    B(s, t, x, y, 5.95, 0.6, { fill: col, color: C.white, bold: true, fontSize: 18, round: false });
    CODE(s, ex, x, y + 0.65, 5.95, 0.85, 13);
    B(s, "TEST: " + test, x, y + 1.55, 5.95, 0.65, { fill: C.white, border: col, fontSize: 13, round: false, margin: 8 });
  });
  TIP(s, "Quick win: add 429 Too Many Requests and 401/403 checks to every API test pack, not only 200 and 404.", 6.3, C.sand, C.amber);
}
{
  const s = S("REST's pain points led to GraphQL (2015)", "Facebook created GraphQL in 2012 and open-sourced in 2015 for mobile apps on slow networks. Problem 1 over-fetching: GET /users/42 returns 30 fields, you needed 2. Problem 2 under-fetching: to show a profile page you call /users/42, /users/42/orders, /orders/7/items: three round trips. GraphQL: single endpoint, the client writes a query naming exactly the fields it needs. Trade-offs: caching is harder, usually POST, often 200 OK even for errors (errors in the body), complexity on the server. Testers: assert on 'errors' array not on status code.");
  T(s, "REST: 3 calls, lots of unused data", 0.6, 1.25, 6, 0.4, { bold: true, color: C.coral, fontSize: 17 });
  B(s, "📱 App", 0.6, 2.2, 1.6, 1.1, { fill: C.ice, border: C.sky, bold: true });
  ["GET /users/42", "GET /users/42/orders", "GET /orders/7/items"].forEach((t, i) => { B(s, t, 3.0, 1.8 + i * 0.85, 2.9, 0.6, { fill: C.rose, border: C.coral, fontFace: M, fontSize: 12 }); A(s, 2.2, 2.75, 3.0, 2.1 + i * 0.85, C.coral); });
  T(s, "GraphQL: 1 call, ask only for what you need", 6.9, 1.25, 6, 0.4, { bold: true, color: C.teal, fontSize: 17 });
  B(s, "📱 App", 6.9, 2.2, 1.6, 1.1, { fill: C.ice, border: C.sky, bold: true });
  A(s, 8.5, 2.75, 9.2, 2.75, C.teal);
  CODE(s, "POST /graphql\n{ user(id: 42) {\n    name\n    orders { id total }\n} }", 9.2, 1.8, 3.6, 1.8, 12);
  CODE(s, "{ \"data\": { \"user\": { \"name\": \"Asha\",\n   \"orders\": [ {\"id\":7,\"total\":99} ] } } }", 6.9, 3.8, 5.9, 0.9, 12);
  bullets(s, ["Pros: no over/under-fetching, one endpoint, strongly typed schema", "Cons: harder caching, server complexity, often 200 even on errors (check the \"errors\" field)"], 0.6, 5.0, 12, 1.4, 16);
}
{
  const s = S("gRPC (2015): fast, typed, service-to-service", "Google open-sourced gRPC in 2015. Contract-first: you describe services and messages in a .proto file; code is generated for any language. Messages are binary (Protocol Buffers), small and fast; transport is HTTP/2 with streaming in both directions. Great between internal microservices; not browser friendly without a proxy; not human readable, so testing needs special tools (grpcurl, Postman gRPC). It is a modern version of the old RPC idea.");
  CODE(s, "// user.proto (the contract)\nservice UserService {\n  rpc GetUser (UserRequest) returns (User);\n}\nmessage UserRequest { int32 id = 1; }\nmessage User {\n  int32 id = 1;\n  string name = 2;\n}", 0.6, 1.4, 5.8, 3.4, 14);
  B(s, "Service A\n(Java)", 7.2, 1.5, 2.3, 1.1, { fill: C.ice, border: C.sky, bold: true });
  B(s, "Service B\n(Go)", 10.5, 1.5, 2.3, 1.1, { fill: C.mint, border: C.teal, bold: true });
  A(s, 9.5, 1.9, 10.5, 1.9, C.violet); A(s, 10.5, 2.3, 9.5, 2.3, C.violet);
  T(s, "binary messages over HTTP/2", 7.2, 2.7, 5.6, 0.4, { align: "center", color: C.violet, bold: true, fontSize: 14 });
  bullets(s, ["Contract first (.proto), code generated", "Binary = smaller and faster than JSON", "Streaming both ways", "Weak in browsers; hard to read by eye"], 7.2, 3.3, 5.6, 2.4, 16);
  TIP(s, "Rule of thumb: REST for public/partner APIs, gRPC for fast internal calls, GraphQL for flexible client-driven UIs.", 5.5, C.mint, C.teal);
}
{
  const s = S("After gRPC: the evolution went sideways, not forward", "Since 2015 nothing has radically replaced gRPC for backend microservices; it remains the gold standard for high-performance internal communication. Instead the evolution moved horizontally. Connect (Connect-RPC), popular around 2022-2024: browsers cannot speak full gRPC without a proxy such as Envoy, because JavaScript has no low-level control of HTTP/2 frames. Connect lets you write gRPC-style code with Protocol Buffers that runs over HTTP/1.1, HTTP/2 or HTTP/3 as ordinary fetch requests, JSON or binary, so web frontends can call gRPC backends easily. WebTransport: WebSockets suffered TCP head-of-line blocking; WebTransport is a browser API built on HTTP/3 and QUIC with two-way, multi-stream, low-latency communication for gaming, live audio and video, and collaborative tools. GraphQL has also evolved: subscriptions for live updates, and Federation, which stitches hundreds of microservices, often gRPC underneath, into one unified graph for frontends. Ecosystem today: REST and GraphQL for public web and mobile APIs; gRPC for internal microservices; Connect-RPC and WebTransport as the new additions.");
  const c = [["Connect-RPC", "gRPC for the browser", "Browsers cannot speak full gRPC without a heavy proxy (Envoy): no low-level HTTP/2 control.", "gRPC-style code with Protocol Buffers over plain HTTP/1.1, 2 or 3 as normal fetch calls (JSON or binary). Popular 2022-24.", "Browser  →  Connect  →  gRPC backend", C.sky],
    ["WebTransport", "WebSockets' successor", "WebSockets suffer TCP head-of-line blocking, a poor fit for real-time media and games.", "Browser API on HTTP/3 + QUIC: two-way, multi-stream, low-latency. Gaming, live audio/video, collaborative canvases.", "Browser  ⇄  HTTP/3 (QUIC) streams", C.violet],
    ["GraphQL Subscriptions & Federation", "the graph grows up", "One frontend needs data from hundreds of independent microservices.", "Subscriptions push live updates. Federation stitches many services (often gRPC underneath) into one graph.", "Frontend → one graph → many services", C.coral]];
  c.forEach(([t, tag, prob, what, dia, col], i) => {
    const x = 0.6 + i * 4.15, w = 3.95;
    B(s, t, x, 1.25, w, 0.65, { fill: col, color: C.white, bold: true, fontSize: 16, round: false });
    T(s, tag, x, 1.92, w, 0.3, { fontSize: 12, italic: true, color: C.mute, align: "center" });
    B(s, "THE PROBLEM", x, 2.28, w, 0.26, { fill: C.rose, border: C.coral, bold: true, fontSize: 10, color: C.coral, round: false });
    B(s, prob, x, 2.54, w, 0.8, { fill: C.white, fontSize: 12, round: false, margin: 8 });
    B(s, "WHAT IT IS", x, 3.4, w, 0.26, { fill: C.mint, border: C.teal, bold: true, fontSize: 10, color: C.teal, round: false });
    B(s, what, x, 3.66, w, 1.05, { fill: C.white, fontSize: 12, round: false, margin: 8 });
    CODE(s, dia, x, 4.8, w, 0.45, 11);
  });
  T(s, "THE ECOSYSTEM TODAY", 0.6, 5.4, 6, 0.26, { fontSize: 11, bold: true, color: C.teal, charSpacing: 3 });
  [["Public web & mobile APIs", "REST and GraphQL remain dominant", C.teal], ["Internal microservices", "gRPC: undisputed king for speed and binary efficiency", C.navy], ["New additions", "Connect-RPC (gRPC everywhere) and WebTransport (browser streaming)", C.amber]].forEach(([t, d, col], i) => {
    const x = 0.6 + i * 4.15;
    B(s, `${t}\n${d}`, x, 5.68, 3.95, 0.95, { fill: C.white, border: col, fontSize: 12, round: false, margin: 8 });
  });
}
{
  const s = S("Real-time and push: polling, webhooks, SSE, WebSockets", "Plain REST is request and response: the client always starts. Four ways to get 'push' behaviour. Polling: the client keeps asking 'anything new?'; simple but wasteful. Webhooks: you give the other system a URL; when something happens it sends an HTTP POST to you (payment succeeded, code pushed). Server-Sent Events: the browser opens one long HTTP response and the server streams events down it, one direction only (live scores, notifications). WebSockets (RFC 6455, 2011): a persistent two-way connection that starts as a normal HTTP request with an Upgrade header and the server answers 101 Switching Protocols (chat, trading, collaborative editing). Testing: these are not single request/response checks. Test connect, message order, reconnect after drop, timeouts, and for webhooks you need a receiver endpoint or a mock to capture the call.");
  const c = [["Polling", "client asks again and again", "Client → \"anything new?\"\nClient ← \"no\"\n(repeat every few seconds)", "Simple dashboards, status checks", "Wasteful: most answers are 'no'", C.mute],
    ["Webhook", "server calls YOUR URL on an event", "Server → POST /my-hook\n   {\"event\":\"payment.ok\"}", "Payments, Git pushes, alerts", "Need a receiver or mock to capture calls", C.sky],
    ["SSE", "one-way stream, server to browser", "Client → GET /events\nServer ⇒ data… data…\ntext/event-stream", "Live scores, notifications, feeds", "Check reconnect and event order", C.teal],
    ["WebSocket", "two-way, always-on connection", "GET /chat Upgrade: websocket\n101 Switching Protocols\nClient ⇄ Server", "Chat, trading, collaboration", "Test drops, reconnect, ordering", C.violet]];
  c.forEach(([t, d, ex, use, test, col], i) => {
    const x = 0.6 + i * 3.05, w = 2.95;
    B(s, t, x, 1.3, w, 0.6, { fill: col, color: C.white, bold: true, fontSize: 20, round: false });
    B(s, d, x, 1.9, w, 0.55, { fill: C.white, bold: true, fontSize: 13, round: false });
    CODE(s, ex, x, 2.55, w, 1.1, 10);
    B(s, "USED FOR", x, 4.0, w, 0.26, { fill: C.ice, border: C.sky, bold: true, fontSize: 10, color: C.sky, round: false });
    T(s, use, x, 4.28, w, 0.55, { fontSize: 12, align: "center" });
    B(s, "TEST NOTE", x, 4.9, w, 0.26, { fill: C.sand, border: C.amber, bold: true, fontSize: 10, color: C.amber, round: false });
    T(s, test, x, 5.18, w, 0.55, { fontSize: 12, align: "center" });
  });
  TIP(s, "Beyond one request, one response: you must test connection, message order, reconnects and timeouts, not just a status code.", 6.0, C.mint, C.teal);
}
{
  const s = S("Choosing: REST vs SOAP vs GraphQL vs gRPC", "Summarise. No winner: pick for context. REST is the default for most web APIs; that is why this course focuses on it and why the Flashpost/Karate material uses REST. If the audience remembers one thing: you will meet REST 80 to 90 percent of the time.");
  const rows = [["", "SOAP", "REST", "GraphQL", "gRPC"],
    ["Style", "Protocol (XML)", "Architectural style", "Query language", "RPC framework"], ["Format", "XML", "JSON (mostly)", "JSON", "Protobuf (binary)"], ["Transport", "HTTP, others", "HTTP/1.1+", "HTTP (one endpoint)", "HTTP/2"],
    ["Contract", "WSDL (strict)", "OpenAPI (optional)", "Schema (typed)", ".proto (strict)"], ["Human readable", "Hard", "Easy", "Easy", "No"], ["Best for", "Enterprise, legacy", "Public & web APIs", "Flexible UIs / mobile", "Internal microservices"], ["Tester effort", "Medium-High", "Low", "Medium", "Medium-High"]];
  s.addTable(rows.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: i === 0 || j === 0, color: i === 0 ? C.white : C.ink, fill: { color: i === 0 ? (j === 2 ? C.teal : C.navy) : (j === 2 ? C.mint : (i % 2 ? C.white : C.ice)) }, fontFace: F, fontSize: 14, valign: "middle", align: "left" } }))),
    { x: 0.6, y: 1.35, w: 12.1, colW: [2.0, 2.4, 2.6, 2.6, 2.5], rowH: 0.55, border: { type: "solid", color: C.line, pt: 0.75 } });
  TIP(s, "You will meet REST most often. That is where we will spend our hands-on time.", 6.1, C.mint, C.teal);
}
quiz("Knowledge check 4: APIs and REST", [
  { q: "Which of these is a RESTful URL design: /getUser?id=42  or  /users/42 ?", o: "Why?" },
  { q: "Which style solves \"I get 30 fields but need 2\" in one request?", o: "A) SOAP  B) GraphQL  C) Telnet" },
  { q: "True or false: REST is a protocol like HTTP.", o: "Hint: Roy Fielding, 2000." }],
  "Pause for answers.", "Q1: /users/42, nouns in URL and the method carries the verb. Q2: B. Q3: False, it is an architectural style that uses HTTP.");

// ================= PART 5 =================
divider(5, "Microservices", "How modern systems are built, and where REST fits");
{
  const s = S("Monolith vs microservices", "Monolith: one big application, one deployment, one database. Simple at first, but a small change means redeploying everything, scaling means copying everything, one bug can take down all. Microservices: many small services, each owning one business capability and its own data, deployed independently. Analogy: a department store (everything under one roof) versus a shopping street of specialised shops. Cost: more moving parts, network calls, distributed failure.");
  T(s, "Monolith", 0.6, 1.25, 5.8, 0.4, { bold: true, fontSize: 20, color: C.coral });
  B(s, "", 0.6, 1.8, 5.6, 3.4, { fill: C.rose, border: C.coral });
  ["Users", "Orders", "Payments", "Catalog"].forEach((t, i) => B(s, t, 0.9 + (i % 2) * 2.5, 2.1 + Math.floor(i / 2) * 1.0, 2.3, 0.8, { fill: C.white, border: C.coral, bold: true }));
  B(s, "🗄️ One database", 0.9, 4.2, 5.0, 0.7, { fill: C.coral, color: C.white, bold: true });
  T(s, "Microservices", 6.9, 1.25, 5.8, 0.4, { bold: true, fontSize: 20, color: C.teal });
  ["Users", "Orders", "Payments", "Catalog"].forEach((t, i) => { const x = 6.9 + (i % 2) * 3.0, y = 1.8 + Math.floor(i / 2) * 1.8; B(s, t + " service", x, y, 2.5, 0.8, { fill: C.mint, border: C.teal, bold: true }); B(s, "🗄️ own DB", x + 0.3, y + 0.85, 1.9, 0.55, { fill: C.white, border: C.line, fontSize: 12 }); });
  A(s, 9.45, 2.2, 9.85, 2.2, C.teal, { line: { color: C.teal, width: 2, beginArrowType: "triangle", endArrowType: "triangle" } });
  A(s, 9.45, 4.0, 9.85, 4.0, C.teal, { line: { color: C.teal, width: 2, beginArrowType: "triangle", endArrowType: "triangle" } });
  bullets(s, ["Monolith: simple start; one change = redeploy everything; hard to scale parts", "Microservices: small, independent, own data; scale and release separately; more moving parts"], 0.6, 5.4, 12, 1.1, 15);
}
{
  const s = S("How REST holds microservices together", "REST over HTTP is the most common way services talk. Clients (web/mobile) hit an API gateway: a single front door that authenticates, routes and rate limits. The gateway calls services via REST; services call each other via REST (synchronous) or via messages/events (asynchronous: Kafka, RabbitMQ). Each service exposes a REST contract (OpenAPI). gRPC may be used for internal high-speed calls. Because REST is stateless, any instance of a service can handle any request, so scaling is easy.");
  B(s, "🌐 Web app", 0.5, 1.5, 1.9, 0.8, { fill: C.ice, border: C.sky, bold: true }); B(s, "📱 Mobile app", 0.5, 2.5, 1.9, 0.8, { fill: C.ice, border: C.sky, bold: true }); B(s, "🤝 Partner", 0.5, 3.5, 1.9, 0.8, { fill: C.ice, border: C.sky, bold: true });
  B(s, "🚪 API Gateway\nauth · routing · rate limits", 3.4, 2.0, 2.6, 1.9, { fill: C.amber, color: C.white, bold: true, fontSize: 15 });
  [1.5, 2.5, 3.5].forEach(y => A(s, 2.4, y + 0.4, 3.4, 2.95, C.sky));
  [["Users", 1.3], ["Orders", 2.6], ["Payments", 3.9]].forEach(([t, y]) => { B(s, t + " service", 7.2, y, 2.4, 0.9, { fill: C.mint, border: C.teal, bold: true }); A(s, 6.0, 2.95, 7.2, y + 0.45, C.teal); B(s, "🗄️", 10.0, y, 0.9, 0.9, { fill: C.white, border: C.line, fontSize: 22 }); A(s, 9.6, y + 0.45, 10.0, y + 0.45, C.line); });
  A(s, 8.4, 2.2, 8.4, 2.6, C.violet); A(s, 8.4, 3.5, 8.4, 3.9, C.violet);
  B(s, "📨 Message broker (async events)", 7.2, 5.0, 4.0, 0.7, { fill: C.lav, border: C.violet, bold: true });
  T(s, "REST calls = synchronous request/response", 0.5, 4.8, 6.0, 0.4, { color: C.teal, bold: true, fontSize: 15 });
  T(s, "Events = fire and forget, processed later", 0.5, 5.2, 6.0, 0.4, { color: C.violet, bold: true, fontSize: 15 });
  TIP(s, "REST is the common language between clients and services, and often between services too. That is why API testing is the heart of microservice quality.", 6.1, C.mint, C.teal);
}
{
  const s = S("Events and message brokers: asynchronous services", "Not every service call should wait for an answer. With REST (synchronous) the caller waits and fails if the other service is down. With events (asynchronous) the producer publishes a message such as OrderPlaced to a broker (Kafka, RabbitMQ, a cloud queue) and moves on; any number of consumers pick it up when ready. Benefits: looser coupling, resilience, many consumers. Costs: eventual consistency (data is not updated everywhere instantly), duplicate or out-of-order messages, harder debugging. Use REST when you need an immediate answer; use events when the work can happen later or many services care. Testers: do not use fixed sleeps; wait or poll until the expected result appears, and test duplicates, retries and delayed consumers.");
  T(s, "Synchronous: REST calls", 0.6, 1.25, 5.8, 0.4, { fontSize: 18, bold: true, color: C.teal });
  [["Orders", 0.6], ["Payments", 2.45], ["Inventory", 4.3]].forEach(([t, x], i) => { B(s, t, x, 2.0, 1.5, 0.8, { fill: C.mint, border: C.teal, bold: true }); if (i < 2) A(s, x + 1.5, 2.4, x + 1.85, 2.4, C.teal); });
  T(s, "Caller waits for each answer. If one is down, the whole chain fails.", 0.6, 2.95, 5.8, 0.6, { fontSize: 13, color: C.mute, align: "center" });
  T(s, "Asynchronous: events", 6.9, 1.25, 5.8, 0.4, { fontSize: 18, bold: true, color: C.violet });
  B(s, "Orders\n(producer)", 6.9, 2.0, 1.5, 0.9, { fill: C.ice, border: C.sky, bold: true });
  B(s, "Message broker\nKafka · RabbitMQ\n\"OrderPlaced\"", 8.9, 1.9, 1.8, 1.1, { fill: C.lav, border: C.violet, bold: true, fontSize: 12 });
  A(s, 8.4, 2.45, 8.9, 2.45, C.violet);
  ["Payments", "Inventory", "Email"].forEach((t, i) => { B(s, t, 11.2, 1.55 + i * 0.6, 1.5, 0.5, { fill: C.mint, border: C.teal, bold: true, fontSize: 12 }); A(s, 10.7, 2.45, 11.2, 1.8 + i * 0.6, C.violet); });
  T(s, "Producer publishes and moves on. Consumers process when ready.", 6.9, 3.2, 5.8, 0.5, { fontSize: 13, color: C.mute, align: "center" });
  [["Use REST when…", "you need an immediate answer: get a user, check a price, validate a coupon.", C.teal], ["Use events when…", "work can happen later or many services care: order placed, send email, update analytics.", C.violet]].forEach(([t, d, col], i) => {
    const x = 0.6 + i * 6.15;
    B(s, t, x, 3.95, 5.95, 0.5, { fill: col, color: C.white, bold: true, fontSize: 15, round: false });
    B(s, d, x, 4.45, 5.95, 0.85, { fill: C.white, border: col, fontSize: 13, round: false, margin: 8 });
  });
  TIP(s, "New test cases: duplicate, out-of-order and delayed messages, retries, and \"eventually consistent\" data. Wait or poll for the result; never use fixed sleeps.", 5.6, C.sand, C.amber);
}
{
  const s = S("What microservices mean for testers and BAs", "Because logic is split across services, the UI tests alone are slow and fragile. Teams test most at the API layer: fast, stable, close to business rules. Test pyramid: many unit tests, many API/service tests, few UI tests. Dependencies: service A needs service B; use mocks/stubs when B is not ready or to simulate failures. Contract testing: ensure provider and consumer agree on the shape of messages so changes do not break others. BAs: requirements should describe service contracts, error cases and SLAs, not just screens.");
  const pyr = [["UI tests", "few, slow, brittle", C.coral, 3.0], ["API / service tests", "many, fast, stable ← the sweet spot", C.teal, 5.6], ["Unit tests", "most, fastest", C.sky, 8.2]];
  pyr.forEach(([t, d, col, w], i) => { const x = 0.6 + (8.2 - w) / 2 + 0.0; B(s, `${t}\n${d}`, x, 1.5 + i * 1.3, w, 1.15, { fill: col, color: C.white, bold: true, fontSize: 14, round: false }); });
  const need = [["Mocks & stubs", "Fake a dependency that is slow, unavailable or must fail on demand"], ["Contract tests", "Provider and consumer agree on the message shape"], ["Resilience cases", "Timeouts, retries, 5xx from a dependency"], ["Observability", "Trace IDs across services to find the failing hop"]];
  need.forEach(([t, d], i) => { B(s, t, 9.0, 1.5 + i * 1.0, 1.4, 0.85, { fill: C.navy, color: C.white, bold: true, fontSize: 12, round: false }); B(s, d, 10.4, 1.5 + i * 1.0, 2.5, 0.85, { fill: C.white, fontSize: 11, round: false }); });
  TIP(s, "New risk categories: partial failure, version mismatch, data consistency between services. Test them at the API layer.", 5.6, C.sand, C.amber);
}

// ================= PART 6 =================
divider(6, "Wrap-up", "What this means for your role, and where to go next");
{
  const s = S("What to take away, by role", "Close the loop per audience. Manual testers: you can now read and write raw requests. Automation engineers: automate at the API layer; REST maps cleanly to tools. BAs: write contracts and error scenarios as requirements.");
  const r = [["Manual testers", C.sky, ["Read a raw HTTP request and response", "Check status code, headers and body", "Try missing/invalid tokens, bad input, repeated calls"]], ["Automation engineers", C.teal, ["Automate at the API layer: fast and stable", "Chain calls to cover business flows", "Mock dependencies; add contract tests"]], ["Business analysts", C.violet, ["Describe resources, rules and error cases", "Agree status codes and field rules up front", "Think contract first (OpenAPI)"]]];
  r.forEach(([t, col, l], i) => { const x = 0.6 + i * 4.15; B(s, t, x, 1.4, 3.9, 0.8, { fill: col, color: C.white, bold: true, fontSize: 20, round: false }); B(s, "", x, 2.2, 3.9, 3.6, { fill: C.white, round: false }); bullets(s, l, x + 0.1, 2.35, 3.7, 3.3, 16); });
  TIP(s, "In one sentence: protocols are contracts; HTTP is the common language of the web; REST is the way we use HTTP to expose business resources; microservices are many small RESTful services.", 6.0, C.mint, C.teal);
}
{
  const s = S("Your hands-on next step: Flashpost + Karate in this kit", "Link to the repo kit: TRAINING-GUIDE.md. Learners run the sample User Management API locally (Node/Express on port 3000), practise manually with the Flashpost VS Code extension, then automate the same checks with Karate 2.1.2. The seven tiers move from a simple status check up to contract testing and mocks. Suggest doing the manual exercises first, then the automation.");
  const tiers = [["Tier 7", "Contract testing"], ["Tier 6", "Error flows with mocks"], ["Tier 5", "Mock dependencies"], ["Tier 4", "Boundary & negative data"], ["Tier 3", "Assert payload & schema"], ["Tier 2", "Chain calls into flows"], ["Tier 1", "Call it, check the status"]];
  tiers.forEach(([t, d], i) => { const w = 3.0 + i * 0.5, x = 0.6 + (6.0 - w) / 2; B(s, `${t}  ${d}`, x, 1.4 + i * 0.68, w, 0.6, { fill: [C.violet, C.violet, C.amber, C.teal, C.teal, C.sky, C.sky][i], color: C.white, bold: true, fontSize: 13, round: false }); });
  [["1", "Run the API locally", "cd user-service && npm start"], ["2", "Test by hand in Flashpost", "Tier 1 to 4 exercises"], ["3", "Automate with Karate 2.1.2", "mvn test in karate-tests"], ["4", "Keep the cheat sheet", "manual check → Karate syntax"]].forEach(([k, t, d], i) => {
    B(s, k, 7.0, 1.4 + i * 1.15, 0.7, 0.7, { fill: C.navy, color: C.white, bold: true, fontSize: 22 });
    T(s, t, 7.9, 1.35 + i * 1.15, 4.9, 0.4, { bold: true, fontSize: 17 }); T(s, d, 7.9, 1.75 + i * 1.15, 4.9, 0.4, { fontFace: M, fontSize: 13, color: C.mute });
  });
  TIP(s, "Build a firm base first: Tier 5 mocks are worthless if Tier 1 still fails. See TRAINING-GUIDE.md.", 6.2, C.sand, C.amber);
}
{
  const s = S("", "Recap the journey. Invite questions. Point to the glossary handout for the terms and status codes.", { dark: true });
  T(s, "Recap", 0.8, 0.6, 6, 0.8, { fontSize: 40, bold: true, color: C.white });
  [["1969", "Packet switching and ARPANET connect computers"], ["1983", "TCP/IP gives one language to all networks"], ["1991", "HTTP + URL + HTML create the Web"], ["2000", "REST turns HTTP into a way to expose resources"], ["Today", "Microservices talk REST (and gRPC, events); API testing is the sweet spot"]].forEach(([y, t], i) => {
    B(s, y, 0.8, 1.7 + i * 0.95, 1.5, 0.7, { fill: [C.sky, C.teal, C.violet, C.amber, C.coral][i], color: C.white, bold: true, fontSize: 20 });
    T(s, t, 2.5, 1.7 + i * 0.95, 10, 0.7, { fontSize: 20, color: C.white });
  });
  T(s, "Questions?", 0.8, 6.5, 6, 0.6, { fontSize: 26, bold: true, color: C.amber });
}
// Appendix: glossary
{
  section = "Appendix";
  const s = S("Appendix: quick glossary", "Reference slide; the full handout is in glossary-handout.html.");
  const g = [["API", "Contract that lets programs talk"], ["Protocol", "Agreed rules for exchanging messages"], ["Endpoint", "A URL + method that does something"], ["Resource", "A thing the API exposes (user, order)"], ["Payload / body", "The data in a request or response"], ["Header", "Metadata about the message"], ["Idempotent", "Repeating gives the same result"], ["Stateless", "Server keeps no memory between calls"], ["JSON", "Lightweight text data format"], ["OpenAPI", "Standard way to describe a REST API"], ["Gateway", "Single front door to many services"], ["Contract test", "Checks consumer & provider agree"]];
  g.forEach(([t, d], i) => { const x = 0.6 + (i % 2) * 6.15, y = 1.35 + Math.floor(i / 2) * 0.9; B(s, t, x, y, 1.9, 0.75, { fill: C.navy, color: C.white, bold: true, fontSize: 14, round: false }); B(s, d, x + 1.9, y, 4.1, 0.75, { fill: C.white, round: false, fontSize: 14, align: "left" }); });
}

p.writeFile({ fileName: "Hello-Server-A-Journey-from-Telnet-to-Microservices.pptx" }).then(f => console.log("wrote", f, "slides:", n));
