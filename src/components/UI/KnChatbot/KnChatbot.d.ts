export interface IChat {
    role: string
    content: string
    url?: string
    image?: string
    turnId: number
    dashboard?: any
    timestamp?: Date
    isLive?: boolean
    isError?: boolean
    isStreamError?: boolean
}

export interface IChatArtifactFile {
    name: string
    path: string
    ext: string
    title: string
    description: string
    sql_query?: string
}

export interface IChatBlockSql {
    type: 'sql_query'
    query: string
    id: string
    conversationId: number
    createdAt: Date
}

export interface IChatBlockArtifacts {
    type: 'artifacts'
    files: IChatArtifactFile[]
    id: string
    conversationId: number
    createdAt: Date
}

export interface IChatBlockPython {
    type: 'python_code'
    code: string
    id: string
    conversationId: number
    createdAt: Date
}

export type IChatBlock = IChatBlockSql | IChatBlockArtifacts | IChatBlockPython
