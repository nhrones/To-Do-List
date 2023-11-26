import { addTask, refreshDisplay } from './tasks.js'
import { deleteCompleted, getAll } from './persist.js';
import { $, on } from './utils.js'
 
export const todoInput = $("todoInput");
export const todoCount = $("todoCount");
export const todoList = $("todoList");
export const deleteCompletedBtn = $("deletecompleted");

let topic

/** initialize DOM and store */
export function init(topic) {

   getAll(topic)

   on(todoInput, "keydown", function (event) {
      if (event.key === "Enter") {
         event.preventDefault();
         addTask();
      }
   })

   on(deleteCompletedBtn, "click", () => {
      deleteCompleted()
      refreshDisplay();
   });

   refreshDisplay();
}
