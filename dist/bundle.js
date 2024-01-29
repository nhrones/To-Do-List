// deno-lint-ignore-file
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/utils.ts
var $ = /* @__PURE__ */ __name((id) => document.getElementById(id), "$");
var on = /* @__PURE__ */ __name((el, event, callback) => el.addEventListener(event, callback), "on");

// src/selectBuilder.ts
function buildSelectElement(options) {
  const selectElement = $("topics");
  for (const prop in options) {
    if (options.hasOwnProperty(prop)) {
      addOptionGroup(selectElement, prop, options[prop]);
    }
  }
}
__name(buildSelectElement, "buildSelectElement");
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
__name(addOptionGroup, "addOptionGroup");

// src/db.ts
function fetchQuerySet() {
  const kv = Object.assign({}, window.localStorage);
  console.log("fetchQuerySet-kv: ", kv);
}
__name(fetchQuerySet, "fetchQuerySet");
function get(key = "topics") {
  console.log("getting ", key);
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}
__name(get, "get");
function set(key, value) {
  localStorage.setItem(key, value);
}
__name(set, "set");
function fetchAll() {
  let queryset = fetchQuerySet();
  if (queryset === null) {
    console.log(`No data found for todos!`);
  }
  if (typeof queryset === "string") {
    queryset = JSON.parse(queryset) || [];
  }
  return queryset;
}
__name(fetchAll, "fetchAll");
var tasks = [];
var keyName = "topics";
function getTasks(key = "") {
  keyName = key;
  if (key.length) {
    let data = get(key);
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
__name(getTasks, "getTasks");
var parseTopics = /* @__PURE__ */ __name((topics) => {
  const parsedTopics = typeof topics === "string" ? JSON.parse(topics) : topics;
  console.info("parsedTopics ", parsedTopics);
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
      const keyName2 = items[1].split("=")[1].trim();
      newText += `{ "title": "${title}", "key": "${keyName2}" },`;
    }
    newText = newText.substring(0, newText.length - 1) + `] }`;
    parsedTopics[index].text = newText;
  }
  return parsedTopics;
}, "parseTopics");
var buildTopics = /* @__PURE__ */ __name(() => {
  const data = get("topics");
  console.info("data ", data);
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
}, "buildTopics");
function saveTasks() {
  console.log(`Raw Tasks - `, tasks);
  const value = JSON.stringify(tasks, null, 2);
  console.log(`SaveTasks - setting "${keyName}" to ${value}`);
  set(keyName, value);
}
__name(saveTasks, "saveTasks");
function deleteCompleted() {
  const savedtasks = [];
  let deleted = 0;
  tasks.forEach((task) => {
    if (task.disabled === false) {
      savedtasks.push(task);
    } else {
      deleted++;
    }
  });
  tasks = savedtasks;
  saveTasks();
  popupText.textContent = `Removed ${deleted} tasks!`;
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
   </div>
 `;
}
__name(taskTemplate, "taskTemplate");

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
__name(refreshDisplay, "refreshDisplay");

// src/export.ts
function backupData() {
  const data = fetchAll();
  console.info("todo export data: ", data);
  localStorage.setItem("todo_backup", JSON.stringify(data, null, 2));
  const raw = localStorage.getItem("todo_backup") ?? "";
  console.info("raw from localStorage: ", raw);
}
__name(backupData, "backupData");

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
function init() {
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
    console.log(`topicSelect change `, currentTopic);
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
__name(init, "init");

// src/main.ts
init();
fetchQuerySet();
