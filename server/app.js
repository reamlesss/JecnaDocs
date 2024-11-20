const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "../client")));

let clients = new Map();

// Array of strings that are then used as usernames
const usernames = [
  "Jarda_Petarda",
  "Guláš_Lukáš",
  "Vašek_Hrášek",
  "Majdička_Ředkvička",
  "Masová_koule_Martin",
  "Sushi_Sam",
  "Šimon_Mimoň",
  "Radek_párek",
  "Daník_Braník",
  "Martin_Pervitin",
];

/**
 * Check if username is already taken by another client
 * @param username username
 * @returns {boolean} returns the decision (already taken/free)
 */
function isUsernameTaken(username) {
  for (const [, clientUsername] of clients) {
    if (clientUsername === username) {
      return true;
    }
  }
  return false;
}

/**
 * Gets username from the array usernames and uses isUsernameTaken(username) func. to check availability
 * @returns {string} returns username that is not taken
 */
function getUsername() {
  for (const name of usernames) {
    if (isUsernameTaken(name)) {
      console.log(`${name} is already taken`);
    } else {
      return name;
    }
  }
}

wss.on("connection", (ws) => {
  const userId = getUsername();
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

    // Handle text updates
    if (parsedMessage.type === "text-update") {
      broadcast(
          JSON.stringify({
            type: "text-update",
            text: parsedMessage.text,
            userId: userId,
          })
      );
    }

    // Handle cursor updates
    if (parsedMessage.type === "cursor-update") {
      broadcast(
          JSON.stringify({
            type: "cursor-update",
            clientId: userId,
            position: parsedMessage.cursor,
          }),
          ws // Exclude the sender
      );
    }

    // Handle text selection
    if (parsedMessage.type === "text-select") {
      const selectionRange = parsedMessage.selectionRange;
      broadcast(
          JSON.stringify({
            type: "text-select",
            clientId: userId,
            selectionRange: selectionRange,
          }),
          ws // Exclude the sender
      );

      console.log(
          `User ${userId} selected text from position ${selectionRange.start} to ${selectionRange.end}`
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

/**
 * Broadcasts a message to all connected clients except the excluded one
 * @param {string} data Message to broadcast
 * @param {WebSocket} excludeClient The client to exclude from broadcasting
 */
function broadcast(data, excludeClient = null) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== excludeClient) {
      client.send(data);
    }
  });
}

/**
 * Sends the list of connected users to all clients
 */
function broadcastClients() {
  const users = Array.from(clients.values());
  broadcast(JSON.stringify({ type: "users-update", users }));
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});