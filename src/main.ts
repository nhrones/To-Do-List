/// <reference lib="dom" />
import * as DOM from './dom.ts'
import { fetchAll } from './db.ts'

const RunningLocal = (window.location.href === "http://localhost:8080/");
console.log(`RunningLocal`, RunningLocal);

// initialize all DOM elements and event handlers 
DOM.init()
fetchAll()
