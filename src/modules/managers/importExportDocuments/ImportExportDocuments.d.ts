export interface iFile {
    id: number
    name: string
    parentId?: number
    biObjects?: Array
    exportable?: boolean
    path: string
    codType: string
}

export interface iNode {
    key: number | string
    icon: string
    id?: number
    parentId?: number
    label: string
    children?: iNode[]
    selectable?: boolean
    data: string | any
    customIcon?: string
    path?: string
    exportable?: boolean
}
