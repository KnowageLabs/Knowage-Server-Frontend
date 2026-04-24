export type HomeType = 'default' | 'static' | 'document' | 'image' | 'dynamic'

export interface IMenuPlaceholderConfig {
    /** Unique 1-based placeholder identifier stored in data-kn-menu="N" */
    index: number
    /** IDs of the menu nodes to show for this placeholder */
    menuIds: number[]
}

export interface IDynamicHomeTemplate {
    html: string
    css: string
    /** Persisted placeholder configs keyed by stable data-kn-menu IDs until explicitly removed by the user */
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
    documentRouteType?: string
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
