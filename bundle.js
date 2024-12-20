// deno-lint-ignore-file
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/selectBuilder.ts
function resetTopicSelect() {
  topicSelect.innerHTML = '<option value="" disabled selected hidden>Select A Todo Topic</option>';
}
__name(resetTopicSelect, "resetTopicSelect");
function addOptionGroup(label, options) {
  const len = options.length;
  let optionElement;
  const optionGroup = document.createElement("optgroup");
  optionGroup.label = label;
  for (let i = 0; i < len; ++i) {
    optionElement = document.createElement("option");
    optionElement.textContent = options[i].title || "fuck";
    optionElement.value = options[i].key || "fuck";
    optionGroup.appendChild(optionElement);
  }
  topicSelect.appendChild(optionGroup);
  return optionGroup;
}
__name(addOptionGroup, "addOptionGroup");

// src/context.ts
var KV_URL = "kv-ws-rpc.deno.dev";
var DEV = true;
var ctx = {
  currentTopic: "topics",
  TopicKey: "topics",
  DbKey: ["TODOS"],
  nextTxId: 0,
  thisKeyName: "",
  tasks: []
};
var $ = /* @__PURE__ */ __name((id) => document.getElementById(id), "$");
var on = /* @__PURE__ */ __name((elem, event, listener) => elem.addEventListener(event, listener), "on");

// src/kvCache.ts
var todoCache = /* @__PURE__ */ new Map();
var callbacks = /* @__PURE__ */ new Map();
var socket;
function initCache() {
  const wsProtocol = globalThis.location.protocol === "http:" ? "ws" : "wss";
  const local = globalThis.location.hostname === "localhost";
  const socketURL = local ? `${wsProtocol}://localhost:8765` : `${wsProtocol}://${KV_URL}/`;
  if (DEV) console.log("socket url = ", socketURL);
  socket = new WebSocket(socketURL);
  socket.onopen = async () => {
    return await hydrate();
  };
  socket.onmessage = (evt) => {
    const { txID, error, result } = JSON.parse(evt.data);
    if (!callbacks.has(txID)) return;
    const callback = callbacks.get(txID);
    callbacks.delete(txID);
    if (callback) callback(error, result);
  };
}
__name(initCache, "initCache");
function restoreCache(records) {
  const tasksObj = JSON.parse(records);
  todoCache = new Map(tasksObj);
  persist();
}
__name(restoreCache, "restoreCache");
var getFromCache = /* @__PURE__ */ __name((key) => {
  return todoCache.get(key);
}, "getFromCache");
function setCache(key, value, topicChanged = false) {
  todoCache.set(key, value);
  persist();
  if (topicChanged) globalThis.location.reload();
}
__name(setCache, "setCache");
async function hydrate() {
  const result = await request({ procedure: "GET", key: ctx.DbKey, value: "" });
  if (result === "NOT FOUND")
    console.log(`kvCache.hydrate -- result = 'NOT FOUND'!`);
  todoCache = new Map(result.value);
  buildTopics();
}
__name(hydrate, "hydrate");
async function persist() {
  const todoArray = Array.from(todoCache.entries());
  await request({ procedure: "SET", key: ctx.DbKey, value: todoArray });
}
__name(persist, "persist");
function request(newRequest) {
  const txID = ctx.nextTxId++;
  return new Promise((resolve, reject) => {
    if (socket.readyState === WebSocket.OPEN) {
      callbacks.set(txID, (error, result) => {
        if (error) reject(new Error(error.message));
        resolve(result);
      });
      socket.send(JSON.stringify({ txID, payload: newRequest }));
    } else {
      console.log("Socket not yet open!");
    }
  });
}
__name(request, "request");

// src/db.ts
async function initDB() {
  await initCache();
}
__name(initDB, "initDB");
function getTasks(key = "") {
  ctx.thisKeyName = key;
  if (key.length) {
    let data = getFromCache(key) ?? [];
    if (data === null) {
      if (DEV) console.log(`No data found for ${ctx.thisKeyName}`);
      data = [];
    }
    ctx.tasks = data;
    refreshDisplay();
  }
}
__name(getTasks, "getTasks");
function buildTopics() {
  const data = getFromCache("topics");
  resetTopicSelect();
  for (let i = 0; i < data.length; i++) {
    const parsedTopics = parseTopics(data[i]);
    addOptionGroup(parsedTopics.group, parsedTopics.entries);
  }
}
__name(buildTopics, "buildTopics");
function parseTopics(topics) {
  const topicObject = { group: "", entries: [] };
  const thisTopic = topics;
  const txt = thisTopic.text;
  const lines = txt.split("\n");
  topicObject.group = lines[0].trim();
  for (let i = 1; i < lines.length; i++) {
    const newObj = { title: "", key: "" };
    const element = lines[i];
    const items = element.split(",");
    const title = items[0];
    const keyName = items[1].trim();
    newObj.title = title;
    newObj.key = keyName;
    topicObject.entries[i - 1] = newObj;
  }
  return topicObject;
}
__name(parseTopics, "parseTopics");
function saveTasks(topicChanged) {
  setCache(ctx.thisKeyName, ctx.tasks, topicChanged);
}
__name(saveTasks, "saveTasks");
function deleteCompleted() {
  const savedtasks = [];
  let numberDeleted = 0;
  ctx.tasks.forEach((task) => {
    if (task.disabled === false) {
      savedtasks.push(task);
    } else {
      numberDeleted++;
    }
  });
  ctx.tasks = savedtasks;
  saveTasks(ctx.currentTopic === "topics");
  popupText.textContent = `Removed ${numberDeleted} tasks!`;
  popupDialog.showModal();
}
__name(deleteCompleted, "deleteCompleted");

// src/templates.ts
function taskTemplate(index, item) {
  const { disabled, text } = item;
  return `
   <div class="todo-container">
      <input type="checkbox" 
         id="checkbox-${index}" 
         class="todo-checkbox" 
         data-index=${index}
      ${disabled ? "checked" : ""}>
      <pre WIDTH="40"
         id="todo-${index}" 
         class="${disabled ? "disabled" : ""}" 
         data-index=${index}>${text}
      </pre>
   </div> `;
}
__name(taskTemplate, "taskTemplate");

// src/tasks.ts
function addTask(newTask, topics = false) {
  if (topics) newTask = `${newTask}
      newTopic, newKey`;
  if (DEV) console.log("added task ", newTask);
  ctx.tasks.unshift({ text: newTask, disabled: false });
  saveTasks(topics);
  taskInput.value = "";
  taskInput.focus();
  refreshDisplay();
}
__name(addTask, "addTask");
function refreshDisplay() {
  todoList.innerHTML = "";
  if (ctx.tasks && ctx.tasks.length > 0) {
    ctx.tasks.forEach((item, index) => {
      const p = document.createElement("p");
      p.innerHTML = taskTemplate(index, item);
      on(p, "click", (e) => {
        if (e.target.type === "checkbox") return;
        if (e.target.type === "textarea") return;
        const todoItem = e.target;
        const existingText = ctx.tasks[index].text;
        const editElement = document.createElement("textarea");
        editElement.setAttribute("rows", "6");
        editElement.setAttribute("cols", "62");
        editElement.setAttribute("wrap", "hard");
        editElement.setAttribute("autocorrect", "on");
        editElement.value = existingText;
        todoItem.replaceWith(editElement);
        editElement.focus();
        on(editElement, "blur", function() {
          const updatedText = editElement.value.trim();
          if (updatedText.length > 0) {
            ctx.tasks[index].text = updatedText;
            saveTasks(ctx.currentTopic === "topics");
          }
          refreshDisplay();
        });
      });
      on(p.querySelector(".todo-checkbox"), "change", (e) => {
        e.preventDefault();
        const index2 = e.target.dataset.index;
        ctx.tasks[index2].disabled = !ctx.tasks[index2].disabled;
        saveTasks(false);
      });
      todoList.appendChild(p);
    });
  }
  todoCount.textContent = "" + ctx.tasks.length;
}
__name(refreshDisplay, "refreshDisplay");

// src/backup.ts
function backupData() {
  const jsonData = JSON.stringify(Array.from(todoCache.entries()));
  const link = document.createElement("a");
  const file = new Blob([jsonData], { type: "application/json" });
  link.href = URL.createObjectURL(file);
  link.download = "backup.json";
  link.click();
  URL.revokeObjectURL(link.href);
}
__name(backupData, "backupData");
function restoreData() {
  const fileload = document.getElementById("fileload");
  fileload.click();
  fileload.addEventListener("change", function() {
    const reader = new FileReader();
    reader.onload = function() {
      restoreCache(reader.result);
      window.location.reload();
    };
    reader.readAsText(fileload.files[0]);
  });
}
__name(restoreData, "restoreData");

// src/dom.ts
var backupBtn = $("backupbtn");
var restoreBtn = $("restorebtn");
var taskInput = $("taskInput");
var todoCount = $("todoCount");
var todoList = $("todoList");
var deleteCompletedBtn = $("deletecompleted");
var topicSelect = $("topicselect");
var dbSelect = $("dbselect");
var closebtn = $("closebtn");
var popupDialog = $("popupDialog");
var popupText = $("popup_text");
async function initDom() {
  await initDB();
  on(taskInput, "keydown", function(evt) {
    const { key } = evt;
    if (key === "Enter") {
      evt.preventDefault();
      const tc = taskInput.value;
      if (tc.length > 0) {
        addTask(tc, ctx.currentTopic === "topics");
      }
    }
  });
  on(topicSelect, "change", () => {
    ctx.currentTopic = topicSelect.value.toLowerCase();
    getTasks(ctx.currentTopic);
  });
  on(dbSelect, "change", async () => {
    ctx.DbKey = [dbSelect.value];
    ctx.TopicKey = "topics";
    await initDB();
  });
  on(closebtn, "click", () => {
    if (DEV) console.log("closebtn clicked");
    self.open(location.href, "_self", "");
    self.close();
  });
  on(deleteCompletedBtn, "click", () => {
    deleteCompleted();
    refreshDisplay();
  });
  on(popupDialog, "click", (event) => {
    event.preventDefault();
    popupDialog.close();
  });
  on(popupDialog, "close", (event) => {
    event.preventDefault();
  });
  on(popupDialog, "keyup", (evt) => {
    evt.preventDefault();
    popupDialog.close();
  });
  on(backupBtn, "click", () => {
    backupData();
  });
  on(restoreBtn, "click", () => {
    restoreData();
  });
  refreshDisplay();
}
__name(initDom, "initDom");

// src/main.ts
await initDom();
