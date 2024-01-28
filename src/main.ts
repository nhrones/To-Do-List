/// <reference lib="dom" />
import * as DOM from './dom.ts'
import { fetchAll } from './db.ts'

// initialize all DOM elements and event handlers 
DOM.init()
fetchAll()
