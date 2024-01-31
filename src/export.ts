//import { fetchAll } from './db.ts'
//TODO fix export to json
/**
 * export data from persitence
 * @returns void - calls saveDataFile()
 */
export function backupData() {
   // gat all todo records
   const data: unknown = {}//HACKfetchAll()
   console.info('todo export data: ', data)
   localStorage.setItem('todo_backup', JSON.stringify(data, null, 2));
   const raw = localStorage.getItem('todo_backup')?? ""
   console.info('raw from localStorage: ', raw)
}

/**
 * import data from Kv
 * @returns data - 
 */
export function restoreData() {
   //const raw = localStorage.getItem('todo_backup')?? ""
   //console.info('raw from localStorage: ', raw)
}