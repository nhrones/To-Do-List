/// <reference lib="dom" />
import * as DOM from './dom.ts'
import { fetchQuerySet } from './db.ts'

// initialize all DOM elements and event handlers 
DOM.init()

//HACK This is a test for Backup/Restore  
fetchQuerySet()
