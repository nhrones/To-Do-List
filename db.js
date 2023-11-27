import { buildSelect } from './selectBuilder.js'
import { baseSelections, selections } from './selections.js'

export let tasks = []

let storeName = 'topics'

/** 
 * Retrieve tasks from local storage 
 * or initialize an empty array 
 */
export const getAll = (topic = "") => {
   storeName = topic
   tasks = JSON.parse(localStorage.getItem(topic)) || [];
   //console.info(`getAll tasks for ${topic} `, tasks)
}

export const buildTopics = () => {

   //localStorage.setItem("topics", JSON.stringify(selections));

   let raw = localStorage.getItem("topics")
   if (raw === null) {
      localStorage.setItem("topics", JSON.stringify(baseSelections));
      raw = localStorage.getItem("topics")
   }

   //console.info('raw', raw)
   const parsedTopics = JSON.parse(raw)
   //console.info('parsedTopics ', parsedTopics)
   //console.log(JSON.parse(parsedTopics[0].text))
   for (let index = 0; index < parsedTopics.length; index++) {
      const element = parsedTopics[index];
      //console.info(`element `,element)
      const t = JSON.parse(`${parsedTopics[index].text}`)
      //console.info('parsedTopics[0].text ', t)
      buildSelect(t)
   }
}

/**
 * Save all tasks to local storage
 */
export function saveAll() {
   localStorage.setItem(storeName, JSON.stringify(tasks, null, 2));
}

/** 
 * Delete completed tasks
 */
export function deleteCompleted() {
   const savedtasks = []
   tasks.forEach((task) => {
      if (task.disabled === false) savedtasks.push(task)
   })
   tasks = savedtasks
   saveAll()
}