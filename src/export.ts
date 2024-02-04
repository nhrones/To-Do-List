import { restoreCache, todoCache } from './dbCache.ts'

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
 * import data from backup file
 */
export function restoreData() {
   
   const fileload = document.getElementById('fileload') as HTMLInputElement
   fileload.click()
   fileload.addEventListener('change', function () {
      let reader = new FileReader();
      reader.onload = function () {
         restoreCache(reader.result as string)
         window.location.reload()
      }
      //@ts-ignore 
      reader.readAsText(this.files[0]);
   })
}
