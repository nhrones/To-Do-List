
import { $ } from './utils.js'

/** 
 * Build option group.
 * @sel : Select element to add group to.
 * @lab : Label for option group.
 * @opts: Options Array.
 */
function addOptgroup(selectElement, label, options) {

   let len = options.length
   let optionElement
   let optionGroup = document.createElement('OPTGROUP')

   optionGroup.label = label;
   for (let i = 0; i < len; ++i) {
      optionElement = document.createElement('OPTION');
      optionElement.textContent = options[i].name;
      optionElement.value = options[i].value;
      optionGroup.appendChild(optionElement);
   }
   selectElement.appendChild(optionGroup);
   return optionGroup;
}

/** 
 * Build the select.
 * @opt : Options object.
 */
export function buildSelect(opt) {
   const selectElement = $("topics") 
   let prop;
   selectElement.size = 0;
   selectElement.id = "topics"
   for (prop in opt) {
      if (opt.hasOwnProperty(prop)) {
         addOptgroup(selectElement, prop, opt[prop]);
      }
   }
}
