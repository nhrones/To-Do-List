/**
 * Shortcut for document.getElementById
 * @param {String}  — String that specifies the ID value. 
 * @returns a reference to the first object with the specified value of the ID attribute.
 */
export const $ = (id) => document.getElementById(id)

/**
 * on - adds an event handler to an htmlElement
 * @param {HTMLElement} el the element to add the listener to 
 * @param {string} event The event name to handle
 * @param {function} calback The event handler callback function
 * @returns void  
 */
export const on = (el, event, callback) => el.addEventListener(event, callback)

/**
 * save text content to a file
 * @param {*} fileName 
 * @param {*} content 
 */
export function saveDataFile(fileName, content) {
   let a = document.createElement('a');
   a.href = "data:application/octet-stream," + encodeURIComponent(content);
   a.download = fileName;
   a.click();
};