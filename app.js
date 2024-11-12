const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let documentContent = "";
let users = {};

app.use(express.static("public"));

wss.on("connection", (ws) => {
  const userId = Date.now();
  users[userId] = { cursorPosition: null, selection: null };

  // Pošleme klientovi aktuální dokument
  ws.send(JSON.stringify({ type: "init", content: documentContent, users }));

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "textUpdate") {
      const { text, start, end } = data;
      documentContent =
        documentContent.slice(0, start) + text + documentContent.slice(end);

      // Poslat všem klientům jen upravenou část
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "textUpdate", text, start, end }));
        }
      });
    } else if (data.type === "cursorMove") {
      users[userId].cursorPosition = data.cursorPosition;

      wss.clients.forEach((client) => {
        client.send(JSON.stringify({ type: "cursorUpdate", users }));
      });
    } else if (data.type === "selection") {
      users[userId].selection = data.selection;

      wss.clients.forEach((client) => {
        client.send(JSON.stringify({ type: "selectionUpdate", users }));
      });
    }
  });

  ws.on("close", () => {
    delete users[userId];
    wss.clients.forEach((client) => {
      client.send(JSON.stringify({ type: "userDisconnect", userId }));
    });
  });
});

server.listen(8080, () =>
  console.log("Server running on http://localhost:8080")
);
