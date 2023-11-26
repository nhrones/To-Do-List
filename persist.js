export let tasks = []
let storeName = 'todos'
/** 
 * Retrieve todo from local storage 
 * or initialize an empty array 
 */
export const getAll = (topic) => {
   storeName = topic + '-todos'
   tasks = JSON.parse(localStorage.getItem(storeName)) || [];
}
 
/**
 * Save all tasks to local storage
 */
export function saveAll() {
   localStorage.setItem(storeName, JSON.stringify(tasks));
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