import { buildSselect } from './selectBuilder.js'
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
}

export const buildTopics = () => {

   //localStorage.setItem("topics", JSON.stringify(selections));

   let raw = localStorage.getItem("topics")
   if (raw === null) {
      localStorage.setItem("topics", JSON.stringify(baseSelections));
      raw = localStorage.getItem("topics")
   }
   const parsedTopics = JSON.parse(raw)
   buildSselect(JSON.parse(parsedTopics[0].text))
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