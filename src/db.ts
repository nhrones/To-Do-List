import { addOptionGroup } from './selectBuilder.ts'
import { refreshDisplay } from './tasks.ts'
import { popupText, popupDialog } from './dom.ts'
import * as Cache from './dbCache.ts'

export const TodoTasks: Map<string, any[]> = new Map()


/**
 * init Data
 * Hydrates cache data from IDB
 */
export async function initDB() {

   /** hydrate db */
   await Cache.init()

   // assemble the topics drop-down UI
   buildTopics()

}

/** an array of todo tasks to be presented */
export let tasks: { text: string, disabled: boolean }[] = []

/** the name of a data-key */
let keyName = ''

/**
 * Retrieve array of tasks from the service     
 * or initialize an empty task array 
 * @param {string} key the name of the record to fetch (data-key)
 */
export function getTasks(key = "") {
   keyName = key
   if (key.length) {
      let data = Cache.get(key) ?? []
      if (data === null) {
         console.log(`No data found for ${keyName}`)
         data = []
      }
      tasks = data
      refreshDisplay();
   }
}

/**
 * build a set of select options
 */
export const buildTopics = () => {

   let data = Cache.get("topics")

   for (let i = 0; i < data.length; i++) {
      const element = data[i];
      const parsedTopics = parseTopics(data[i])
      addOptionGroup(parsedTopics.group, parsedTopics.entries)
   }
}

/**
 * parseTopics
 * @param topics - array 
 * @returns array 
 */
function parseTopics(topics: any) {

   const topicObject: {
      group: string,
      entries: { title: string, key: string }[]
   } = { group: "", entries: [] }

   const thisTopic = topics
   const txt = thisTopic.text as string
   const lines = txt.split('\n')
   topicObject.group = lines[0].trim()

   for (let i = 1; i < lines.length; i++) {
      let newObj = { title: "", key: "" }
      const element = lines[i];
      const items = element.split(',')
      const title = items[0]
      const keyName = items[1].trim()
      newObj.title = title
      newObj.key = keyName
      topicObject.entries[i-1] = newObj
   }
return topicObject
}

/** Save all tasks */
export function saveTasks(from: string) {
   Cache.set(keyName, tasks)
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
   saveTasks('delete completed');
   popupText.textContent = `Removed ${numberDeleted} tasks!`
   popupDialog.showModal()
}