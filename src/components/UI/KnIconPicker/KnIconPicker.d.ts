export type IIconSet = 'material' | 'fontawesome'

export interface IIcon {
    category?: string
    className?: string
    fontFamily?: string
    fontWeight?: number
    id: number
    label: string
    unicode?: string
    visible?: boolean
    image?: string
}
