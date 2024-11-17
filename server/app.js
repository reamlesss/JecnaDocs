const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Nastavení statických souborů
app.use(express.static(path.join(__dirname, "../client")));

let clients = new Map();

wss.on("connection", (ws) => {
  const userId = `User_${Math.floor(Math.random() * 1000)}`;
  clients.set(ws, userId);

  broadcastClients();

  ws.on("message", (message) => {
    const parsedMessage = JSON.parse(message);

    if (parsedMessage.type === "text-update") {
      broadcast(
        JSON.stringify({
          type: "text-update",
          text: parsedMessage.text,
          userId: userId,
        })
      );
    }

    if (parsedMessage.type === "cursor-update") {
      broadcast(
        JSON.stringify({
          type: "cursor-update",
          cursor: parsedMessage.cursor,
          userId: userId,
        })
      );
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    broadcastClients();
  });
});

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function broadcastClients() {
  const users = Array.from(clients.values());
  broadcast(JSON.stringify({ type: "users-update", users }));
}

server.listen(8080, () => {
  console.log("Server is running on http://localhost:8080");
});
