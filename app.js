import {$,on} from './utils.js'
import { init } from './dom.js'
import { getAll } from './persist.js';
import { refreshDisplay } from './tasks.js'
 
let topic = ''
var topicSelect = $("topics");
on(topicSelect, 'change', (e) => {
   topic = topicSelect.value.toLowerCase() 
   console.log(topic)
   getAll(topic)
   refreshDisplay();
}) 

// initialize all DOM elements, all event handlers 
// and any persisted tasks
init(topic)
