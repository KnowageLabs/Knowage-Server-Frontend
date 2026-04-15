export type HomeType = 'default' | 'static' | 'document' | 'image' | 'dynamic'

export interface IMenuPlaceholderConfig {
    /** Index of this placeholder among all data-kn-menu elements in the template */
    index: number
    /** IDs of the menu nodes to show for this placeholder */
    menuIds: number[]
}

export interface IDynamicHomeTemplate {
    html: string
    css: string
    /** One entry per data-kn-menu element in the HTML */
    menuPlaceholders: IMenuPlaceholderConfig[]
}

export interface IHomeConfig {
    /** null means this is the default config (no role selected) */
    roleId: number | null
    roleName?: string
    type: HomeType
    /** static page: name/path of the HTML file in Tomcat resources */
    staticPage?: string
    /** document: Knowage document ID */
    documentId?: number
    documentLabel?: string
    /** image: public URL of the image */
    imageUrl?: string
    /** dynamic: HTML/CSS template with menu placeholders */
    template?: IDynamicHomeTemplate
}

export interface IMenuNode {
    menuId: number
    name: string
    descr: string | null
    url: string | null
    to: string | null
    linkType: string | null
    lstChildren?: IMenuNode[]
    children?: IMenuNode[]
    parentId?: number | null
    roles?: { id: number; name: string; value?: string }[]
}
