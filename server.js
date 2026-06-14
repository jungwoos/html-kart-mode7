"use strict";
/* ============================================================
   HTML 카트 Mode 7 — 단일 Render 서비스
   (1) public/ 정적 파일 서빙 (게임 화면)
   (2) 같은 포트에서 WebSocket 멀티플레이 중계
   클라이언트와 서버가 같은 오리진(HTTPS) → 기울기 센서 OK, 서버 주소 입력 불필요.
   Render Web Service(무료). PORT는 환경변수로 주입됨.
   ============================================================ */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, "public");
const COLORS = ["#ff5252","#4fc3f7","#ffd23f","#69f0ae","#b388ff","#ff80ab","#ffab40","#80d8ff"];
const MAX_PER_ROOM = 8;
const MIME = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".css":"text/css",
  ".json":"application/json", ".png":"image/png", ".jpg":"image/jpeg", ".svg":"image/svg+xml",
  ".ico":"image/x-icon" };

// ---------- 정적 파일 서버 ----------
const server = http.createServer((req, res) => {
  if (req.url === "/healthz") { res.writeHead(200); res.end("ok"); return; }
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(PUBLIC_DIR, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ""));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end("forbidden"); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
});

// ---------- WebSocket 멀티플레이 중계 ----------
const wss = new WebSocketServer({ server });
const rooms = new Map();   // code -> Map(id -> { ws, info })
let nextId = 1;

function roomOf(code) {
  if (!rooms.has(code)) rooms.set(code, new Map());
  return rooms.get(code);
}
function broadcast(room, msg, exceptId) {
  const s = JSON.stringify(msg);
  room.forEach((client, id) => {
    if (id !== exceptId && client.ws.readyState === 1) client.ws.send(s);
  });
}

wss.on("connection", (ws) => {
  let id = null, room = null, roomCode = null, info = null;
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });

  ws.on("message", (data) => {
    let m;
    try { m = JSON.parse(data); } catch (e) { return; }

    if (m.type === "join") {
      roomCode = String(m.room || "room1").slice(0, 24);
      room = roomOf(roomCode);
      if (room.size >= MAX_PER_ROOM) { ws.send(JSON.stringify({ type: "full" })); ws.close(); return; }
      id = nextId++;
      const color = COLORS[id % COLORS.length];
      info = { id, name: String(m.name || "Player").slice(0, 16), color, s: null };

      const peers = [];
      room.forEach((c) => peers.push(
        Object.assign({ id: c.info.id, name: c.info.name, color: c.info.color }, c.info.s || {})
      ));
      ws.send(JSON.stringify({ type: "welcome", id, color, peers }));

      room.set(id, { ws, info });
      broadcast(room, { type: "peerJoined", id, name: info.name, color }, id);
      console.log(`[${roomCode}] join #${id} (${info.name}) — ${room.size}명`);

    } else if (m.type === "state" && room && id) {
      if (info) info.s = m.s;
      broadcast(room, { type: "peerState", id, s: m.s }, id);
    }
  });

  ws.on("close", () => {
    if (room && id) {
      room.delete(id);
      broadcast(room, { type: "peerLeft", id });
      console.log(`[${roomCode}] leave #${id} — ${room.size}명`);
      if (room.size === 0) rooms.delete(roomCode);
    }
  });
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    if (ws.readyState === 1) ws.ping();
  });
}, 30000);

server.listen(PORT, () => console.log("kart server (static + multiplayer) on", PORT));
