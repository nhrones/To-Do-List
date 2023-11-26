/**
 * Shortcut for document.getElementById
 * @param {String}  — String that specifies the ID value. 
 * @returns a reference to the first object with the specified value of the ID attribute.
 */
export const $ = (id) => document.getElementById(id)

/**
 * on - adds an event handler to an htmlElement
 * @param {*} el the element to add the listener to 
 * @param {*} event The event name to handle
 * @param {*} calback The event handler callback function
 * @returns void  
 */
export const on = (el, event, callback) => el.addEventListener(event, callback)
 