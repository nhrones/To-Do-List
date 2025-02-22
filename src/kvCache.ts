// deno-lint-ignore-file no-explicit-any
import { DEV, KV_URL, ctx } from './context.ts'
import { Callback, DbRpcPayload, TaskType } from './types.ts'
import { buildTopics } from './db.ts'

export let todoCache: Map<string, TaskType[]> = new Map()

const callbacks: Map<number, Callback> = new Map()

export let socket: WebSocket

/** 
 * IDB init     
 * Hydrates the complete DB
 */
export function initCache() {

   // get the appropriate WebSocket protocol
   const wsProtocol = globalThis.location.protocol === "http:" ? "ws" : "wss";
   // flag localhost hostname
   const local = (globalThis.location.hostname === "localhost") 
   // build an appropriate socket url
   const socketURL = (local) 
      ? `${wsProtocol}://localhost:9099`
      : `${wsProtocol}://${KV_URL}/`;


   if (DEV) console.log('socket url = ', socketURL)
   // create new WebSocket
   socket = new WebSocket(socketURL)

   // inform when opened
   socket.onopen = async () => {
      return await hydrate()
   }
 
   // When we get a message from the service we expect 
   // an object containing {msgID, error, and result}.
   //
   // We then find a callback registered for this txID, 
   // and call it with the error and result properities.
   // This will resolve or reject the promise that was
   // returned to the client when the callback was created.
   socket.onmessage = (evt: MessageEvent) => {
      const { txID, error, result } = JSON.parse(evt.data)  // unpack
      if (!callbacks.has(txID)) return                      // check
      const callback = callbacks.get(txID)                  // fetch
      callbacks.delete(txID)                                // clean up
      if (callback) callback(error, result);                // execute
   }
}

/** restore our cache from a json backup */
export function restoreCache(records: string) {
   const tasksObj = JSON.parse(records)
   todoCache = new Map(tasksObj)
   persist()
}

/** The `remove` method mutates - will call the `persist` method. */
export function removeFromCache(key: string): boolean {
   const result = todoCache.delete(key)
   if (result === true) persist()
   return result
}

/** The `get` method will not mutate records */
export const getFromCache = (key: string) => {
   return todoCache.get(key)
}

/** The `set` method mutates - will call the `persist` method. */
export function setCache(key: string, value: any, topicChanged = false) {
   todoCache.set(key, value)
   persist()
   if (topicChanged) globalThis.location.reload();
}

/** hydrate a dataset from a single raw record stored in a KvDB */
async function hydrate() {
   // make a remote procedure call to get our record
   const result = await request({ procedure: 'GET', key: ctx.DbKey, value: '' })

   // did we return data for the key in KvDB?
   if (result === 'NOT FOUND') 
      console.log(`kvCache.hydrate -- result = 'NOT FOUND'!`);

   // load our local cache
   todoCache = new Map(result.value)
   buildTopics()
}

/** 
 * Persist the current dbMap to the remote KvDB    
 * This is called for any mutation of the todoCache (set/delete)     
 */
async function persist() { 
   // get the complete cache-Map array
   const todoArray = Array.from(todoCache.entries())
   // request remote proceedure to SET the 'DbKey' key with this string
   await request({ procedure: 'SET', key: ctx.DbKey, value: todoArray })
}

/** 
 * Transaction request to our KV-RPC-service    
 * 
 * We give each request a unique txID.    
 * We then create/save a promise callback for the txID.    
 * Finally, we return a promise for this callback.   
 * Our dbWorker will signal when the rpc has been fulfilled.   
 * At that time we lookup our callback, and fulfill the promise.    
 * This is how we implement async-transactions with    
 * our RPC-service. We never need toblock the UI.
 */
function request(newRequest: DbRpcPayload): Promise<any> {
   const txID = ctx.nextTxId++
   return new Promise((resolve, reject) => {
      if (socket.readyState === WebSocket.OPEN) { 
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
