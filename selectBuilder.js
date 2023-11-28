
import { $ } from './utils.js'

/** 
 * Build the select element.
 * @param {*}  Options object.
 * @returns void
 */
export function buildSelectElement(options) {
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
function addOptionGroup(selectElement, label, options) {
   let len = options.length
   let optionElement
   let optionGroup = document.createElement('optgroup')
   optionGroup.label = label;
   for (let i = 0; i < len; ++i) {
      optionElement = document.createElement('option');
      optionElement.textContent = options[i].name;
      optionElement.value = options[i].value;
      optionGroup.appendChild(optionElement);
   }
   selectElement.appendChild(optionGroup);
   return optionGroup;
}
