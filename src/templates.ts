import { TaskType } from './types.ts'

/** build a task element template string */
export function taskTemplate(index: number, item: TaskType) {
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
   </div> `;
} 