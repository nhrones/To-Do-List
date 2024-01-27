/// <reference lib="dom" />
import * as DB from './db.ts'
import * as DOM from './dom.ts'
   
const RunningLocal = (window.location.href === "http://localhost:8080/");
console.log(`RunningLocal`, RunningLocal);
     
// initialize the DB client
DB.init()

// initialize all DOM elements and event handlers 
DOM.init()
