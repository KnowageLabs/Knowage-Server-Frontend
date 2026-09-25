import { normalizeExternalUrl, normalizeMenuRoute } from '@/helpers/commons/menuHelper'
import type { IMenuGroup, IMenuItem, IModuleMatch, IRecentModule, MenuLink } from './MainMenu'

// H1 — icons. Removes size classes and maps Font Awesome 4 names that do not exist in Font Awesome 6.4.
const ICON_SIZE_CLASSES = /(^|\s)(fa-(2xs|xs|sm|lg|xl|2xl|[1-9]x|10x|fw)|pi-fw)(?=\s|$)/g
const LEGACY_ICON_MAP: Record<string, string> = { 'fa-id-card-o': 'fa-regular fa-id-card' }

export function normalizeMenuIcon(iconCls: string | null | undefined, fallback = 'insert_drive_file'): string {
    if (!iconCls || !iconCls.trim()) return fallback
    const cleaned = iconCls.replace(ICON_SIZE_CLASSES, ' ').replace(/\s+/g, ' ').trim()
    const legacy = Object.keys(LEGACY_ICON_MAP).find((name) => cleaned.split(' ').includes(name))
    return legacy ? LEGACY_ICON_MAP[legacy] : cleaned
}

// PrimeIcons ("pi pi-…") are not supported by q-icon. Render them as <i :class>.
export function isPrimeIcon(icon: string): boolean {
    return icon.startsWith('pi ')
}

// H1b — Modules icons. The backend sends no icon for the module links, and it sends the same
// Font Awesome glyph for several groups. These maps give one icon per module, from Material
// Symbols Outlined ("sym_o_…"), so the whole Modules panel uses one icon family.
// The key is the route of the item, or its command when the item has no route.
const MODULE_ICON_MAP: Record<string, string> = {
    // Data Providers
    '/datasource-management': 'sym_o_storage',
    '/dataset-management': 'sym_o_table_chart',
    // Profile Management
    '/profile-attributes-management': 'sym_o_badge',
    '/roles-management': 'sym_o_admin_panel_settings',
    '/users-management': 'sym_o_group',
    '/menu-management': 'sym_o_menu',
    '/functionalities-management': 'sym_o_toggle_on',
    // Behavioural model
    '/lovs-management': 'sym_o_list',
    '/drivers-management': 'sym_o_filter_alt',
    '/constraint-management': 'sym_o_rule',
    '/behavioural-model-lineage': 'sym_o_account_tree',
    // Catalogs
    '/business-model-catalogue': 'sym_o_schema',
    '/mondrian-schemas-management': 'sym_o_grid_on',
    '/layers-management': 'sym_o_layers',
    '/timespan': 'sym_o_timelapse',
    '/calendar-management': 'sym_o_calendar_month',
    '/functions-catalog': 'sym_o_function',
    '/gallery-management': 'sym_o_widgets',
    // Tools
    '/scheduler': 'sym_o_schedule',
    '/schedulation-agenda': 'sym_o_event_note',
    '/cache-management': 'sym_o_cached',
    '/cross-navigation-management': 'sym_o_alt_route',
    '/alert': 'sym_o_notifications_active',
    '/news-management': 'sym_o_campaign',
    '/resource-management': 'sym_o_inventory_2',
    '/log-management': 'sym_o_receipt_long',
    // Kpi Model
    '/kpi-definition': 'sym_o_speed',
    '/measure-definition': 'sym_o_straighten',
    '/target-definition': 'sym_o_target',
    '/kpi-scheduler': 'sym_o_update',
    '/scorecards': 'sym_o_scoreboard',
    // Server Settings
    '/configuration-management': 'sym_o_tune',
    '/domains-management': 'sym_o_domain',
    '/categories-management': 'sym_o_category',
    '/metadata-management': 'sym_o_data_object',
    '/ai-management': 'sym_o_smart_toy',
    // Server manager
    '/tenants-management': 'sym_o_apartment',
    '/template-pruning': 'sym_o_delete_sweep',
    '/theme-management': 'sym_o_palette',
    '/dashboard-theme-management': 'sym_o_format_paint',
    '/events-management': 'sym_o_event',
    licenseSelection: 'sym_o_workspace_premium',
    // Internationalization
    '/internationalization-management': 'sym_o_translate',
    // Import/Export
    '/import-export': 'sym_o_import_export',
    '/import-export-documents': 'sym_o_file_copy',
    // Rail commands that can also reach a popup row
    downloadsSelection: 'sym_o_download',
    newsSelection: 'sym_o_campaign'
}

// A group carries no route. Its icon comes from the first item that this map knows.
const GROUP_ICON_MAP: Record<string, string> = {
    '/datasource-management': 'sym_o_database',
    '/profile-attributes-management': 'sym_o_manage_accounts',
    '/lovs-management': 'sym_o_psychology',
    '/business-model-catalogue': 'sym_o_menu_book',
    '/scheduler': 'sym_o_handyman',
    '/kpi-definition': 'sym_o_monitoring',
    '/configuration-management': 'sym_o_settings',
    '/tenants-management': 'sym_o_dns',
    '/internationalization-management': 'sym_o_language',
    '/import-export': 'sym_o_swap_vert'
}

export function moduleIconKey(item: IMenuItem): string {
    if (item.to) return normalizeMenuRoute(item.to).replace(/\/+$/, '') || '/'
    return item.command ?? item.url ?? item.label ?? ''
}

export function getModuleIcon(item: IMenuItem): string {
    return MODULE_ICON_MAP[moduleIconKey(item)] ?? normalizeMenuIcon(item.iconCls, 'sym_o_extension')
}

export function getModuleGroupIcon(group: IMenuGroup): string {
    for (const item of group.items ?? []) {
        const icon = GROUP_ICON_MAP[moduleIconKey(item)]
        if (icon) return icon
    }
    return normalizeMenuIcon(group.iconCls, 'sym_o_apps')
}

// H2 — labels. Same order as the old menu: vue-i18n first, then the custom internationalization.
export function translateMenuLabel(label: string | undefined, t: (key: string) => string, te: (key: string) => boolean, internationalize: (key: string) => string): string {
    if (!label) return ''
    return internationalize(te(label) ? t(label) : label)
}

// H3 — avatar initials.
export function getInitials(name: string | undefined): string {
    const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    return parts
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('')
}

// H4 — active route. "/" matches only itself. Trailing slashes are ignored.
export function isRouteActive(currentPath: string, to: string | undefined): boolean {
    if (!to) return false
    const target = normalizeMenuRoute(to).replace(/\/+$/, '') || '/'
    const path = currentPath.replace(/\/+$/, '') || '/'
    if (target === '/') return path === '/'
    return path === target || path.startsWith(target + '/')
}

export function isHomeItem(item: IMenuItem): boolean {
    return !!item.to && normalizeMenuRoute(item.to) === '/'
}

export function isMyAccountItem(item: IMenuItem): boolean {
    return !!item.to && item.to.includes('/restful-services/signup/prepareUpdate')
}

export function isItemClickable(item: IMenuItem): boolean {
    return item.isClickable !== false && item.isClickable !== 'false'
}

// H5 — link model.
export function getMenuLink(item: IMenuItem): MenuLink {
    if (!isItemClickable(item) || item.items?.length || item.command) return { kind: 'action' }
    if (isHomeItem(item)) return { kind: 'route', to: { name: 'home' } }
    if (item.to) return { kind: 'route', to: normalizeMenuRoute(item.to) }
    if (item.url) {
        const target = item.target ?? item.hrefTarget
        if (target === 'insideKnowage') return { kind: 'action' }
        return { kind: 'external', href: normalizeExternalUrl(item.url), target: target || '_blank' }
    }
    return { kind: 'action' }
}

export function menuItemKey(item: { label: string; to?: string; url?: string; command?: string }): string {
    return item.to ?? item.url ?? item.command ?? item.label
}

export function containsRoute(items: IMenuItem[] | undefined, currentPath: string): boolean {
    return (items ?? []).some((child) => isRouteActive(currentPath, child.to) || containsRoute(child.items, currentPath))
}

// H6 — Modules search.
export function searchModules(groups: IMenuGroup[], search: string, translate: (label: string) => string): IModuleMatch[] {
    const query = search.trim().toLowerCase()
    if (!query) return []
    const matches: IModuleMatch[] = []
    for (const group of groups) {
        for (const item of group.items ?? []) {
            if (translate(item.label).toLowerCase().includes(query)) matches.push({ group, item })
        }
    }
    return matches
}

// H7 — Recent modules (localStorage, per user, max 5).
const RECENT_LIMIT = 5
const recentKey = (userId: string) => `kn.mainMenu.recentModules.${userId}`

export function readRecentModules(userId: string): IRecentModule[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(recentKey(userId)) ?? '[]')
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

export function pushRecentModule(userId: string, item: IMenuItem): IRecentModule[] {
    const entry: IRecentModule = { label: item.label, to: item.to, url: item.url, command: item.command }
    const key = menuItemKey(entry)
    const next = [entry, ...readRecentModules(userId).filter((recent) => menuItemKey(recent) !== key)].slice(0, RECENT_LIMIT)
    try {
        localStorage.setItem(recentKey(userId), JSON.stringify(next))
    } catch {
        // storage unavailable: keep the in-memory list only
    }
    return next
}

export function resolveRecentModules(recent: IRecentModule[], groups: IMenuGroup[]): IModuleMatch[] {
    const matches: IModuleMatch[] = []
    for (const entry of recent) {
        const key = menuItemKey(entry)
        for (const group of groups) {
            const item = (group.items ?? []).find((candidate) => menuItemKey(candidate) === key)
            if (item) {
                matches.push({ group, item })
                break
            }
        }
    }
    return matches
}
