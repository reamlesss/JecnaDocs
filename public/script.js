const ws = new WebSocket("ws://localhost:8080");
const editor = document.getElementById("editor");
const status = document.getElementById("status");
let localCache = [];
let userCursors = {};
let userSelections = {};

ws.onopen = () => {
  status.textContent = "Připojeno";
  localCache.forEach((data) => ws.send(JSON.stringify(data)));
  localCache = [];
};

ws.onclose = () => {
  status.textContent = "Odpojeno";
};

editor.addEventListener("input", () => {
  const text = editor.value.slice(editor.selectionStart, editor.selectionEnd);
  const start = editor.selectionStart;
  const end = editor.selectionEnd;

  const update = { type: "textUpdate", text, start, end };
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(update));
  } else {
    localCache.push(update);
  }
});

editor.addEventListener("mouseup", () => {
  const selection = {
    start: editor.selectionStart,
    end: editor.selectionEnd,
  };

  ws.send(JSON.stringify({ type: "selection", selection }));
});

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "init") {
    editor.value = data.content;
  } else if (data.type === "textUpdate") {
    const { text, start, end } = data;
    editor.value =
      editor.value.slice(0, start) + text + editor.value.slice(end);
  } else if (data.type === "cursorUpdate") {
    updateCursorDisplay(data.users);
  } else if (data.type === "selectionUpdate") {
    updateSelectionDisplay(data.users);
  }
};

function updateCursorDisplay(users) {
  // Vyčistit předchozí kurzory
  Object.values(userCursors).forEach((cursor) => cursor.remove());
  userCursors = {};

  // Pro každého uživatele kromě sebe přidat vizuální znázornění kurzoru
  Object.keys(users).forEach((userId) => {
    if (userId === ws.userId) return;

    const user = users[userId];
    const cursor = document.createElement("div");
    cursor.classList.add("cursor");
    cursor.style.left = `${user.cursorPosition.x}px`;
    cursor.style.top = `${user.cursorPosition.y}px`;
    cursor.style.backgroundColor = getUserColor(userId);
    document.body.appendChild(cursor);
    userCursors[userId] = cursor;
  });
}

function updateSelectionDisplay(users) {
  // Vyčistit předchozí označení
  Object.values(userSelections).forEach((selection) => selection.remove());
  userSelections = {};

  Object.keys(users).forEach((userId) => {
    if (userId === ws.userId) return;

    const user = users[userId];
    if (user.selection) {
      const { start, end } = user.selection;
      const selection = document.createElement("span");
      selection.classList.add("highlight");
      selection.style.backgroundColor = getUserColor(userId, 0.3);
      selection.style.position = "absolute";
      selection.style.left = `${start}px`;
      selection.style.right = `${end}px`;
      document.body.appendChild(selection);
      userSelections[userId] = selection;
    }
  });
}

function getUserColor(userId, alpha = 1) {
  // Funkce vrátí barvu na základě ID uživatele
  const colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A8"];
  const index = userId % colors.length;
  return (
    colors[index] + (alpha < 1 ? Math.round(255 * alpha).toString(16) : "")
  );
}
