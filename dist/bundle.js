// deno-lint-ignore-file

// src/selectBuilder.ts
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

// src/context.ts
var DEV = true;
var ctx = {
  currentTopic: "topics",
  DB_KEY: "TODO",
  nextTxId: 0,
  thisKeyName: "",
  tasks: []
};
var $ = (id) => document.getElementById(id);
var on = (elem, event, listener) => elem.addEventListener(event, listener);
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms || 1e3));
}

// src/dbCache.ts
var todoCache = /* @__PURE__ */ new Map();
var callbacks = /* @__PURE__ */ new Map();
var idbChannel = new BroadcastChannel("IDB");
var idbWorker = new Worker("./dist/idbWorker.js");
idbWorker.onerror = (event) => {
  console.log("There is an error with your worker!");
};
async function init() {
  if (DEV)
    console.log(`dbCache.init(36)!`);
  idbChannel.onmessage = (evt) => {
    const { msgID, error, result } = evt.data;
    if (!callbacks.has(msgID))
      return;
    const callback = callbacks.get(msgID);
    callbacks.delete(msgID);
    if (callback)
      callback(error, result);
  };
  if (DEV)
    console.log(`dbCache.init(51) awaits dbCache.hydrate()!`);
  return await hydrate();
}
function restoreCache(records) {
  const tasksObj = JSON.parse(records);
  todoCache = new Map(tasksObj);
  persist();
}
var get = (key) => {
  return todoCache.get(key);
};
function set(key, value, topicChanged = false) {
  todoCache.set(key, value);
  persist();
  if (topicChanged)
    window.location.reload();
}
async function hydrate() {
  if (DEV)
    console.log(`dbCache.hydrate(85) sleeps(100ms)!`);
  await sleep(100);
  if (DEV)
    console.log(`dbCache.hydrate(88) awaits GET DB_KEY!`);
  let result = await request({ procedure: "GET", key: ctx.DB_KEY, value: "" });
  if (DEV)
    console.log(`dbCache.hydrate(91) returns result!`);
  if (result === "NOT FOUND") {
    if (DEV)
      console.log(`dbCache.hydrate(94) result 'NOT FOUND'!`);
    set(
      "topics",
      [
        {
          text: `Topics
      Todo App Topics, topics`,
          disabled: false
        }
      ]
    );
    return await hydrate();
  }
  if (DEV)
    console.log(`dbCache.hydrate(110) new Map(result)!`);
  todoCache = new Map(result);
}
async function persist() {
  let todoArray = Array.from(todoCache.entries());
  await request({ procedure: "SET", key: ctx.DB_KEY, value: todoArray });
}
function request(newRequest) {
  const txID = ctx.nextTxId++;
  return new Promise((resolve, reject) => {
    callbacks.set(txID, (error, result) => {
      if (error)
        reject(new Error(error.message));
      resolve(result);
    });
    idbChannel.postMessage({ txID, payload: newRequest });
  });
}

// src/db.ts
async function initDB() {
  if (DEV)
    console.log(`db.initDB(14) awaits Cache.init()!`);
  await init();
  if (DEV)
    console.log(`db.initDB(17) return from Cache.init()!`);
  if (DEV)
    console.log(`db.initDB(18) calls buildTopics()!`);
  buildTopics();
}
function getTasks(key = "") {
  ctx.thisKeyName = key;
  if (key.length) {
    let data = get(key) ?? [];
    if (data === null) {
      console.log(`No data found for ${ctx.thisKeyName}`);
      data = [];
    }
    ctx.tasks = data;
    refreshDisplay();
  }
}
function buildTopics() {
  let data = get("topics");
  for (let i = 0; i < data.length; i++) {
    const element = data[i];
    const parsedTopics = parseTopics(data[i]);
    addOptionGroup(parsedTopics.group, parsedTopics.entries);
  }
  if (DEV)
    console.log(`db.buildTopics(60) completed!`);
}
function parseTopics(topics) {
  const topicObject = { group: "", entries: [] };
  const thisTopic = topics;
  const txt = thisTopic.text;
  const lines = txt.split("\n");
  topicObject.group = lines[0].trim();
  for (let i = 1; i < lines.length; i++) {
    let newObj = { title: "", key: "" };
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
function saveTasks(topicChanged) {
  set(ctx.thisKeyName, ctx.tasks, topicChanged);
}
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
   </div>
 `;
}

// src/tasks.ts
function addTask(newTask, topics = false) {
  if (topics)
    newTask = `${newTask}
      newTopic, newKey`;
  ctx.tasks.unshift({ text: newTask, disabled: false });
  saveTasks(topics);
  taskInput.value = "";
  taskInput.focus();
  refreshDisplay();
}
function refreshDisplay() {
  todoList.innerHTML = "";
  if (ctx.tasks && ctx.tasks.length > 0) {
    ctx.tasks.forEach((item, index) => {
      const p = document.createElement("p");
      p.innerHTML = taskTemplate(index, item);
      on(p, "click", (e) => {
        if (e.target.type === "checkbox")
          return;
        if (e.target.type === "textarea")
          return;
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
  if (DEV)
    console.log(`tasks.refreshDisplay(72) completed!`);
  todoCount.textContent = "" + ctx.tasks.length;
}

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
function restoreData() {
  const fileload = document.getElementById("fileload");
  fileload.click();
  fileload.addEventListener("change", function() {
    let reader = new FileReader();
    reader.onload = function() {
      restoreCache(reader.result);
      window.location.reload();
    };
    reader.readAsText(this.files[0]);
  });
}

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
  if (DEV)
    console.log(`dom.initDom(30) awaits initDB()!`);
  await initDB();
  if (DEV)
    console.log(`dom.initDom(33) returned from initDB()!`);
  on(taskInput, "keydown", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
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
  dbSelect;
  on(dbSelect, "change", async () => {
    ctx.DB_KEY = dbSelect.value;
    console.log("About to init DB: ", ctx.DB_KEY);
    await initDB();
  });
  on(closebtn, "click", () => {
    window.open(location.href, "_self", "");
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
  if (DEV)
    console.log(`dom.initDom(94) calls refreshDisplay()!`);
  refreshDisplay();
}

// src/main.ts
if (DEV)
  console.log(`main(5) awaiting initDom!`);
await initDom();
if (DEV)
  console.log(`main(5) returns from initDom!`);
