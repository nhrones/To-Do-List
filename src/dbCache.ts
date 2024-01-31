import { sleep } from './utils.ts'
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
   console.log('---persist.init() calling persist.hydrate()')
   // hydrate our todo data 
   return await hydrate()
}

/** 
 * The `remove` method mutates - will call the `persist` method. 
 */
export function remove(key: string): any {
   let result = todoCache.delete(key)
   if (result === true) persist()
   return result
}

/** 
 * The `get` method will not mutate records 
 */
export const get = (key: string) => {
   const tasks = todoCache.get(key)
   return tasks;
}


/** 
 * The `set` method mutates - will call the `persist` method. 
 */
export function set(key: string, value: any) {
   console.info('setting value ', value)
   todoCache.set(key, value)
   persist()
}

/**
 * hydrate a dataset from a single raw record stored in IndexedDB    
 * hydrating 100,000 objects takes ~ 295ms :      
 *     DB-Fetch: 133.00ms    
 *     JSON.Parse: 145.30ms    
 *     Build-Map: 16.80ms        
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
               text: `Topics   
               Todo App Topics, key = topics`,
               disabled: false
             }
         ]
      )

      // a recursive call after setting defaults
      return await hydrate();
   }

   // create a proper records container for our todoCache-Map
   let records: Iterable<readonly [string, string]> | null | undefined

   // we expect a string - so we''l need to parse it first
   if (typeof result === 'string') records = JSON.parse(result)

   // load our local cache
   todoCache = new Map(records)
}

/** 
 * Persist the current dbMap to an IndexedDB 
 * off-thread, using our webworker.    
 * This is called for any mutation of the todoCache (set/delete)     
 */
async function persist() {

   // stringify the complete cache-Map
   let todoString = JSON.stringify(Array.from(todoCache.entries()))

   // request remote proceedure to SET the 'TODO' key with the cache-string
   await request({ procedure: 'SET', key: TODO_KEY, value: todoString })
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
      console.log('idbChannel.postMessage ', newRequest.procedure)
      idbChannel.postMessage({ txID: txID, payload: newRequest })
   })
}
