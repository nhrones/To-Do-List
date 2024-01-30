import { buildSelectElement } from './selectBuilder.ts'
import { refreshDisplay } from './tasks.ts'
import { popupText, popupDialog } from './dom.ts'
import * as RemoteIDB from './persist.ts'

/** hydrate db */
await RemoteIDB.init()

//========================================================
// let tasklists = ``

// Object.entries(localStorage).forEach(([ key, value ]) => {
//    tasklists += `${key} = ${value}

   
// `;
// })
// console.clear()
// console.clear()
// console.log(tasklists)
//=========================================================

export const TodoTasks:Map<string, any[]> = new Map()

/** an array of todo tasks to be presented */
export let tasks: { text: string, disabled: boolean }[] = []

/** the name of a data-key */
let keyName = 'topics'

/**
 * Retrieve array of tasks from the service     
 * or initialize an empty task array 
 * @param {string} key the name of the record to fetch (data-key)
 */
export function getTasks(key = "") {
   keyName = key
   if (key.length) {
      let data = RemoteIDB.get(key) ?? []
      if (data === null) {
         console.log(`No data found for ${keyName}`)
         data = []
      }
      if (typeof data === 'string') {
         tasks = JSON.parse(data) || []
      } else {
         tasks = data
      }

      refreshDisplay();
   }
}

/**
 * parseTopics
 * @param topics 
 * @returns 
 */
const parseTopics = (topics: string) => {
   const parsedTopics = (typeof topics === "string")
      ? JSON.parse(topics)
      : topics
   for (let index = 0; index < parsedTopics.length; index++) {
      const thisTopic = parsedTopics[index]
      console.log('thisTopic.text = ', thisTopic.text)
      const txt = thisTopic.text as string
      const lines = txt.split('\n')
      console.info('lines ',lines)

      const topic = lines[0].trim()
      console.info('topic ',topic)

      let newText = `{"${topic}":[`
      for (let i = 1; i < lines.length; i++) {
         const element = lines[i];
         const items = element.split(',')
         const title = items[0]
         let k = items[1].split('=')
         const keyName = k[1].trim()
         newText += `{ "title": "${title}", "key": "${keyName}" },`
      }
      newText = newText.substring(0, newText.length - 1) + `] }`
      parsedTopics[index].text = newText
   }
   return parsedTopics
}

/**
 * build a set of select options
 */
export const buildTopics = () => {
   const data = RemoteIDB.get("topics")
   
   //if (data.length< 2) alert('No-Topics')

   const parsedTopics = parseTopics(data as string)
   if (parsedTopics != null) {
      for (let index = 0; index < parsedTopics.length; index++) {
         try {
            const options = JSON.parse(`${parsedTopics[index].text}`)
            buildSelectElement(options)
         } catch (_err) {
            console.log('error parsing: ', parsedTopics[index].text)
         }
      }
   } else {
      console.log(`No topics found!`)
   }

}

/**
 * Save all tasks
 */
export function saveTasks() {
   console.log(`Raw Tasks - `, tasks)
   const value = JSON.stringify(tasks, null, 2)
   console.log(`SaveTasks - setting "${keyName}" to ${value}`)
   RemoteIDB.set(keyName, value);
}

/** 
 * Delete completed tasks
 */
export function deleteCompleted() {
   const savedtasks: { text: string, disabled: boolean }[] = []
   let numberDeleted = 0
   tasks.forEach((task) => {
      if (task.disabled === false) {
         savedtasks.push(task)
      } else {
         numberDeleted++
      }
   })
   tasks = savedtasks
   saveTasks();
   popupText.textContent = `Removed ${numberDeleted} tasks!`
   popupDialog.showModal()
}