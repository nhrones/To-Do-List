// deno-lint-ignore-file no-explicit-any
import { on } from './utils.ts'
import { todoCount, todoInput, todoList } from './dom.ts'
import { tasks, saveTasks } from './db.ts';
import { taskTemplate } from './templates.ts'

/**
 * Add a new task
 * @returns void
 */
export function addTask() {
   const newTask = todoInput.value.trim();
   if (newTask !== "") {
      tasks.push({ text: newTask, disabled: false });
      saveTasks()
      todoInput.value = "";
      todoInput.focus();
      refreshDisplay();
   }
}

/**
 * Display all tasks
 * @returns void
 */
export function refreshDisplay() {
   todoList.innerHTML = "";
   if ( tasks && tasks.length > 0 ) {

      tasks.forEach((item, index) => {
         const p = document.createElement("p");
         p.innerHTML = taskTemplate(index, item)

         on(p, 'click', (e: any) => {
            // lets the checkbox-change handler below work
            if (e.target.type === 'checkbox') return;
            // ignore all `textarea` elements
            if (e.target.type === 'textarea') return;

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

            on(editElement, "blur", function () {
               const updatedText = editElement.value.trim();
               if (updatedText.length > 0) {
                  tasks[index].text = updatedText;
                  saveTasks()
               }
               refreshDisplay();
            });
         })

         // handle the `completed` checkbox change event
         on(p.querySelector(".todo-checkbox"), "change", (e: any) => {
            e.preventDefault()
            const index = e.target.dataset.index
            tasks[index].disabled = !tasks[index].disabled;
            saveTasks()
         });
         todoList.appendChild(p);
      });
   }
   // update the task count
   todoCount.textContent = "" + tasks.length;
}

