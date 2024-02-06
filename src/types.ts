
export type CTX = {
   currentTopic: string,
   DB_KEY: string
   nextTxId: number
   thisKeyName: string
   tasks: { text: string, disabled: boolean }[]
}

export type Callback = (error: any, result: any) => void

export type DbRpcPackage = {
   procedure: 'GET' | 'SET',
   key: string,
   value: any
}

export type TaskType = {
   text: string,
   disabled: boolean
}
