export interface IMenuItem {
    label: string
    descr?: string
    to?: string
    url?: string
    target?: string
    hrefTarget?: string
    iconCls?: string
    custIcon?: string
    command?: string
    conditionedView?: string
    isClickable?: boolean | 'true' | 'false'
    prog?: number
    roles?: string[]
    items?: IMenuItem[]
    visible?: boolean
}

export interface IMenuGroup {
    label: string
    iconCls?: string
    items: IMenuItem[]
}

export interface IEndUserMenuResponse {
    technicalUserFunctionalities: IMenuGroup[]
    commonUserFunctionalities: IMenuItem[]
    allowedUserFunctionalities: IMenuItem[]
    dynamicUserFunctionalities: IMenuItem[]
}

export interface IRecentModule {
    label: string
    to?: string
    url?: string
    command?: string
}

export interface IModuleMatch {
    group: IMenuGroup
    item: IMenuItem
}

export type MenuLink = { kind: 'route'; to: string | { name: string } } | { kind: 'external'; href: string; target: string } | { kind: 'action' }
