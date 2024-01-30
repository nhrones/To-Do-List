// deno-lint-ignore-file no-explicit-any
import { addTask, refreshDisplay } from './tasks.ts'
import { buildTopics, deleteCompleted, initDB, getTasks } from './db.ts';
import { backupData } from './export.ts'
import { $, on } from './utils.ts'

/* create references for all UI elements */
export const backupbtn = $("backupbtn") as HTMLButtonElement;
export const todoInput = $("todoInput") as HTMLInputElement;
export const todoCount = $("todoCount") as HTMLElement;
export const todoList = $("todoList") as HTMLElement;
export const deleteCompletedBtn = $("deletecompleted") as HTMLElement;
export const topicSelect = $('topics') as HTMLSelectElement;
export const closebtn = $('closebtn') as HTMLButtonElement;
export const popupDialog = $('popupDialog') as HTMLDialogElement;
export const popupText = $("popup_text") as HTMLElement;

// topic name
let currentTopic = ""

/**
 * initialize all UI and event handlers    
 * called once on start up
 * @param {string} topic the topic name (data-key) 
 */
export async function init() {
   await initDB() 
   // assemble the topics drop-down UI
   buildTopics()

   // get all stored tasks for this topic
   getTasks(currentTopic)

   // todo input keydown handler
   on(todoInput, "keydown", function (event: any) {
      if (event.key === "Enter") {
         event.preventDefault();
         addTask();
      }
   })

   // topic select change handler
   on(topicSelect, 'change', () => {
      currentTopic = topicSelect.value.toLowerCase()
      //console.log(`topicSelect change `, currentTopic)
      getTasks(currentTopic)
   })

   // close button click handler
   on(closebtn, 'click', () => {
      console.log(`closebtn ${location.href}`)
      window.open(location.href, "_self", "");
      self.close()
   })

   // delete completed button click handler
   on(deleteCompletedBtn, "click", () => {
      deleteCompleted()
      refreshDisplay();
   });

   on(popupDialog, 'close', (event: Event) => {
      event.preventDefault();
   });

   on(popupDialog, "keyup", (event: KeyboardEvent) => {
      event.preventDefault()
      popupDialog.close()
   })

   // backup button click handler
   on(backupbtn, 'click', () => {
      backupData()
      popupText.textContent = `All tasks persisted to localStorage!`
      popupDialog.showModal()
   })

   // initial display refresh
   refreshDisplay();

}
