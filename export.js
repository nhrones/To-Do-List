import { saveDataFile } from './utils.js'

/**
 * export data from localStorage
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

function formatData(val, element) {
   const parsedVal = JSON.parse(val)
   const len = parsedVal.length
   let dump = `
${element}:`
   for (let i = 0; i < len; i++) {
      dump += `
   ${JSON.parse(val)[i].text}`
   }
   return dump
}

