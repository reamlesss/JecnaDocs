
const ws = new WebSocket("ws://localhost:8080");
const editor = document.getElementById("editor");
const statustext = document.getElementById("status");
const usersDiv = document.getElementById("users");

// Stav připojení
ws.onopen = () => {
  statustext.textContent = "Status: Connected";
  // status.style.color = "green";
  statustext.classList.add("status-connected");
};

ws.onclose = () => {
  statustext.textContent = "Status: Disconnected";
  statustext.classList.add("status-disconnected");
};

// Aktualizace od serveru
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === "text-update") {
    editor.value = message.text;
  }

  if (message.type === "cursor-update") {
    // Zde lze implementovat logiku pro kurzor
  }

  if (message.type === "users-update") {
    usersDiv.innerHTML = `<strong>Connected users:</strong> ${message.users.join(
      ", "
    )}`;
  }
};

// Odeslání aktualizací
editor.addEventListener("input", () => {
  ws.send(JSON.stringify({ type: "text-update", text: editor.value }));
});

// (Volitelně) Poslat aktualizaci kurzoru
editor.addEventListener("mousemove", (e) => {
  ws.send(
    JSON.stringify({
      type: "cursor-update",
      cursor: { x: e.offsetX, y: e.offsetY },
    })
  );
});
