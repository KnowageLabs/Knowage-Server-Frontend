// Layout of the columns inside a multi-column selector widget.
//
// Since this change the layout is saved per DASHBOARD breakpoint in `settings.responsive.columnLayoutsByScreen`,
// with the column count it was made with. Before, the inner grid was responsive on its own width, so
// `settings.responsive.columnLayouts` is keyed by the breakpoint of the WIDGET width (and `columnLayout` is older still).
// Those old keys are read only, so a saved dashboard shows the same layout as before until a user moves a column.

export type ScreenSize = 'lg' | 'md' | 'sm' | 'xs' | 'xxs'

export interface ISelectorColumnLayout {
    cols: number
    items: Record<string, { x: number; y: number; w: number; h: number }>
}

export const NEW_COLUMN_COUNT = 120

const SCREEN_SIZES: ScreenSize[] = ['lg', 'md', 'sm', 'xs', 'xxs']

// Column counts of the old responsive inner grid, per breakpoint of the widget width.
const LEGACY_COLUMN_COUNTS: Record<ScreenSize, number> = { lg: 120, md: 100, sm: 70, xs: 40, xxs: 20 }

// The breakpoints of grid-layout-plus (the default the dashboard and the old inner grid use).
export const screenSizeFromWidth = (width: number): ScreenSize => {
    if (width >= 1200) return 'lg'
    if (width >= 996) return 'md'
    if (width >= 768) return 'sm'
    if (width >= 480) return 'xs'
    return 'xxs'
}

const isValidLayout = (layout: any): layout is ISelectorColumnLayout => !!layout && typeof layout.cols === 'number' && layout.cols > 0 && !!layout.items

export const getScreenColumnLayout = (responsive: any, screenSize: ScreenSize): ISelectorColumnLayout | null => {
    const layout = responsive?.columnLayoutsByScreen?.[screenSize]
    return isValidLayout(layout) ? layout : null
}

// A layout saved for another dashboard breakpoint: the larger ones first, then the smaller ones.
export const getNearestScreenColumnLayout = (responsive: any, screenSize: ScreenSize): ISelectorColumnLayout | null => {
    const index = SCREEN_SIZES.indexOf(screenSize)
    const order = [...SCREEN_SIZES.slice(0, index).reverse(), ...SCREEN_SIZES.slice(index + 1)]
    for (const size of order) {
        const layout = getScreenColumnLayout(responsive, size)
        if (layout) return layout
    }
    return null
}

// The layout the old code showed for a widget of this width, with the column count it was saved with.
export const getLegacyColumnLayout = (responsive: any, widgetWidth: number): ISelectorColumnLayout | null => {
    const size = screenSizeFromWidth(widgetWidth)
    const items = responsive?.columnLayouts ? responsive.columnLayouts[size] : size === 'lg' ? responsive?.columnLayout : null
    if (!items || Object.keys(items).length === 0) return null
    return { cols: LEGACY_COLUMN_COUNTS[size], items }
}

export const sameColumnLayout = (a: ISelectorColumnLayout, b: ISelectorColumnLayout): boolean => {
    if (a.cols !== b.cols) return false
    const keys = Object.keys(b.items)
    if (keys.length !== Object.keys(a.items).length) return false
    return keys.every((key) => {
        const first = a.items[key]
        const second = b.items[key]
        return !!first && first.x === second.x && first.y === second.y && first.w === second.w && first.h === second.h
    })
}
