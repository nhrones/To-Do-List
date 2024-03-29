
export type CTX = {
   currentTopic: string
   TopicKey: string
   DbKey: string[]
   nextTxId: number
   thisKeyName: string
   tasks: { text: string, disabled: boolean }[]
}

export type Callback = (error: string, result: string) => void

export type DbRpcPayload = {
   procedure: 'GET' | 'GETALL' | 'SET',
   key: string[],
   value:string | [string, TaskType[]][]
}

export type TaskType = {
   text: string,
   disabled: boolean
}
