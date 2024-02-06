import { addOptionGroup } from './selectBuilder.ts'
import { refreshDisplay } from './tasks.ts'
import { popupText, popupDialog } from './dom.ts'
import * as Cache from './dbCache.ts'
import { DEV, ctx } from './context.ts'


/**
 * init Data
 * Hydrates cache data from IDB
 */
export async function initDB() {
   if (DEV) console.log(`db.initDB(14) awaits Cache.init()!`)
   /** hydrate db */
   await Cache.init()
   if (DEV) console.log(`db.initDB(17) return from Cache.init()!`)
   if (DEV) console.log(`db.initDB(18) calls buildTopics()!`)
   // assemble the topics drop-down UI
   buildTopics()
}

/**
 * Retrieve array of tasks from the service     
 * or initialize an empty task array 
 * @param {string} key the name of the record to fetch (data-key)
 */
export function getTasks(key = "") {
   ctx.thisKeyName = key
   if (key.length) {
      let data = Cache.get(key) ?? []
      if (data === null) {
         console.log(`No data found for ${ctx.thisKeyName}`)
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

   let data = Cache.get("topics")

   for (let i = 0; i < data!.length; i++) {
      const element = data![i];
      const parsedTopics = parseTopics(data![i])
      addOptionGroup(parsedTopics.group, parsedTopics.entries)
   }
   if (DEV) console.log(`db.buildTopics(60) completed!`)
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
export function saveTasks(topicChanged?: boolean) {
   Cache.set(ctx.thisKeyName, ctx.tasks, topicChanged)
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