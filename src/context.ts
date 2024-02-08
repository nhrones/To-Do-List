import type { CTX } from './types.ts'

export const KV_URL = 'ndh-servekv.deno.dev' 
export const DEV = true

/**
 * app context object
 */
export const ctx: CTX = {
   currentTopic: "topics",
   DB_KEY: 'TODOS',
   nextTxId: 0,
   thisKeyName: '',
   tasks: [],
}

// deno-lint-ignore-file no-explicit-any
/**
 * Shortcut for document.getElementById
 * @param {String} id String that specifies the ID value. 
 * @returns reference to the first object with the specified value of the ID attribute.
 */
export const $ = (id: string) => document.getElementById(id)

/**
 * on - adds an event handler to an htmlElement
 * @param {HTMLElement} el an HTMLElement to add a listener to 
 * @param {String} event The name of the event to be handled
 * @param {Function} callback The event-handler callback function
 * @returns void  
 */
export const on = (
   elem: HTMLElement,
   event: string,
   listener: EventListener) => elem.addEventListener(event, listener)

