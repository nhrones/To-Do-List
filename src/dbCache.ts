import { sleep } from './utils.ts'
import { currentTopic } from './dom.ts'

export type callback = (error: any, result: any) => void

export type DbRpcPackage = {
   procedure: 'GET' | 'SET',
   key: string,
   value: any
}

export let todoCache: Map<string, any> = new Map()

const DEV = true

let nextTxId = 0

const callbacks: Map<number, callback> = new Map()

const idbWorker = new Worker('./dist/idbWorker.js')

idbWorker.onerror = (event) => {
   console.log("There is an error with your worker!");
};

const idbChannel = new BroadcastChannel("IDB")

const TODO_KEY = 'TODO'

/** 
 * IDB init     
 * Hydrates the complete DB
 */
export async function init() {

   // When we get a message from the worker we expect 
   // an object containing {msgID, error, and result}.
   //
   // We then find a callback registered for this msgID, 
   // and call it with the error and result properities.
   // This will resolve or reject the promise that was
   // returned to the client when the callback was created.
   idbChannel.onmessage = (evt: MessageEvent) => {
      const { msgID, error, result } = evt.data // unpack
      if (!callbacks.has(msgID)) return         // check
      const callback = callbacks.get(msgID)     // fetch
      callbacks.delete(msgID)                   // clean up
      if (callback) callback(error, result)     // execute
   }

   // hydrate our todo data 
   return await hydrate()
}

export function restoreCache(records: string) {
   const tasks = JSON.parse(records)
   todoCache = new Map(tasks)
   persist()
}

/** The `remove` method mutates - will call the `persist` method. */
export function remove(key: string): any {
   let result = todoCache.delete(key)
   if (result === true) persist()
   return result
}

/** The `get` method will not mutate records */
export const get = (key: string) => {
   return todoCache.get(key)
}
function confirmRefresh() {
   let text = "Topics Changed!\nRefresh?";
    //TODO replace this with a dialog
   if (confirm(text) == true) {
      window.location.reload();
   }
 }

/** The `set` method mutates - will call the `persist` method. */
export function set(key: string, value: any, topicChanged = false) {
   if (topicChanged) confirmRefresh(); 
   todoCache.set(key, value)
   persist()
}

/**
 * hydrate a dataset from a single raw record stored in IndexedDB           
 */
export async function hydrate() {

   // prevent a worker race condition
   await sleep(100);

   // make a remote procedure call to get our 'TODO' record
   let result = await request({ procedure: 'GET', key: TODO_KEY, value: '' })

   // did we return data for the 'TODO' key in IDB?
   if (result === 'NOT FOUND') {

      // no data found -- we'll need a minimal 
      // default 'topics' set to start up
      set("topics",
      [
         {
           text: `Apps   
      App1, app1
      App2, app2`,
           disabled: false
         },
         {
           text: `Topics
      Todo App Topics, topics`,
           disabled: false
         }
       ]
      )

      // a recursive call after setting defaults
      return await hydrate();
   }

   // load our local cache
   todoCache = new Map(result)
}

/** 
 * Persist the current dbMap to an IndexedDB 
 * off-thread, using our webworker.    
 * This is called for any mutation of the todoCache (set/delete)     
 */
async function persist() {

   // get the complete cache-Map
   let todoArray = Array.from(todoCache.entries())
   // request remote proceedure to SET the 'TODO' key with the cache-string
   await request({ procedure: 'SET', key: TODO_KEY, value: todoArray })
}

/** 
 * Transaction request to the IDB worker     
 * 
 * We give each request a unique txID.    
 * We then create/save a promise callback for the txID.    
 * Finally, we return a promise for this callback.   
 * Our dbWorker will signal when the rpc has been fulfilled.   
 * At that time we lookup our callback, and fulfill the promise.    
 * This is how we implement async transactions with    
 * our IndexedDB. Since most of the heavy lifting is    
 * on the worker, we never block the UI 
 */
export function request(newRequest: DbRpcPackage): Promise<any> {

   const txID = nextTxId++
   return new Promise((resolve, reject) => {
      // set promise callback for this id
      callbacks.set(txID, (error: any, result: any) => {
         if (error) reject(new Error(error.message))
         resolve(result)
      })

      idbChannel.postMessage({ txID: txID, payload: newRequest })
   })
}
