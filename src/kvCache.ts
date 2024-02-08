import { DEV, ctx, sleep } from './context.ts'
import { Callback, DbRpcPackage, TaskType } from './types.ts'
import { buildTopics } from './db.ts'

export let todoCache: Map<string, TaskType[]> = new Map()

const callbacks: Map<number, Callback> = new Map()

export let socket: WebSocket

/** 
 * IDB init     
 * Hydrates the complete DB
 */
export async function init() {

   if (DEV) console.log(`kvCache.init(36)!`)

   const wsProtocol = window.location.protocol === "http:" ? "ws" : "wss";
   const local = (window.location.hostname === "localhost") 
   const socketURL = (local) 
      ? `${wsProtocol}://localhost:8765`
      : `ws://ndh-servekv.deno.dev/`;

   console.log('socketURL = ', socketURL)
   socket = new WebSocket(socketURL)
   // inform when opened
   socket.onopen = async () => {
      if (DEV) console.log('socket.opened');
      if (DEV) console.log(`kvCache.init(51) awaits kvCache.hydrate()!`)
      return await hydrate()
   }
 
   // When we get a message from the worker we expect 
   // an object containing {msgID, error, and result}.
   //
   // We then find a callback registered for this msgID, 
   // and call it with the error and result properities.
   // This will resolve or reject the promise that was
   // returned to the client when the callback was created.
   socket.onmessage = (evt: MessageEvent) => {
      const { txID, error, result } = JSON.parse(evt.data)  // unpack
      if (DEV) console.log(`socket.onmessage txID = ${txID}`)
      if (!callbacks.has(txID)) return          // check
      const callback = callbacks.get(txID)      // fetch
      callbacks.delete(txID)                    // clean up
      if (callback) {
         if (DEV) console.info(`found and calling ${callback}`)
         callback(error, result)                // execute
      }
   }
   // if (DEV) console.log(`kvCache.init(51) awaits kvCache.hydrate()!`)
   // // hydrate our todo data 
   // return await hydrate()
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
   console.log('kvCache setting ', value)
   persist()
   if (topicChanged) window.location.reload();
}

/**
 * hydrate a dataset from a single raw record stored in IndexedDB           
 */
async function hydrate() {
   //while(socket.readyState != 1) { }
   if (DEV) console.log(`kvCache.hydrate(85) sleeps(100ms)!`)
   // prevent a worker race condition
   //await sleep(1000);
   if (DEV) console.log(`kvCache.hydrate(88) awaits GET DB_KEY!`)
   // make a remote procedure call to get our record
   let result = await request({ procedure: 'GET', key: ['TODOS'], value: '' })
   if (DEV) console.log(`kvCache.hydrate(91) returns result!`)
   // did we return data for the key in IDB?
   if (result === 'NOT FOUND') {
      if (DEV) console.log(`kvCache.hydrate(94) result 'NOT FOUND'!`)
      // no data found -- we'll need a minimal 
      // default 'topics' set to start up
      set("topics",
         [
            {
               text: `Topics
      Todo App Topics, topics`,
               disabled: false
            }
         ], 
         true
      )

      // a recursive call after setting defaults
      return await hydrate();
   }
   if (DEV) console.log(`kvCache.hydrate(110) new Map(result)!`)
   // load our local cache
   console.info(`hydrate result type ${typeof result}  `,result)
   //todoCache = new Map(JSON.parse(result.value))
   todoCache = new Map(result.value)
   buildTopics()
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
   await request({ procedure: 'SET', key: ['TODOS'], value: todoArray })
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

   const txID = ctx.nextTxId++
   return new Promise((resolve, reject) => {
      if (socket.readyState === 1) {// open
         // set promise callback for this id
         callbacks.set(txID, (error: any, result: any) => {
            if (error) reject(new Error(error.message))
            resolve(result)
         })
         socket.send(JSON.stringify({ txID: txID, payload: newRequest }))
      } else {
         console.log('Socket not yet open!')
      }

   })
}
