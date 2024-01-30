// deno-lint-ignore-file

// src/utils.ts
var $ = (id) => document.getElementById(id);
var on = (el, event, callback) => el.addEventListener(event, callback);
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms || 1e3));
}

// src/selectBuilder.ts
function buildSelectElement(options) {
  const selectElement = $("topics");
  for (const prop in options) {
    if (options.hasOwnProperty(prop)) {
      addOptionGroup(selectElement, prop, options[prop]);
    }
  }
}
function addOptionGroup(selectElement, label, options) {
  const len = options.length;
  let optionElement;
  const optionGroup = document.createElement("optgroup");
  optionGroup.label = label;
  for (let i = 0; i < len; ++i) {
    optionElement = document.createElement("option");
    optionElement.textContent = options[i].title;
    optionElement.value = options[i].key;
    optionGroup.appendChild(optionElement);
  }
  selectElement.appendChild(optionGroup);
  return optionGroup;
}

// src/persist.ts
var todos = /* @__PURE__ */ new Map();
var nextTxId = 0;
var callbacks = /* @__PURE__ */ new Map();
var idbWorker = new Worker("./dist/idbWorker.js");
idbWorker.onerror = (event) => {
  console.log("There is an error with your worker!");
};
var idbChannel = new BroadcastChannel("IDB");
var logChannel = new BroadcastChannel("LOG");
logChannel.onmessage = (evt) => {
  console.log("=== WORKER SENT => ", evt.data);
};
var IDB_KEY = "TODO";
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
var get = (key) => {
  const tasks2 = todos.get(key);
  return tasks2;
};
function set(key, value) {
  todos.set(key, value);
  persist();
}
async function hydrate() {
  console.log("hydrate called!");
  await sleep(100);
  let result = await request({ procedure: "GET", key: IDB_KEY, value: "" });
  if (result === "NOT FOUND") {
    set(
      "topics",
      [
        { text: `Apps
   App1, key = app1`, disabled: false },
        { text: `Topics
   Todo App Topics, key = topics`, disabled: false }
      ]
    );
    return await hydrate();
  }
  let records;
  if (typeof result === "string")
    records = JSON.parse(result);
  todos = new Map(records);
  return todos;
}
async function persist() {
  let valueString = JSON.stringify(Array.from(todos.entries()));
  await request({ procedure: "SET", key: IDB_KEY, value: valueString });
}
function request(newRequest) {
  const txID = nextTxId++;
  return new Promise((resolve, reject) => {
    callbacks.set(txID, (error, result) => {
      if (error)
        reject(new Error(error.message));
      resolve(result);
    });
    console.log("idbChannel.postMessage ", newRequest.procedure);
    idbChannel.postMessage({ txID, payload: newRequest });
  });
}

// src/db.ts
async function initDB() {
  await init();
}
var tasks = [];
var keyName = "topics";
function getTasks(key = "") {
  keyName = key;
  if (key.length) {
    let data = get(key) ?? [];
    if (data === null) {
      console.log(`No data found for ${keyName}`);
      data = [];
    }
    if (typeof data === "string") {
      tasks = JSON.parse(data) || [];
    } else {
      tasks = data;
    }
    refreshDisplay();
  }
}
var parseTopics = (topics) => {
  const parsedTopics = typeof topics === "string" ? JSON.parse(topics) : topics;
  for (let index = 0; index < parsedTopics.length; index++) {
    const thisTopic = parsedTopics[index];
    const txt = thisTopic.text;
    const lines = txt.split("\n");
    const topic = lines[0].trim();
    let newText = `{"${topic}":[`;
    for (let i = 1; i < lines.length; i++) {
      const element = lines[i];
      const items = element.split(",");
      const title = items[0];
      let k = items[1].split("=");
      const keyName2 = k[1].trim();
      newText += `{ "title": "${title}", "key": "${keyName2}" },`;
    }
    newText = newText.substring(0, newText.length - 1) + `] }`;
    parsedTopics[index].text = newText;
  }
  return parsedTopics;
};
var buildTopics = () => {
  const data = get("topics");
  const parsedTopics = parseTopics(data);
  if (parsedTopics != null) {
    for (let index = 0; index < parsedTopics.length; index++) {
      try {
        const options = JSON.parse(`${parsedTopics[index].text}`);
        buildSelectElement(options);
      } catch (_err) {
        console.log("error parsing: ", parsedTopics[index].text);
      }
    }
  } else {
    console.log(`No topics found!`);
  }
};
function saveTasks() {
  const value = JSON.stringify(tasks, null, 2);
  set(keyName, value);
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
  saveTasks();
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
    tasks.push({ text: newTask, disabled: false });
    saveTasks();
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
            saveTasks();
          }
          refreshDisplay();
        });
      });
      on(p.querySelector(".todo-checkbox"), "change", (e) => {
        e.preventDefault();
        const index2 = e.target.dataset.index;
        tasks[index2].disabled = !tasks[index2].disabled;
        saveTasks();
      });
      todoList.appendChild(p);
    });
  }
  todoCount.textContent = "" + tasks.length;
}

// src/export.ts
function backupData() {
  const data = {};
  console.info("todo export data: ", data);
  localStorage.setItem("todo_backup", JSON.stringify(data, null, 2));
  const raw = localStorage.getItem("todo_backup") ?? "";
  console.info("raw from localStorage: ", raw);
}

// src/dom.ts
var backupbtn = $("backupbtn");
var todoInput = $("todoInput");
var todoCount = $("todoCount");
var todoList = $("todoList");
var deleteCompletedBtn = $("deletecompleted");
var topicSelect = $("topics");
var closebtn = $("closebtn");
var popupDialog = $("popupDialog");
var popupText = $("popup_text");
var currentTopic = "";
async function init2() {
  await initDB();
  buildTopics();
  getTasks(currentTopic);
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
    console.log(`closebtn ${location.href}`);
    window.open(location.href, "_self", "");
    self.close();
  });
  on(deleteCompletedBtn, "click", () => {
    deleteCompleted();
    refreshDisplay();
  });
  on(popupDialog, "close", (event) => {
    event.preventDefault();
  });
  on(popupDialog, "keyup", (event) => {
    event.preventDefault();
    popupDialog.close();
  });
  on(backupbtn, "click", () => {
    backupData();
    popupText.textContent = `All tasks persisted to localStorage!`;
    popupDialog.showModal();
  });
  refreshDisplay();
}

// src/main.ts
await init2();
