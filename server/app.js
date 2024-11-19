const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "../client")));

let clients = new Map();

const usernames = ["Jarda_Petarda","Guláš_Lukáš","Vašek_Hrášek","Majdička_Ředkvička","Masová_koule_Martin","Sushi_Sam","Šimon_Mimoň",""]

wss.on("connection", (ws) => {
  const userId = `User_${Math.floor(Math.random() * 1000)}`;
  clients.set(ws, userId);

  broadcastClients();

  ws.on("message", (message) => {
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch (error) {
      console.error("Invalid message received:", message);
      return;
    }

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
      // console.log("cursor update received: ", parsedMessage.cursor);
      broadcast(
        JSON.stringify({
          type: "cursor-update",
          clientId: userId,
          position: parsedMessage.cursor,
        }),
        ws // Exclude the sender
      );
    }
  });

  ws.on("close", () => {
    const userId = clients.get(ws);
    clients.delete(ws);
    broadcast(
      JSON.stringify({
        type: "remove-cursor",
        clientId: userId,
      })
    );
    broadcastClients();
  });
});

function broadcast(data, excludeClient = null) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== excludeClient) {
      client.send(data);
    }
  });
}

function broadcastClients() {
  const users = Array.from(clients.values());
  broadcast(JSON.stringify({ type: "users-update", users }));
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
