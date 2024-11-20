const ws = new WebSocket("ws://localhost:8080");
const editor = document.getElementById("editor");
const statustext = document.getElementById("status");
const usersDiv = document.getElementById("users");



const cursors = {};

/**
 * Updates the cursor based on data sent by the backend.
 * @param {string} clientId The ID of the client owning the cursor.
 * @param {Object} position The position (x, y) of the cursor.
 */
function updateCursor(clientId, position) {
  if (!cursors[clientId]) {
    const cursorElement = document.createElement("div");
    cursorElement.className = "cursor";
    cursorElement.style.position = "absolute";
    cursorElement.style.display = "flex";
    cursorElement.style.flexDirection = "column";
    cursorElement.style.alignItems = "center";
    cursorElement.style.pointerEvents = "none";
    cursorElement.style.zIndex = "1000";

    const cursorImage = document.createElement("img");
    cursorImage.src = "./cursor.png";
    cursorImage.style.width = "20px";
    cursorImage.style.height = "20px";

    const label = document.createElement("span");
    label.textContent = clientId;
    label.style.color = "white";
    label.style.fontSize = "12px";
    label.style.marginTop = "5px";
    label.style.textShadow = "0 0 2px black";

    cursorElement.appendChild(cursorImage);
    cursorElement.appendChild(label);
    document.body.appendChild(cursorElement);
    cursors[clientId] = cursorElement;
  }

  const cursor = cursors[clientId];
  cursor.style.left = `${(position.x / 100) * window.innerWidth}px`;
  cursor.style.top = `${(position.y / 100) * window.innerHeight}px`;
}

function removeCursor(clientId) {
  const cursor = cursors[clientId];
  if (cursor) {
    cursor.remove();
    delete cursors[clientId];
  }
}

// WebSocket connection status
ws.onopen = () => {
  statustext.textContent = "Connected";
  statustext.classList.add("status-connected");
  statustext.classList.remove("status-disconnected");
};

ws.onclose = () => {
  statustext.textContent = "Disconnected";
  statustext.classList.add("status-disconnected");
  statustext.classList.remove("status-connected");
};

ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);

    if (message.type === "text-update") {
      editor.value = message.text;
    }

    if (message.type === "cursor-update") {
      updateCursor(message.clientId, message.position);
    }

    if (message.type === "users-update") {
      usersDiv.innerHTML = `Users: ${message.users.join(", ")}`;
    }

    if (message.type === "remove-cursor") {
      removeCursor(message.clientId);
    }

    if (message.type === "text-select") {
      console.log(
          `User ${message.clientId} selected text:`,
          message.selectionRange
      );
      updateSelection(message.clientId, message.selectionRange);
    }
  } catch (error) {
    console.error("Invalid message received:", event.data);
  }
};

editor.addEventListener("input", () => {
  ws.send(JSON.stringify({ type: "text-update", text: editor.value }));
});

let lastCursorUpdate = 0;
document.addEventListener("mousemove", (e) => {
  const cursor = {
    x: (e.clientX / window.innerWidth) * 100,
    y: (e.clientY / window.innerHeight) * 100,
  };

  ws.send(
      JSON.stringify({
        type: "cursor-update",
        cursor: cursor,
      })
  );
});

editor.addEventListener("select", () => {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  ws.send(
      JSON.stringify({
        type: "text-select",
        selectionRange: { start, end },
      })
  );
});