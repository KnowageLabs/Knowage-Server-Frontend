export interface IChatStep {
    id: string
    tool: string
    done: boolean
}

export interface IChatLink {
    title: string
    url: string
}

export interface IChat {
    role: string
    content: string
    turnId: number
    invocationId?: string
    timestamp?: Date
    isLive?: boolean
    isError?: boolean
    isStreamError?: boolean
    isStopped?: boolean
    // Tool calls of an assistant reply, in order.
    steps?: IChatStep[]
    // Status sentence shown while a tool runs (from AiToolsStreamingMessages).
    liveStatus?: string
}

export interface IChatArtifactFile {
    name: string
    path: string
    ext: string
    title: string
    description: string
    sql_query?: string
    edit?: boolean
}

interface IChatBlockBase {
    id: string
    conversationId: number
    createdAt: Date
    invocationId?: string
    // The user message that produced this artifact. Used as the group title in the artifacts panel.
    question?: string
}

export interface IChatBlockSql extends IChatBlockBase {
    type: 'sql_query'
    query: string
}

export interface IChatBlockArtifacts extends IChatBlockBase {
    type: 'artifacts'
    files: IChatArtifactFile[]
    edit?: boolean
}

export interface IChatBlockPython extends IChatBlockBase {
    type: 'python_code'
    code: string
}

export type IChatBlock = IChatBlockSql | IChatBlockArtifacts | IChatBlockPython
