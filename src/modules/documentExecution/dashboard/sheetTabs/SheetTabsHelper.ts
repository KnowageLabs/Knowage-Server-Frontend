import { IDashboardSheetTabs, IDashboardSheetTabsLook } from '../Dashboard'

// The sheet tab bar at the bottom of a dashboard. A look is a set of defaults: a color left empty uses the look color,
// and the look colors use the UI theme variables (Theme Management), so the bar follows the UI theme.

const TOOLBAR = 'var(--kn-toolbar-primary-background-color)'
const TOOLBAR_TEXT = 'var(--kn-toolbar-primary-color)'
const PRIMARY = 'var(--kn-color-primary)'
const ACCENT = 'var(--kn-color-fab)'
const mix = (color: string, percent: number, base = 'transparent') => `color-mix(in srgb, ${color} ${percent}%, ${base})`

export type ISheetTabsColors = Pick<IDashboardSheetTabs, 'background' | 'borderColor' | 'color' | 'hoverBackground' | 'indicatorColor' | 'activeColor' | 'activeBackground'>
type ISheetTabsShape = Omit<IDashboardSheetTabs, keyof ISheetTabsColors | 'look'>

interface ISheetTabsLookDefinition {
    labelKey: string
    shape: ISheetTabsShape
    // `sheetIsDark` only matters for the look that takes the sheet color.
    colors: (sheetColor: string, sheetIsDark: boolean) => ISheetTabsColors
}

const LIGHT_SHAPE: ISheetTabsShape = { height: 36, tabWidth: 'fit', fontSize: 13, showIcons: true, indicator: 'short', indicatorWidth: 2, activeBold: false }
const THEMED_SHAPE: ISheetTabsShape = { ...LIGHT_SHAPE, height: 32 }

export const SHEET_TABS_LOOKS: Record<IDashboardSheetTabsLook, ISheetTabsLookDefinition> = {
    lightUnderline: {
        labelKey: 'dashboard.sheetTabs.looks.lightUnderline',
        shape: LIGHT_SHAPE,
        colors: () => ({ background: '#ffffff', borderColor: '#e3e3e3', color: '#6b6b6b', hoverBackground: 'rgba(0, 0, 0, 0.04)', indicatorColor: PRIMARY, activeColor: '#1f1f1f', activeBackground: 'transparent' })
    },
    lightThemedTab: {
        labelKey: 'dashboard.sheetTabs.looks.lightThemedTab',
        shape: { ...LIGHT_SHAPE, indicator: 'none' },
        colors: () => ({ background: '#ffffff', borderColor: '#e3e3e3', color: '#6b6b6b', hoverBackground: 'rgba(0, 0, 0, 0.04)', indicatorColor: PRIMARY, activeColor: TOOLBAR_TEXT, activeBackground: TOOLBAR })
    },
    tinted: {
        labelKey: 'dashboard.sheetTabs.looks.tinted',
        shape: { ...LIGHT_SHAPE, indicatorWidth: 3, activeBold: true },
        colors: () => ({ background: mix(PRIMARY, 8, '#ffffff'), borderColor: mix(PRIMARY, 18, '#ffffff'), color: '#5f6670', hoverBackground: 'rgba(0, 0, 0, 0.04)', indicatorColor: PRIMARY, activeColor: PRIMARY, activeBackground: 'rgba(255, 255, 255, 0.7)' })
    },
    blend: {
        labelKey: 'dashboard.sheetTabs.looks.blend',
        shape: LIGHT_SHAPE,
        colors: (sheetColor, sheetIsDark) => ({
            background: sheetColor || '#ffffff',
            borderColor: 'rgba(128, 128, 128, 0.25)',
            color: sheetIsDark ? 'rgba(255, 255, 255, 0.65)' : '#6b6b6b',
            hoverBackground: 'rgba(128, 128, 128, 0.12)',
            indicatorColor: sheetIsDark ? '#ffffff' : PRIMARY,
            activeColor: sheetIsDark ? '#ffffff' : '#1f1f1f',
            activeBackground: 'transparent'
        })
    },
    themedBar: {
        labelKey: 'dashboard.sheetTabs.looks.themedBar',
        shape: { ...THEMED_SHAPE, indicator: 'full' },
        colors: () => ({ background: TOOLBAR, borderColor: 'transparent', color: mix(TOOLBAR_TEXT, 72), hoverBackground: mix(TOOLBAR_TEXT, 8), indicatorColor: ACCENT, activeColor: TOOLBAR_TEXT, activeBackground: mix(TOOLBAR_TEXT, 14) })
    },
    themedLine: {
        labelKey: 'dashboard.sheetTabs.looks.themedLine',
        shape: { ...THEMED_SHAPE, indicatorWidth: 3, activeBold: true },
        colors: () => ({ background: TOOLBAR, borderColor: 'transparent', color: mix(TOOLBAR_TEXT, 65), hoverBackground: mix(TOOLBAR_TEXT, 8), indicatorColor: ACCENT, activeColor: TOOLBAR_TEXT, activeBackground: 'transparent' })
    }
}

export const SHEET_TABS_LOOK_IDS = Object.keys(SHEET_TABS_LOOKS) as IDashboardSheetTabsLook[]
export const SHEET_TABS_COLOR_KEYS: (keyof ISheetTabsColors)[] = ['background', 'borderColor', 'color', 'hoverBackground', 'indicatorColor', 'activeColor', 'activeBackground']

const emptyColors = (): ISheetTabsColors => ({ background: '', borderColor: '', color: '', hoverBackground: '', indicatorColor: '', activeColor: '', activeBackground: '' })

// A look with all colors empty: they come from the look.
export const getDefaultSheetTabs = (look: IDashboardSheetTabsLook = 'lightUnderline'): IDashboardSheetTabs => ({ look, ...SHEET_TABS_LOOKS[look].shape, ...emptyColors() })

// "Start from": the shape of the look, the colors back to the look defaults. Keeps the object (forms edit it in place).
export const setSheetTabsLook = (sheetTabs: IDashboardSheetTabs, look: IDashboardSheetTabsLook) => Object.assign(sheetTabs, getDefaultSheetTabs(look))

// Fills missing keys (a saved object from an older version, or a hand-written template). An unknown look falls back to the default.
export const normalizeSheetTabs = (sheetTabs?: Partial<IDashboardSheetTabs> | null): IDashboardSheetTabs => {
    const look = sheetTabs?.look && SHEET_TABS_LOOKS[sheetTabs.look] ? sheetTabs.look : 'lightUnderline'
    return { ...getDefaultSheetTabs(look), ...(sheetTabs ?? {}), look }
}

// Light or dark, for the look that takes the sheet color. Only hex and rgb() are read; anything else counts as light.
export const isDarkColor = (color: string): boolean => {
    const value = (color ?? '').trim().toLowerCase()
    let rgb: number[] | null = null
    const hex = value.match(/^#([0-9a-f]{3,8})$/)
    if (hex) {
        const digits = hex[1].length <= 4 ? hex[1].split('').map((digit) => digit + digit) : hex[1].match(/.{2}/g) ?? []
        rgb = digits.slice(0, 3).map((part) => parseInt(part, 16))
    }
    const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/)
    if (rgbMatch) rgb = rgbMatch[1].split(/[\s,/]+/).slice(0, 3).map((part) => parseFloat(part))
    if (!rgb || rgb.length < 3 || rgb.some((part) => Number.isNaN(part))) return false
    const [r, g, b] = rgb.map((part) => {
        const channel = part / 255
        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.4
}

export interface ISheetTabsStyle {
    vars: Record<string, string>
    indicator: IDashboardSheetTabs['indicator']
    tabWidth: IDashboardSheetTabs['tabWidth']
    showIcons: boolean
}

// The colors of the look (CSS values, maybe with UI theme variables). The form shows them in the empty color fields.
export const getSheetTabsLookColors = (look: IDashboardSheetTabsLook, sheetBackgroundColor = ''): ISheetTabsColors => (SHEET_TABS_LOOKS[look] ?? SHEET_TABS_LOOKS.lightUnderline).colors(sheetBackgroundColor, isDarkColor(sheetBackgroundColor))

// What the bar needs: CSS variables for _knSheetTabs.scss and three switches for its data attributes.
export const getSheetTabsStyle = (sheetTabs: Partial<IDashboardSheetTabs> | null | undefined, sheetBackgroundColor = ''): ISheetTabsStyle => {
    const tabs = normalizeSheetTabs(sheetTabs)
    const lookColors = getSheetTabsLookColors(tabs.look, sheetBackgroundColor)
    const color = (key: keyof ISheetTabsColors) => tabs[key] || lookColors[key]
    return {
        vars: {
            '--kn-sheet-tabs-height': `${tabs.height}px`,
            '--kn-sheet-tabs-font-size': `${tabs.fontSize}px`,
            '--kn-sheet-tabs-background': color('background'),
            '--kn-sheet-tabs-border': color('borderColor'),
            '--kn-sheet-tabs-color': color('color'),
            '--kn-sheet-tabs-hover': color('hoverBackground'),
            '--kn-sheet-tabs-indicator': color('indicatorColor'),
            '--kn-sheet-tabs-indicator-width': `${tabs.indicatorWidth}px`,
            '--kn-sheet-tabs-active-color': color('activeColor'),
            '--kn-sheet-tabs-active-background': color('activeBackground'),
            '--kn-sheet-tabs-active-weight': tabs.activeBold ? '700' : '500'
        },
        indicator: tabs.indicator,
        tabWidth: tabs.tabWidth,
        showIcons: tabs.showIcons
    }
}
