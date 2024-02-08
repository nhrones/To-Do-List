
import { todoCount, taskInput, todoList } from './dom.ts'
import { saveTasks } from './db.ts';
import { taskTemplate } from './templates.ts'
import { DEV, ctx, on } from './context.ts'

/**
 * Add a new task
 * @returns void
 */
export function addTask(newTask: string, topics = false) {
   if (topics) newTask = `${newTask}
      newTopic, newKey`;

   ctx.tasks.unshift({ text: newTask, disabled: false });
   saveTasks(topics)
   taskInput.value = "";
   taskInput.focus();
   refreshDisplay();
}

/**
 * Display all tasks
 * @returns void
 */
export function refreshDisplay() {

   todoList.innerHTML = "";
   if (ctx.tasks && ctx.tasks.length > 0) {

      ctx.tasks.forEach((item, index) => {
         const p = document.createElement("p");
         p.innerHTML = taskTemplate(index, item)

         on(p, 'click', (e: any) => {
            // lets the checkbox-change handler below work
            if (e.target.type === 'checkbox') return;
            // ignore all `textarea` elements
            if (e.target.type === 'textarea') return;

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

            on(editElement, "blur", function () {
               const updatedText = editElement.value.trim();
               if (updatedText.length > 0) {
                  ctx.tasks[index].text = updatedText;
                  saveTasks((ctx.currentTopic === 'topics'))
               }
               refreshDisplay();
            });
         })

         // handle the `completed` checkbox change event
         on(p.querySelector(".todo-checkbox")!, "change", (e: Event) => {
            e.preventDefault()
            //@ts-ignore
            const index = e.target.dataset.index
            ctx.tasks[index].disabled = !ctx.tasks[index].disabled;
            saveTasks(false)
         });
         todoList.appendChild(p);
      });
   }
   // update the task count
   todoCount.textContent = "" + ctx.tasks.length;
}

