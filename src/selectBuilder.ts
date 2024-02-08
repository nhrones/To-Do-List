import { topicSelect } from './dom.ts'

export function resetTopicSelect() {
   topicSelect.innerHTML = '<option value="" disabled selected hidden>Select A Todo Topic</option>'
}


/** 
 * Build selectTag option group.
 * @param {*} selectElement select element to add a group to.
 * @param {*} label Label for option group.
 * @param {*} options Array of optionElement properties.
 * @returns an HTMLOptGroupElement
 */
export function addOptionGroup(label: string, options: {title: string, key: string}[]) {
   const len = options.length
   let optionElement: HTMLOptionElement
   const optionGroup = document.createElement('optgroup')
   optionGroup.label = label;
   for (let i = 0; i < len; ++i) {
      optionElement = document.createElement('option');
      optionElement.textContent = options[i].title || 'fuck';
      optionElement.value = options[i].key || 'fuck';
      optionGroup.appendChild(optionElement);
   }
   topicSelect.appendChild(optionGroup);
   return optionGroup;
}
