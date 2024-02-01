// deno-lint-ignore-file

// src/utils.ts
var $ = (id) => document.getElementById(id);
var on = (el, event, callback) => el.addEventListener(event, callback);
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms || 1e3));
}

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

// src/dbCache.ts
var todoCache = /* @__PURE__ */ new Map();
var nextTxId = 0;
var callbacks = /* @__PURE__ */ new Map();
var idbWorker = new Worker("./dist/idbWorker.js");
idbWorker.onerror = (event) => {
  console.log("There is an error with your worker!");
};
var idbChannel = new BroadcastChannel("IDB");
var TODO_KEY = "TODO";
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
function restoreCache(records) {
  const tasks2 = JSON.parse(records);
  todoCache = new Map(tasks2);
}
var get = (key) => {
  return todoCache.get(key);
};
function set(key, value) {
  todoCache.set(key, value);
  persist();
}
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
async function persist() {
  let todoArray = Array.from(todoCache.entries());
  await request({ procedure: "SET", key: TODO_KEY, value: todoArray });
}
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

// src/db.ts
async function initDB() {
  await init();
  buildTopics();
}
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
var buildTopics = () => {
  let data = get("topics");
  for (let i = 0; i < data.length; i++) {
    const element = data[i];
    const parsedTopics = parseTopics(data[i]);
    addOptionGroup(parsedTopics.group, parsedTopics.entries);
  }
};
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
function saveTasks(from) {
  set(keyName, tasks);
}
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
  saveTasks("delete completed");
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
function addTask() {
  const newTask = todoInput.value.trim();
  if (newTask !== "") {
    tasks.unshift({ text: newTask, disabled: false });
    saveTasks("tasks.addTask - " + newTask);
    todoInput.value = "";
    todoInput.focus();
    refreshDisplay();
  }
}
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
            saveTasks('on(editElement, "blur"');
          }
          refreshDisplay();
        });
      });
      on(p.querySelector(".todo-checkbox"), "change", (e) => {
        e.preventDefault();
        const index2 = e.target.dataset.index;
        tasks[index2].disabled = !tasks[index2].disabled;
        saveTasks("todo-checkbox change");
      });
      todoList.appendChild(p);
    });
  }
  todoCount.textContent = "" + tasks.length;
}

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
function restoreData() {
  const fileload = document.getElementById("fileload");
  fileload.click();
  fileload.addEventListener("change", function() {
    let reader = new FileReader();
    reader.onload = function() {
      restoreCache(reader.result);
    };
    reader.readAsText(this.files[0]);
  });
}

// src/dom.ts
var backupBtn = $("backupbtn");
var restoreBtn = $("restorebtn");
var todoInput = $("todoInput");
var todoCount = $("todoCount");
var todoList = $("todoList");
var deleteCompletedBtn = $("deletecompleted");
var topicSelect = $("topicselect");
var closebtn = $("closebtn");
var popupDialog = $("popupDialog");
var popupText = $("popup_text");
var currentTopic = "topics";
async function init2() {
  await initDB();
  on(todoInput, "keydown", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addTask();
    }
  });
  on(topicSelect, "change", () => {
    currentTopic = topicSelect.value.toLowerCase();
    getTasks(currentTopic);
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
  on(popupDialog, "keyup", (event) => {
    event.preventDefault();
    popupDialog.close();
  });
  on(backupBtn, "click", () => {
    backupData();
    popupText.textContent = `All tasks backed up!`;
    popupDialog.showModal();
  });
  on(restoreBtn, "click", () => {
    restoreData();
    popupText.textContent = `All tasks restored!`;
    popupDialog.showModal();
  });
  refreshDisplay();
}

// src/main.ts
await init2();
