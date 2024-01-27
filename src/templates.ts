// deno-lint-ignore-file no-explicit-any

/** 
 * build a task element template string
 * @param {number} index an index used in id 
 * @param {object} item the task item
 * @returns {string} a task element template
 */
export function taskTemplate(index: any, item: any) {
   const { disabled, text } = item
   return `
   <div class="todo-container">
      <input type="checkbox" 
         id="checkbox-${index}" 
         class="todo-checkbox" 
         data-index=${index}
      ${(disabled) ? "checked" : "" }>
      <pre WIDTH="40"
         id="todo-${index}" 
         class="${(disabled) ? "disabled" : "" }" 
         data-index=${index}>${text}
      </pre>
   </div>
 `;
} 