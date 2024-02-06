
import{ initDom } from './dom.ts'
import { DEV } from './context.ts'


if (DEV) console.log(`main(5) awaiting initDom!`)
// initialize all DOM elements and event handlers 
await initDom() 
if (DEV) console.log(`main(5) returns from initDom!`)