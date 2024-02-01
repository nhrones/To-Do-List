import { restoreCache, todoCache } from './dbCache.ts'
//TODO fix export to json
/**
 * export data from persitence
 * @returns void - calls saveDataFile()
 */
export function backupData() {
   // get all todo records
   const jsonData = JSON.stringify(Array.from(todoCache.entries()))
   const link = document.createElement("a");
   const file = new Blob([jsonData], { type: 'application/json' });
   link.href = URL.createObjectURL(file);
   link.download = "backup.json";
   link.click();
   URL.revokeObjectURL(link.href);
}

/**
 * import data from Kv
 * @returns data - 
 */
export function restoreData() {
   
   const fileload = document.getElementById('fileload') as HTMLInputElement
   fileload.click()
   fileload.addEventListener('change', function () {
      let reader = new FileReader();
      reader.onload = function () {
         //TODO load the todoCache Map
         //console.log(reader.result);
         //const records = JSON.parse(reader.result as string)
         restoreCache(reader.result as string)
         //todoCache = new Map(records)
         //console.log(todoCache.get("topics"))
         //console.log(thisMap.get("topics"))
      }
      //@ts-ignore 
      reader.readAsText(this.files[0]);
   })
}
