// deno-lint-ignore-file
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/utils.ts
var $ = /* @__PURE__ */ __name((id) => document.getElementById(id), "$");
var on = /* @__PURE__ */ __name((el, event, callback) => el.addEventListener(event, callback), "on");
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms || 1e3));
}
__name(sleep, "sleep");

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
__name(addOptionGroup, "addOptionGroup");

// src/dbCache.ts
var todoCache = /* @__PURE__ */ new Map();
var nextTxId = 0;
var callbacks = /* @__PURE__ */ new Map();
var idbWorker = new Worker("./dist/idbWorker.js");
idbWorker.onerror = (event) => {
  console.log("There is an error with your worker!");
};
var idbChannel = new BroadcastChannel("IDB");
async function init() {
  idbChannel.onmessage = (evt) => {
    const { msgID, error, result } = evt.data;
    if (!callbacks.has(msgID))
      return;
    const callback = callbacks.get(msgID);
    callbacks.delete(msgID);
    if (callback)
      callback(error, result);
  };
  return await hydrate();
}
__name(init, "init");
function restoreCache(records) {
  const tasks2 = JSON.parse(records);
  todoCache = new Map(tasks2);
  persist();
}
__name(restoreCache, "restoreCache");
var get = /* @__PURE__ */ __name((key) => {
  return todoCache.get(key);
}, "get");
function set(key, value, topicChanged = false) {
  todoCache.set(key, value);
  persist();
  if (topicChanged)
    window.location.reload();
}
__name(set, "set");
async function hydrate() {
  await sleep(100);
  let result = await request({ procedure: "GET", key: TODO_KEY, value: "" });
  if (result === "NOT FOUND") {
    set(
      "topics",
      [
        {
          text: `Apps   
      App1, app1
      App2, app2`,
          disabled: false
        },
        {
          text: `Topics
      Todo App Topics, topics`,
          disabled: false
        }
      ]
    );
    return await hydrate();
  }
  todoCache = new Map(result);
}
__name(hydrate, "hydrate");
async function persist() {
  let todoArray = Array.from(todoCache.entries());
  await request({ procedure: "SET", key: TODO_KEY, value: todoArray });
}
__name(persist, "persist");
function request(newRequest) {
  const txID = nextTxId++;
  return new Promise((resolve, reject) => {
    callbacks.set(txID, (error, result) => {
      if (error)
        reject(new Error(error.message));
      resolve(result);
    });
    idbChannel.postMessage({ txID, payload: newRequest });
  });
}
__name(request, "request");

// src/db.ts
async function initDB() {
  await init();
  buildTopics();
}
__name(initDB, "initDB");
var tasks = [];
var keyName = "";
function getTasks(key = "") {
  keyName = key;
  if (key.length) {
    let data = get(key) ?? [];
    if (data === null) {
      console.log(`No data found for ${keyName}`);
      data = [];
    }
    tasks = data;
    refreshDisplay();
  }
}
__name(getTasks, "getTasks");
var buildTopics = /* @__PURE__ */ __name(() => {
  let data = get("topics");
  for (let i = 0; i < data.length; i++) {
    const element = data[i];
    const parsedTopics = parseTopics(data[i]);
    addOptionGroup(parsedTopics.group, parsedTopics.entries);
  }
}, "buildTopics");
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
    const keyName2 = items[1].trim();
    newObj.title = title;
    newObj.key = keyName2;
    topicObject.entries[i - 1] = newObj;
  }
  return topicObject;
}
__name(parseTopics, "parseTopics");
function saveTasks(topicChanged) {
  set(keyName, tasks, topicChanged);
}
__name(saveTasks, "saveTasks");
function deleteCompleted() {
  const savedtasks = [];
  let numberDeleted = 0;
  tasks.forEach((task) => {
    if (task.disabled === false) {
      savedtasks.push(task);
    } else {
      numberDeleted++;
    }
  });
  tasks = savedtasks;
  saveTasks(currentTopic2 === "topics");
  popupText2.textContent = `Removed ${numberDeleted} tasks!`;
  popupDialog2.showModal();
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
   </div>
 `;
}
__name(taskTemplate, "taskTemplate");

// src/tasks.ts
function addTask(newTask, topics = false) {
  if (topics)
    newTask = `${newTask}
      newTopic, newKey`;
  tasks.unshift({ text: newTask, disabled: false });
  saveTasks(topics);
  taskInput.value = "";
  taskInput.focus();
  refreshDisplay();
}
__name(addTask, "addTask");
function refreshDisplay() {
  todoList.innerHTML = "";
  if (tasks && tasks.length > 0) {
    tasks.forEach((item, index) => {
      const p = document.createElement("p");
      p.innerHTML = taskTemplate(index, item);
      on(p, "click", (e) => {
        if (e.target.type === "checkbox")
          return;
        if (e.target.type === "textarea")
          return;
        const todoItem = e.target;
        const existingText = tasks[index].text;
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
            tasks[index].text = updatedText;
            saveTasks(currentTopic2 === "topics");
          }
          refreshDisplay();
        });
      });
      on(p.querySelector(".todo-checkbox"), "change", (e) => {
        e.preventDefault();
        const index2 = e.target.dataset.index;
        tasks[index2].disabled = !tasks[index2].disabled;
        saveTasks(false);
      });
      todoList.appendChild(p);
    });
  }
  todoCount.textContent = "" + tasks.length;
}
__name(refreshDisplay, "refreshDisplay");

// src/export.ts
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
    let reader = new FileReader();
    reader.onload = function() {
      restoreCache(reader.result);
      window.location.reload();
    };
    reader.readAsText(this.files[0]);
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
var popupDialog2 = $("popupDialog");
var popupText2 = $("popup_text");
var currentTopic2 = "topics";
var TODO_KEY = "TODO";
async function init2() {
  await initDB();
  on(taskInput, "keydown", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      const tc = taskInput.value;
      if (tc.length > 0) {
        addTask(tc, currentTopic2 === "topics");
      }
    }
  });
  on(topicSelect, "change", () => {
    currentTopic2 = topicSelect.value.toLowerCase();
    getTasks(currentTopic2);
  });
  dbSelect;
  on(dbSelect, "change", () => {
    TODO_KEY = topicSelect.value.toLowerCase();
    getTasks(currentTopic2);
  });
  on(closebtn, "click", () => {
    window.open(location.href, "_self", "");
    self.close();
  });
  on(deleteCompletedBtn, "click", () => {
    deleteCompleted();
    refreshDisplay();
  });
  on(popupDialog2, "click", (event) => {
    event.preventDefault();
    popupDialog2.close();
  });
  on(popupDialog2, "close", (event) => {
    event.preventDefault();
  });
  on(popupDialog2, "keyup", (event) => {
    event.preventDefault();
    popupDialog2.close();
  });
  on(backupBtn, "click", () => {
    backupData();
  });
  on(restoreBtn, "click", () => {
    restoreData();
  });
  refreshDisplay();
}
__name(init2, "init");

// src/main.ts
await init2();
