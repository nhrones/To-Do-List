
export type CTX = {
   currentTopic: string
   TopicKey: string
   DbKey: string[]
   nextTxId: number
   thisKeyName: string
   tasks: { text: string, disabled: boolean }[]
}

export type Callback = (error: string, result: string) => void

export type DbRpcPackage = {
   procedure: 'GET' | 'SET',
   key: string[],
   value: string | string[]
}

export type TaskType = {
   text: string,
   disabled: boolean
}
