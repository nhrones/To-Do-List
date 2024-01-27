// deno-lint-ignore-file no-explicit-any no-prototype-builtins

import { $ } from './utils.ts'

/** 
 * Build the select element.
 * @param {*}  options object.
 * @returns void
 */
export function buildSelectElement(options: any) {
   const selectElement = $("topics") 
   for (const prop in options) {
      if (options.hasOwnProperty(prop)) {
         addOptionGroup(selectElement, prop, options[prop]);
      }
   }
}

/** 
 * Build selectTag option group.
 * @param {*} selectElement select element to add a group to.
 * @param {*} label Label for option group.
 * @param {*} options Array of optionElement properties.
 * @returns an HTMLOptGroupElement
 */
function addOptionGroup(selectElement: any, label: any, options: any) {
   const len = options.length
   let optionElement
   const optionGroup = document.createElement('optgroup')
   optionGroup.label = label;
   for (let i = 0; i < len; ++i) {
      optionElement = document.createElement('option');
      optionElement.textContent = options[i].title;
      optionElement.value = options[i].key;
      optionGroup.appendChild(optionElement);
   }
   selectElement.appendChild(optionGroup);
   return optionGroup;
}
