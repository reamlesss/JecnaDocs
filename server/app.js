const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = new Map();

wss.on("connection", (ws) => {
  // Přiřazení unikátního ID každému klientovi
  const userId = `User_${Math.floor(Math.random() * 1000)}`;
  clients.set(ws, userId);

  // Odeslání seznamu uživatelů
  broadcastClients();

  // Zpracování zpráv od klienta
  ws.on("message", (message) => {
    const parsedMessage = JSON.parse(message);

    // Distribuce aktualizací textu
    if (parsedMessage.type === "text-update") {
      broadcast(
        JSON.stringify({
          type: "text-update",
          text: parsedMessage.text,
          userId: userId,
        })
      );
    }

    // Distribuce kurzoru
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

  // Odpojení klienta
  ws.on("close", () => {
    clients.delete(ws);
    broadcastClients();
  });
});

// Odeslání zprávy všem klientům
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Odeslání seznamu připojených uživatelů
function broadcastClients() {
  const users = Array.from(clients.values());
  broadcast(JSON.stringify({ type: "users-update", users }));
}

server.listen(8080, () => {
  console.log("Server is running on http://localhost:8080");
});
