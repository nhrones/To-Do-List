import { buildSelectElement } from './selectBuilder.js'
import { baseSelections, selections } from './selections.js'

/** an array of todo tasks to be presented */
export let tasks = []

/** the name of a data-key */
let keyName = 'topics'

/**
 * Retrieve array of tasks from local storage     
 * or initialize an empty task array 
 * @param {string} key the name of the record to fetch (data-key)
 */
export const getAllTasks = (key = "") => {
   keyName = key
   tasks = JSON.parse(localStorage.getItem(key)) || [];
}

/**
 * build a set of select options
 */
export const buildTopics = () => {

   //localStorage.setItem("topics", JSON.stringify(selections));

   let raw = localStorage.getItem("topics")
   if (raw === null) {
      localStorage.setItem("topics", JSON.stringify(baseSelections));
      raw = localStorage.getItem("topics")
   }

   const parsedTopics = JSON.parse(raw)
   for (let index = 0; index < parsedTopics.length; index++) {
      const element = parsedTopics[index];
      const options = JSON.parse(`${parsedTopics[index].text}`)
      buildSelectElement(options)
   }
}

/**
 * Save all tasks to local storage
 */
export function saveTasks() {
   localStorage.setItem(keyName, JSON.stringify(tasks, null, 2));
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
   saveTasks()
}