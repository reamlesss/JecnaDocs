const ws = new WebSocket("ws://localhost:8080");
const editor = document.getElementById("editor");
const statustext = document.getElementById("status");
const usersDiv = document.getElementById("users");

const cursors = {};

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

function applyHighlight(range) {
  const text = editor.innerText;
  const { start, end } = range;

  const before = text.slice(0, start);
  const highlighted = `<span class="highlight" style="background-color: #778a42">${text.slice(
    start,
    end
  )}</span>`;
  const after = text.slice(end);

  editor.innerHTML = before + highlighted + after;
}

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
      editor.innerText = message.text;
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

    if (message.type === "highlight") {
      applyHighlight(message.range);
    }
  } catch (error) {
    console.error("Invalid message received:", event.data);
  }
};

editor.addEventListener("input", () => {
  ws.send(JSON.stringify({ type: "text-update", text: editor.innerText }));
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

editor.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const start = range.startOffset;
  const end = range.endOffset;

  ws.send(JSON.stringify({ type: "highlight", range: { start, end } }));
});
