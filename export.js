import { saveDataFile } from './utils.js'

/**
 * export data from localStorage
 * @returns void - calls saveDataFile()
 */
export function exportData() {
   const data = Object.assign({}, localStorage)
   let content = ''
   for (const element in data) {
      content += formatData(data[element], element)
      console.log(content)
   };
   saveDataFile('data-dump.txt', content)
}

/**
 * format k/v record for export
 * @param {string} jsonValue 
 * @param {string} element 
 * @returns a formated string 
 */
function formatData(jsonValue, element) {
   const parsedValue = JSON.parse(jsonValue)
   const len = parsedValue.length
   let dataString = `
${element}:`
   for (let i = 0; i < len; i++) {
      dataString += `
   ${JSON.parse(jsonValue)[i].text}`
   }
   return dataString
}

