import { DEV, ctx, sleep } from '../src/context.ts'
import { Callback, DbRpcPackage, TaskType } from '../src/types.ts'

//TODO context ?
export let todoCache: Map<string, TaskType[]> = new Map()

const callbacks: Map<number, Callback> = new Map()
const idbChannel = new BroadcastChannel("IDB")
const idbWorker = new Worker('./dist/idbWorker.js')

idbWorker.onerror = (event) => {
   console.log("There is an error with your worker!");
};

/** 
 * IDB init     
 * Hydrates the complete DB
 */
export async function init() {
   if (DEV) console.log(`dbCache.init(36)!`)
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
   if (DEV) console.log(`dbCache.init(51) awaits dbCache.hydrate()!`)
   // hydrate our todo data 
   return await hydrate()
}

export function restoreCache(records: string) {
   const tasksObj = JSON.parse(records)
   todoCache = new Map(tasksObj)
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

/** The `set` method mutates - will call the `persist` method. */
export function set(key: string, value: any, topicChanged = false) {
   todoCache.set(key, value)
   persist()
   if (topicChanged) window.location.reload();
}

/**
 * hydrate a dataset from a single raw record stored in IndexedDB           
 */
async function hydrate() {
   if (DEV) console.log(`dbCache.hydrate(85) sleeps(100ms)!`)
   // prevent a worker race condition
   //await sleep(100);
   if (DEV) console.log(`dbCache.hydrate(88) awaits GET DB_KEY!`)
   // make a remote procedure call to get our record
   //let result = await request({ procedure: 'GET', key: ['TODOS'], value: '' })
   try {
      request({ procedure: 'GET', key: ['TODOS'], value: '' }).then((result) => {
         if (DEV) console.log(`dbCache.hydrate(91) returns result!`)
         // did we return data for the key in IDB?
         if (result === 'NOT FOUND') {
            if (DEV) console.log(`dbCache.hydrate(94) result 'NOT FOUND'!`)
            // no data found -- we'll need a minimal 
            // default 'topics' set to start up
            //    set("topics",
            //       [
            //          {
            //             text: `Topics
            // Todo App Topics, topics`,
            //             disabled: false
            //          }
            //       ]
            //    )

            // a recursive call after setting defaults
            //return await hydrate();
         }
         if (DEV) console.log(`dbCache.hydrate(110) new Map(result)!`)

         // load our local cache
         todoCache = new Map(result)
      })
   } catch (err) {
      console.error(JSON.stringify(err))
   }
   return null
}

/** 
 * Persist the current dbMap to an IndexedDB 
 * off-thread, using our webworker.    
 * This is called for any mutation of the todoCache (set/delete)     
 */
async function persist() {
   // get the complete cache-Map
   let todoArray = Array.from(todoCache.entries())
   // request remote proceedure to SET the 'TODOS' key with the cache-string
   //await request({ procedure: 'SET', key: ctx.DB_KEY, value: todoArray })
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
function request(newRequest: DbRpcPackage): Promise<any> {
   console.log(`dbCache request!`)
   const txID = ctx.nextTxId++
   console.log(`returning promise for txID!`)
   return new Promise((resolve, reject) => {
      // set promise callback for this id
      callbacks.set(txID, (error: any, result: any) => {
         if (error) reject(new Error(error.message))
         console.log(`resolving txID: ${txID}`)
         resolve(result)
      })
      console.log(`dbCache request, postMessage:!`, txID)
      idbChannel.postMessage({ txID: txID, payload: newRequest })
   })
}
