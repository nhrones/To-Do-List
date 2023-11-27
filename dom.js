import { addTask, refreshDisplay } from './tasks.js'
import { buildTopics, deleteCompleted, getAll } from './db.js';
import { $, on } from './utils.js'

export const todoInput = $("todoInput");
export const todoCount = $("todoCount");
export const todoList = $("todoList");
export const deleteCompletedBtn = $("deletecompleted");
export const topicSelect = $('topics');
export const closebtn = $('closebtn')

let topic

export function init(topic) {

   buildTopics(true)

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

   on(topicSelect, 'change', (e) => {
      topic = topicSelect.value.toLowerCase() 
      getAll(topic)
      refreshDisplay();
   }) 

   on(closebtn, 'click', (e) => {
      console.log(`clocebtn ${location.href}`)
      window.open(location.href, "_self", "");
      window.close()
   })

   refreshDisplay();
}
