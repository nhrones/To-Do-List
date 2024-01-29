import { buildSelectElement } from './selectBuilder.ts'
import { refreshDisplay } from './tasks.ts'
import { popupText, popupDialog } from './dom.ts'


export function fetchQuerySet() {

   const kv = Object.assign({}, window.localStorage);
   console.log('fetchQuerySet-kv: ', kv)
   // const kvJson = JSON.stringify(kv)
   // console.info(JSON.stringify(kv))
   // const parsed = JSON.parse(kvJson)
   // console.log(parsed)

   //for (let [key, value] of Object.entries(localStorage)) {
   //   console.log(`${key}: ${value}`);
   //}
}

function get(key = "topics") {
   console.log('getting ', key)
   const raw = localStorage.getItem(key)
   return (raw)
      ? JSON.parse(raw)
      : null;
}

function set(key: string, value: string) {
   localStorage.setItem(key, value);
}

// fetch all todo data
export function fetchAll() {
   let queryset = fetchQuerySet()
   if (queryset === null) {
      console.log(`No data found for todos!`)
   }
   if (typeof queryset === 'string') {
      queryset = JSON.parse(queryset) || []
   }
   return queryset
}

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
      let data = get(key)
      if (data === null) {
         console.log(`No data found for ${keyName}`)
         data = []
      }
      if (typeof data === 'string') {
         tasks = JSON.parse(data) || []
      } else {
         //@ts-ignore ?
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

   console.info('parsedTopics ', parsedTopics)
   for (let index = 0; index < parsedTopics.length; index++) {
      const thisTopic = parsedTopics[index]
      const txt = thisTopic.text as string
      const lines = txt.split('\n')
      const topic = lines[0].trim()
      let newText = `{"${topic}":[`
      for (let i = 1; i < lines.length; i++) {
         const element = lines[i];
         const items = element.split(',')
         const title = items[0]
         const keyName = items[1].split('=')[1].trim()
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
   const data: unknown = get("topics")
   console.info('data ', data)
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
 * Save all tasks to local storage
 */
export function saveTasks() {
   console.log(`Raw Tasks - `, tasks)
   const value = JSON.stringify(tasks, null, 2)
   console.log(`SaveTasks - setting "${keyName}" to ${value}`)
   set(keyName, value);
}

/** 
 * Delete completed tasks
 */
export function deleteCompleted() {
   const savedtasks: { text: string, disabled: boolean }[] = []
   let deleted = 0
   tasks.forEach((task) => {
      if (task.disabled === false) {
         savedtasks.push(task)
      } else {
         deleted++
      }
   })
   tasks = savedtasks
   saveTasks();
   popupText.textContent = `Removed ${deleted} tasks!`
   popupDialog.showModal()
}