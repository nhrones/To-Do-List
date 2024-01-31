
const DB_NAME = "TodoDB";
const STORE_NAME = "ObjectStore";
const idbChannel = new BroadcastChannel("IDB")
const logChannel = new BroadcastChannel("LOG")
let objectStore = null;

function post(txID, error, result) {
   //logChannel.postMessage('====== WORKER POSTING!')
   if (error) {
      console.error("Worker caught an error:", error);
      idbChannel.postMessage({ msgID: txID, error: { message: error.message }, result: null });
   } else if (result === void 0) {
      console.info("Not Found!");
      idbChannel.postMessage({ msgID: txID, error: null, result: "NOT FOUND" });
   } else {
      idbChannel.postMessage({ msgID: txID, error: null, result });
   }
}

idbChannel.onmessage = function (evt) {
   const data = evt.data;
   const { txID, payload } = data;
   const { procedure, key, value } = payload;
   switch (procedure) {
      case "SET":
         set(key, value).then(() => {
            post(txID, null, "saved - " + key);
         }).catch((_e) => {
            post(txID, "error saving - " + key, null);
         });
         break;
      case "GET":
         console.log('Worker GET: ', key)
         get(key).then((val) => {
            post(txID, null, val);
         }).catch((_e) => {
            post(txID, "error getting - " + key, null);
         });
         break;
      default: {
         const errMsg = `Oppps: idbWorker got an unknown proceedure call - "procedure"`;
         post(txID, errMsg, null);
         console.error(errMsg);
      }
         break;

   }
}

function promisifyRequest(request) {
   return new Promise((resolve, reject) => {
      request.oncomplete = request.onsuccess = () => resolve(request.result);
      request.onabort = request.onerror = () => reject(request.error);
   });
}

async function createStore(dbName, storeName) {
   const request = indexedDB.open(dbName);
   request.onupgradeneeded = () => request.result.createObjectStore(storeName);
   const db = await promisifyRequest(request);
   return (txMode, callback) => {
      return callback(db.transaction(storeName, txMode).objectStore(storeName));
   };
}

async function getStore() {
   if (!objectStore) {
      objectStore = await createStore(DB_NAME, STORE_NAME);
   }
   return objectStore;
}

async function set(key, value) {
   return (await getStore())("readwrite", 
      (store) => promisifyRequest(store.put(value, key)));
}

async function get(key) {
   return (await getStore())("readonly", 
      (store) => promisifyRequest(store.get(key)));
}
