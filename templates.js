
/** returns a collapsed tree element */
export function taskTemplate(index, item) {
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