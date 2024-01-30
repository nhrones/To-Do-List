export type callback = (error: any, result: any) => void

export type DbRpcPackage = {
   procedure: 'GET' | 'SET',
   key: string,
   value?: string
}

export let todos: Map<string, any> = new Map()

const DEV = true

let nextTxId = 0

const callbacks: Map<number, callback> = new Map()

const idbWorker = new Worker('./dist/idbWorker.js')

const IDB_KEY = 'TODO'

/** 
 * db init 
 */
export async function init() {

   // When we get a message from the worker we expect 
   // an object containing {msgID, error, and result}.
   // We find the callback that was registered for this msgID, 
   // and call it with the error and result properities.
   // This will resolve or reject the promise that was
   // returned to the client when the callback was created.
   idbWorker.onmessage = (evt: MessageEvent) => {
      const { msgID, error, result } = evt.data // unpack
      if (!callbacks.has(msgID)) return         // check
      const callback = callbacks.get(msgID)     // fetch
      callbacks.delete(msgID)                   // clean up
      if (callback) callback(error, result)     // execute
   }
/*
[
   {text: "KV-Codecs↵ KV-Key-Codec, key = key-codec↵ KV-Value-Codec, key = value-codec",…}, {,…},…]
   {text: "KV-Codecs↵ KV-Key-Codec, key = key-codec↵ KV-Value-Codec, key = value-codec",…}
   {text: "Other↵ This Todo App, key = todo-app", disabled: false}
   {text: "Frameworks↵ DWM-ReactiveUI, key = reactive-ui↵ Vanilla Framework, key = vamfam",…}
   {text: "Utilities↵ Config, key = cfg↵ Other, key = cfg-other", disabled: false}
   {text: "Topics↵ Todo App Topics, key = topics", disabled: false}
]
*/

   //set("topics",[
   //    {"text": "Topics\n Todo App Topics, key = topics", "disabled": false}
   //])

   // hydrate our todo data 
   return await hydrate()
}

/** 
 * The `remove` method mutates - will call the `persist` method. 
 */
export function remove(key: string): any {
   let result = todos.delete(key)
   if (result === true) persist()
   return result
}

/** 
 * The `get` method will not mutate records 
 */
export const get = (key: string) => {
   const tasks = todos.get(key)
   console.info('todos:', todos)
   console.log(`IDB-get key ${key} = ${tasks}`)
   return tasks;
}


/** 
 * The `set` method mutates - will call the `persist` method. 
 */
export function set(key: string, value: any) {
   todos.set(key, value)
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
   let result = await request({ procedure: 'GET', key: IDB_KEY })
   console.info('result: ', result)
   if (!result) {

      set("topics",[
       {"text": "Topics\n Todo App Topics, key = topics", "disabled": false}
      ])

      await hydrate();
   }
   let records: Iterable<readonly [string, string]> | null | undefined
   if (typeof result === 'string') records = JSON.parse(result)
   todos = new Map(records)
   return todos
}

/** 
 * Persist the current dbMap to an IndexedDB using         
 * our webworker. (takes ~ 90 ms for 100k records)    
 * This is called for any mutation of the dbMap (set/delete)     
 */
async function persist() {
   let valueString = JSON.stringify(Array.from(todos.entries()))
   await request({ procedure: 'SET', key: IDB_KEY, value: valueString })
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
      idbWorker.postMessage({ txID: txID, payload: newRequest })
   })
}
