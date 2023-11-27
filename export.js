
let txt = ''

/**
 * export data from localStorage
 */
export function exportData() {
   const data = Object.assign({}, localStorage)
   for (const element in data) {
      showData(data, element)
   };
   saveDataFile('data-dump.txt', txt)
}

function showData(data, element) {
   const val = data[element]
   const parsedVal = JSON.parse(val)
   const len = parsedVal.length
   let dump = `
${element}:`
   for (let i = 0; i < len; i++) {
      dump += `
   ${JSON.parse(val)[i].text}`
   }
   txt += dump
}

function saveDataFile(fileName, content) {
   let a = document.createElement('a');
   a.href = "data:application/octet-stream," + encodeURIComponent(content);
   a.download = fileName;
   a.click();
};
