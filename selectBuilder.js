
import { $ } from './utils.js'

/** 
 * Build the select.
 * @param {*}  Options object.
 */
export function buildSelect(opt) {
   const selectElement = $("topics") 
   let prop;
   //selectElement.size = 0;
   //selectElement.id = "topics"
   for (prop in opt) {
      if (opt.hasOwnProperty(prop)) {
         addOptionGroup(selectElement, prop, opt[prop]);
      }
   }
}

/** 
 * Build selectTag option group.
 * @param {*} selectElement select element to add a group to.
 * @param {*} label Label for option group.
 * @param {*} options Array of optionElement properties.
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
