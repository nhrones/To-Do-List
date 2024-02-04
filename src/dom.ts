// deno-lint-ignore-file no-explicit-any
/// <reference lib="dom" />
import { addTask, refreshDisplay } from './tasks.ts'
import { deleteCompleted, initDB, getTasks } from './db.ts';
import { backupData, restoreData } from './export.ts'
import { $, on } from './utils.ts'

/* create references for all UI elements */
export const backupBtn = $("backupbtn") as HTMLButtonElement;
export const restoreBtn = $("restorebtn") as HTMLButtonElement;
export const taskInput = $("taskInput") as HTMLInputElement;
export const todoCount = $("todoCount") as HTMLElement;
export const todoList = $("todoList") as HTMLElement;
export const deleteCompletedBtn = $("deletecompleted") as HTMLElement;
export const topicSelect = $('topicselect') as HTMLSelectElement;
export const dbSelect = $('dbselect') as HTMLSelectElement;
export const closebtn = $('closebtn') as HTMLButtonElement;
export const popupDialog = $('popupDialog') as HTMLDialogElement;
export const popupText = $("popup_text") as HTMLElement;

// topic name
export let currentTopic = "topics"
export let TODO_KEY = 'TODO'
/**
 * initialize all UI and event handlers    
 * called once on start up
 * @param {string} topic the topic name (data-key) 
 */
export async function init() {

   // initialize the local DB cache
   await initDB()

   // todo input keydown handler
   on(taskInput, "keydown", function (event: any) {
      if (event.key === "Enter") {
         event.preventDefault();
         const tc = taskInput.value as string
         if (tc.length > 0) {
            addTask(tc, currentTopic === 'topics');
         }
      }
   })

   // topic select change handler
   on(topicSelect, 'change', () => {
      currentTopic = topicSelect.value.toLowerCase()
      getTasks(currentTopic)
   })
   dbSelect
   // topic select change handler
   on(dbSelect, 'change', () => {
      TODO_KEY = topicSelect.value.toLowerCase()
      getTasks(currentTopic)
   })

   // close button click handler
   on(closebtn, 'click', () => {
      window.open(location.href, "_self", "");
      self.close()
   })

   // delete completed button click handler
   on(deleteCompletedBtn, "click", () => {
      deleteCompleted()
      refreshDisplay();
   });

   on(popupDialog, 'click', (event: Event) => {
      event.preventDefault();
      popupDialog.close()
   });

   on(popupDialog, 'close', (event: Event) => {
      event.preventDefault();
   });

   on(popupDialog, "keyup", (event: KeyboardEvent) => {
      event.preventDefault()
      popupDialog.close()
   })

   // backup button click handler
   on(backupBtn, 'click', () => {
      backupData()
   })

   // restore button click handler
   on(restoreBtn, 'click', () => {
      restoreData()
   })

   // initial display refresh
   refreshDisplay();

}
