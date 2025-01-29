export interface iNode {
    key: number | string
    icon: string
    id: number
    parentId?: any
    label: string
    children?: iNode[]
    selectable?: Boolean
    data: string | any
    prog: number
    parentFolder?: iNode
}

export interface iFolder {
    id: number
    parentId: number | null
    name: string
    description: string
    codType: string
    code: string
    path: string
    execRoles: string[]
    devRoles: string[]
    testRoles: string[]
    createRoles: string[]
    biObjects: string[]
    prog: number
}
