const ws = new WebSocket("ws://localhost:8080");
const editor = document.getElementById("editor");
const statustext = document.getElementById("status");
const usersDiv = document.getElementById("users");

const cursors = {};


/**
 * function updating cursor based on data that the backend sends to the client
 * @param clientId id of the owner of cursor
 * @param position position (x,y) of the cursor
 */

function updateCursor(clientId, position) {
  if (!cursors[clientId]) {
    // Create cursor container
    const cursorElement = document.createElement("div");
    cursorElement.className = "cursor";
    cursorElement.style.position = "absolute";
    cursorElement.style.display = "flex";
    cursorElement.style.flexDirection = "column";
    cursorElement.style.alignItems = "center";
    cursorElement.style.pointerEvents = "none"; // Prevent interaction blocking
    cursorElement.style.zIndex = "1000";

    // Create cursor image
    const cursorImage = document.createElement("img");
    cursorImage.src = "./cursor.png"; // Replace with the path to your cursor image
    cursorImage.style.width = "20px"; // Adjust size as needed
    cursorImage.style.height = "20px";


    // Create client ID label
    const label = document.createElement("span");
    label.textContent = clientId;
    label.style.color = "white";
    label.style.fontSize = "12px";
    label.style.marginTop = "5px"; // Spacing between cursor and label
    label.style.textShadow = "0 0 2px black"; // Improve readability

    // Append elements to the cursor container
    cursorElement.appendChild(cursorImage);
    cursorElement.appendChild(label);

    // Add the cursor to the document
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
  if (statustext.classList.contains("status-disconnected")) {
    statustext.classList.remove("status-disconnected");
  }
  statustext.classList.add("status-connected");
};

ws.onclose = () => {
  statustext.textContent = "Disconnected";
  if (statustext.classList.contains("status-connected")) {
    statustext.classList.remove("status-connected");
  }
  statustext.classList.add("status-disconnected");
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

editor.addEventListener("select",() =>{
  const start = editor.selectionStart;
  const end = editor.selectionEnd

  ws.send(
      JSON.stringify({
        type:"text-select",
        selectionRange: {start,end}
      })
  )


});
