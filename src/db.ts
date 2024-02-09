import { addOptionGroup, resetTopicSelect } from './selectBuilder.ts'
import { refreshDisplay } from './tasks.ts'
import { popupText, popupDialog } from './dom.ts'
import { initCache, getFromCache, setCache } from './kvCache.ts'
import { DEV, ctx } from './context.ts'


/**
 * init Data
 * Hydrates cache data from IDB
 */
export async function initDB() {
   // hydrate from db
   await initCache()
}

/**
 * Retrieve array of tasks from the service     
 * or initialize an empty task array 
 * @param {string} key the name of the record to fetch (data-key)
 */
export function getTasks(key = "") {
   ctx.thisKeyName = key
   if (key.length) {
      let data = getFromCache(key) ?? []
      if (data === null) {
         if (DEV) console.log(`No data found for ${ctx.thisKeyName}`)
         data = []
      }
      ctx.tasks = data
      refreshDisplay();
   }
}

/**
 * build a set of select options
 */
export function buildTopics () {
   const data = getFromCache("topics")
   resetTopicSelect()
   for (let i = 0; i < data!.length; i++) {
      const parsedTopics = parseTopics(data![i])
      addOptionGroup(parsedTopics.group, parsedTopics.entries)
   }
}

/**
 * parseTopics
 * @param topics - array 
 * @returns array 
 */
// deno-lint-ignore no-explicit-any
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
      const newObj = { title: "", key: "" }
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
export function saveTasks(topicChanged?: boolean) {
   setCache(ctx.thisKeyName, ctx.tasks, topicChanged)
}

/** 
 * Delete completed tasks
 */
export function deleteCompleted() {
   const savedtasks: { text: string, disabled: boolean }[] = []
   let numberDeleted = 0
   ctx.tasks.forEach((task) => {
      if (task.disabled === false) {
         savedtasks.push(task)
      } else {
         numberDeleted++
      }
   })
   ctx.tasks = savedtasks
   saveTasks((ctx.currentTopic === 'topics'));
   popupText.textContent = `Removed ${numberDeleted} tasks!`
   popupDialog.showModal()
}