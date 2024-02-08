/// <reference lib="dom" />
import { addTask, refreshDisplay } from './tasks.ts'
import { deleteCompleted, initDB, getTasks } from './db.ts';
import { backupData, restoreData } from './backup.ts'
import { DEV, ctx, on, $ } from './context.ts'


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

/** initialize all UI and event handlers */
export async function initDom() {
   if (DEV) console.log(`dom.initDom(30) awaits initDB()!`)
   // initialize the local DB cache
   await initDB()
   if (DEV) console.log(`dom.initDom(33) returned from initDB()!`)
   // input keydown handler
   on(taskInput, "keydown", function (event: any) {
      if (event.key === "Enter") {
         event.preventDefault();
         const tc = taskInput.value as string
         if (tc.length > 0) {
            addTask(tc, ctx.currentTopic === 'topics');
         }
      }
   })

   // topic select change handler
   on(topicSelect, 'change', () => {
      ctx.currentTopic = topicSelect.value.toLowerCase()
      getTasks(ctx.currentTopic)
   })
  
   // db select change handler
   on(dbSelect, 'change', async() => {
      ctx.DbKey = [dbSelect.value]
      console.log('About to init DB: ', ctx.TopicKey)
      await initDB()
   }) //TODO this is it?

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

   on(popupDialog, "keyup", (evt: Event) => {
      evt.preventDefault()
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

   if (DEV) console.log(`dom.initDom(94) calls refreshDisplay()!`)
   
   // initial display refresh
   refreshDisplay();
}
