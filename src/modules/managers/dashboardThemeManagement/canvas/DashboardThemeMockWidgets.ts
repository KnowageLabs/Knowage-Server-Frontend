import deepcopy from 'deepcopy'
import { IWidget, ISelection } from '@/modules/documentExecution/dashboard/Dashboard'
import { createNewWidget } from '@/modules/documentExecution/dashboard/widget/WidgetEditor/helpers/WidgetEditorHelpers'
import { createNewHighchartsModel } from '@/modules/documentExecution/dashboard/widget/WidgetEditor/helpers/chartWidget/highcharts/HighchartsHelpers'
import { IEditorWidgetType } from '../DashboardThemeHelper'
import tableWidgetMock from './mocks/TableWidgetMock.json'
import discoveryWidgetMock from './mocks/DiscoveryWidgetMock.json'
import selectorWidgetMock from './mocks/SelectorWidgetMock.json'

export const PREVIEW_DASHBOARD_ID = 'dashboard-theme-preview'

export interface IMockWidget {
    themeType: IEditorWidgetType
    widget: IWidget
    data: any
    initialData: any
}

// Widgets on the canvas, in pixels at 100% zoom. The sizes are generic starting values: real sizes depend on the data.
// The canvas pans and zooms, so the layout does not have to fit a screen.
export const CANVAS_LAYOUT: { themeType: IEditorWidgetType; left: number; top: number; width: number; height: number }[] = [
    { themeType: 'text', left: 0, top: 0, width: 460, height: 260 },
    { themeType: 'image', left: 484, top: 0, width: 460, height: 260 },
    { themeType: 'html', left: 968, top: 0, width: 460, height: 260 },
    { themeType: 'activeSelections', left: 1452, top: 0, width: 460, height: 260 },
    { themeType: 'chart', left: 0, top: 284, width: 760, height: 480 },
    { themeType: 'selector', left: 784, top: 284, width: 440, height: 480 },
    { themeType: 'customChart', left: 1248, top: 284, width: 664, height: 480 },
    { themeType: 'table', left: 0, top: 788, width: 1100, height: 520 },
    { themeType: 'python', left: 1124, top: 788, width: 788, height: 520 },
    { themeType: 'discovery', left: 0, top: 1332, width: 1100, height: 520 },
    { themeType: 'map', left: 1124, top: 1332, width: 788, height: 520 },
    { themeType: 'pivot', left: 0, top: 1876, width: 1100, height: 520 }
]

export const CANVAS_SIZE = {
    width: Math.max(...CANVAS_LAYOUT.map((item) => item.left + item.width)),
    height: Math.max(...CANVAS_LAYOUT.map((item) => item.top + item.height))
}

export const SELECTOR_VARIANTS = ['dropdown', 'multiDropdown', 'singleValue', 'multiValue', 'date', 'dateRange', 'slider', 'range', 'buttonToggle', 'tree', 'multiTree'] as const
export type ISelectorVariant = (typeof SELECTOR_VARIANTS)[number]

// Opening one of these theme sections switches the selector tile to the variant that shows it.
export const SELECTOR_SECTION_VARIANTS: Record<string, ISelectorVariant> = {
    radio: 'singleValue',
    checkbox: 'multiValue',
    dropdown: 'dropdown',
    multiDropdown: 'multiDropdown',
    date: 'date',
    dateRange: 'dateRange',
    slider: 'slider',
    range: 'range',
    buttonToggle: 'buttonToggle',
    tree: 'tree',
    multiTree: 'multiTree'
}

// The image widget shows a gallery image by id. The canvas replaces it with this picture, so it needs no gallery.
const MOCK_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc9f0"/><stop offset="1" stop-color="#e8f3fb"/></linearGradient></defs>
<rect width="400" height="220" fill="url(#sky)"/><circle cx="310" cy="58" r="26" fill="#ffd66b"/>
<path d="M0 170 L90 80 L150 140 L210 70 L300 160 L400 100 L400 220 L0 220 Z" fill="#5f8fb4"/>
<path d="M0 190 L120 120 L200 175 L280 130 L400 185 L400 220 L0 220 Z" fill="#3f6f8f"/>
<rect y="200" width="400" height="20" fill="#2f5670"/></svg>`
export const MOCK_IMAGE_URL = `data:image/svg+xml,${encodeURIComponent(MOCK_IMAGE_SVG)}`

// Map tiles need the network. The canvas shows this street map under the tiles, so the map widget never looks empty.
const MOCK_MAP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice">
<rect width="800" height="520" fill="#eef1ec"/>
<path d="M0 360 C120 330 200 400 320 380 C430 362 470 300 560 310 C650 320 720 380 800 360 L800 520 L0 520 Z" fill="#bcd7ea"/>
<path d="M60 60 h150 v110 h-150 Z M560 70 h170 v120 h-170 Z M330 190 h120 v90 h-120 Z" fill="#cfe5c4"/>
<g stroke="#ffffff" stroke-linecap="round" fill="none"><path d="M0 230 C200 220 380 250 800 200" stroke-width="14"/><path d="M270 0 C260 160 300 300 250 520" stroke-width="12"/><path d="M520 0 C540 140 500 260 600 520" stroke-width="10"/><path d="M0 120 L800 140 M0 300 L800 280 M120 0 L140 360 M400 0 L420 340 M680 0 L700 330" stroke-width="5"/></g>
<g stroke="#f4d58d" stroke-width="4" fill="none"><path d="M0 230 C200 220 380 250 800 200"/></g>
<g fill="#d64545" stroke="#ffffff" stroke-width="2"><path d="M180 200 c-12 0 -20 9 -20 20 c0 15 20 34 20 34 s20 -19 20 -34 c0 -11 -8 -20 -20 -20 Z"/><path d="M430 150 c-12 0 -20 9 -20 20 c0 15 20 34 20 34 s20 -19 20 -34 c0 -11 -8 -20 -20 -20 Z"/><path d="M620 240 c-12 0 -20 9 -20 20 c0 15 20 34 20 34 s20 -19 20 -34 c0 -11 -8 -20 -20 -20 Z"/><path d="M330 300 c-12 0 -20 9 -20 20 c0 15 20 34 20 34 s20 -19 20 -34 c0 -11 -8 -20 -20 -20 Z"/></g>
<g fill="#ffffff"><circle cx="180" cy="220" r="6"/><circle cx="430" cy="170" r="6"/><circle cx="620" cy="260" r="6"/><circle cx="330" cy="320" r="6"/></g></svg>`
export const MOCK_MAP_URL = `data:image/svg+xml,${encodeURIComponent(MOCK_MAP_SVG)}`

export const MOCK_ACTIVE_SELECTIONS = [
    { datasetId: 1, datasetLabel: 'SALES', columnName: 'QUARTER', value: ['Q2'], aggregated: false, timestamp: 1689937296670 },
    { datasetId: 1, datasetLabel: 'SALES', columnName: 'REGION', value: ['North'], aggregated: false, timestamp: 1689937296671 },
    { datasetId: 2, datasetLabel: 'PRODUCTS', columnName: 'PRODUCT_FAMILY', value: ['Food', 'Drink'], aggregated: false, timestamp: 1689937296672 }
] as ISelection[]

const SALES_DATA = {
    metaData: {
        fields: ['recNo', { name: 'column_1', header: 'PRODUCT_FAMILY', dataIndex: 'column_1', type: 'string', multiValue: false }, { name: 'column_2', header: 'UNIT_SALES', dataIndex: 'column_2', type: 'float', multiValue: false, precision: 10, scale: 0 }],
        id: 'id',
        root: 'rows',
        totalProperty: 'results'
    },
    results: 6,
    rows: [
        { id: 1, column_1: 'Food', column_2: 18420 },
        { id: 2, column_1: 'Drink', column_2: 9870 },
        { id: 3, column_1: 'Electronics', column_2: 7310 },
        { id: 4, column_1: 'Apparel', column_2: 6040 },
        { id: 5, column_1: 'Household', column_2: 4520 },
        { id: 6, column_1: 'Toys', column_2: 2760 }
    ]
}

const CUSTOM_CHART_HTML = `<div class="bars">
    <div class="bar"><span style="height: 92%"></span><label>Q1</label></div>
    <div class="bar"><span style="height: 68%"></span><label>Q2</label></div>
    <div class="bar"><span style="height: 80%"></span><label>Q3</label></div>
    <div class="bar"><span style="height: 54%"></span><label>Q4</label></div>
</div>`

const CUSTOM_CHART_CSS = `.bars { display: flex; align-items: flex-end; gap: 18px; height: 100%; box-sizing: border-box; padding: 12px 16px 8px; font-family: Roboto, sans-serif; }
.bar { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 6px; }
.bar span { width: 100%; border-radius: 4px 4px 0 0; background: linear-gradient(180deg, #5b8def, #3a64c8); }
.bar label { font-size: 12px; color: #555; }`

const PYTHON_RESULT = `<html><body style="margin:0;font-family:sans-serif;background:#fff">
<svg viewBox="0 0 440 300" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <text x="220" y="22" text-anchor="middle" font-size="14" fill="#333">Sales forecast</text>
  <line x1="50" y1="260" x2="420" y2="260" stroke="#888"/><line x1="50" y1="40" x2="50" y2="260" stroke="#888"/>
  <g font-size="10" fill="#666"><text x="40" y="264" text-anchor="end">0</text><text x="40" y="154" text-anchor="end">50</text><text x="40" y="44" text-anchor="end">100</text></g>
  <polyline fill="none" stroke="#1f77b4" stroke-width="2.5" points="60,210 110,190 160,200 210,150 260,140 300,120"/>
  <polyline fill="none" stroke="#ff7f0e" stroke-width="2.5" stroke-dasharray="6 4" points="300,120 340,105 380,92 410,80"/>
  <g font-size="11" fill="#333"><rect x="300" y="236" width="12" height="3" fill="#1f77b4"/><text x="316" y="240">actual</text><rect x="362" y="236" width="12" height="3" fill="#ff7f0e"/><text x="378" y="240">forecast</text></g>
</svg></body></html>`

const memberCell = (label: string, extra = '') => `<td class="member"${extra}><div class="crosstab-header-text">${label}</div></td>`
const measureHeaderCell = (label: string) => `<td><div><div><span class="measures-header-text">${label}</span></div></div></td>`
const PIVOT_HTML = `<table>
<thead>
<tr><td class="empty" colspan="2"></td>${memberCell('Q1')}${memberCell('Q2')}${memberCell('Total', ' id="Total"')}</tr>
<tr><td class="level"><div class="crosstab-header-text">REGION</div></td><td class="level"><div class="crosstab-header-text">FAMILY</div></td>${measureHeaderCell('Store sales')}${measureHeaderCell('Store sales')}${measureHeaderCell('Store sales')}</tr>
</thead>
<tbody>
<tr>${memberCell('North', ' rowspan="3"')}${memberCell('Food')}<td class="data">4,210</td><td class="data">4,580</td><td class="totals">8,790</td></tr>
<tr>${memberCell('Drink')}<td class="data">2,130</td><td class="data">2,410</td><td class="totals">4,540</td></tr>
<tr>${memberCell('Subtotal', ' id="SubTotal"')}<td class="partialsum">6,340</td><td class="partialsum">6,990</td><td class="partialsum">13,330</td></tr>
<tr>${memberCell('South', ' rowspan="3"')}${memberCell('Food')}<td class="data">3,870</td><td class="data">4,020</td><td class="totals">7,890</td></tr>
<tr>${memberCell('Drink')}<td class="data">1,960</td><td class="data">2,240</td><td class="totals">4,200</td></tr>
<tr>${memberCell('Subtotal', ' id="SubTotal"')}<td class="partialsum">5,830</td><td class="partialsum">6,260</td><td class="partialsum">12,090</td></tr>
<tr>${memberCell('Total', ' id="Total" colspan="2"')}<td class="totals">12,170</td><td class="totals">13,250</td><td class="totals">25,420</td></tr>
</tbody>
</table>`

// Selector data arrives per column: { columnName: { rows: [...] } }.
const formatSelectorData = (mockData: any, widget: any) => {
    const columnName = widget?.columns?.[0]?.columnName
    return columnName ? { [columnName]: mockData } : mockData
}

const newWidget = (type: string) => createNewWidget(type, null) as IWidget

// The JSON mocks are older than some settings. Missing settings come from the defaults of a new widget.
const fillMissing = (target: any, defaults: any) => {
    Object.keys(defaults ?? {}).forEach((key) => {
        if (target[key] === undefined) target[key] = deepcopy(defaults[key])
        else if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) && defaults[key] && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) fillMissing(target[key], defaults[key])
    })
    return target
}

const fromJsonMock = (mockModel: any, type: string) => {
    const widget = deepcopy(mockModel)
    widget.settings = fillMissing(widget.settings ?? {}, newWidget(type).settings)
    return widget
}

export const createSelectorMock = (variant: ISelectorVariant): IMockWidget => {
    const isTree = variant === 'tree' || variant === 'multiTree'
    const widget = fromJsonMock(isTree ? selectorWidgetMock.treeModelMock : selectorWidgetMock.selectorModelMock, 'selector')
    widget.settings.configuration.selectorType.modality = variant
    let data = isTree ? selectorWidgetMock.treeDataMock : selectorWidgetMock.selectorDataMock
    // Sliders and toggles label every value: 24 values do not fit in one row.
    if (['buttonToggle', 'slider', 'range'].includes(variant)) data = { ...data, rows: data.rows.slice(0, 6), results: 6 } as any
    const formatted = isTree ? data : formatSelectorData(data, widget)
    return { themeType: 'selector', widget, data: formatted, initialData: formatted }
}

const createMockByType = (themeType: IEditorWidgetType): IMockWidget => {
    switch (themeType) {
        case 'text': {
            const widget = newWidget('text')
            widget.settings.editor.text = '<h3 style="margin: 0 0 8px">Quarterly summary</h3><p style="margin: 0">Store sales grew in every region this quarter. Food and drink lead the growth, and the online channel keeps its share.</p>'
            return { themeType, widget, data: {}, initialData: {} }
        }
        case 'image': {
            const widget = newWidget('image')
            return { themeType, widget, data: {}, initialData: {} }
        }
        case 'html': {
            const widget = newWidget('html')
            widget.settings.editor.html = '<div class="kpi"><div class="kpi__label">Unit sales</div><div class="kpi__value">48,920</div><div class="kpi__trend">+6.4% compared to the last quarter</div></div>'
            widget.settings.editor.css = '.kpi { font-family: Roboto, sans-serif; padding: 8px 4px; } .kpi__label { font-size: 13px; color: #666; } .kpi__value { font-size: 34px; font-weight: 500; margin: 4px 0; } .kpi__trend { font-size: 12px; color: #2e7d32; }'
            return { themeType, widget, data: {}, initialData: {} }
        }
        case 'activeSelections': {
            const widget = newWidget('selection')
            return { themeType, widget, data: {}, initialData: {} }
        }
        case 'chart': {
            const widget = newWidget('highcharts')
            widget.settings.chartModel = createNewHighchartsModel(widget, 'pie', null, false, false, false)
            widget.columns = [
                { id: 'mock-family', columnName: 'PRODUCT_FAMILY', alias: 'Family', type: 'java.lang.String', fieldType: 'ATTRIBUTE', filter: {} },
                { id: 'mock-unit-sales', columnName: 'UNIT_SALES', alias: 'Unit sales', type: 'java.lang.Double', fieldType: 'MEASURE', aggregation: 'SUM', filter: {} }
            ] as any
            return { themeType, widget, data: deepcopy(SALES_DATA), initialData: deepcopy(SALES_DATA) }
        }
        case 'selector':
            return createSelectorMock('dropdown')
        case 'customChart': {
            const widget = newWidget('customchart')
            widget.settings.editor = { html: CUSTOM_CHART_HTML, css: CUSTOM_CHART_CSS, js: '' }
            return { themeType, widget, data: deepcopy(SALES_DATA), initialData: deepcopy(SALES_DATA) }
        }
        case 'table': {
            const widget = fromJsonMock(tableWidgetMock.tableModelMock, 'table')
            // The table matches its columns to the data by alias, so the data headers change with the aliases.
            const aliases = { documento: 'Document', motore: 'Engine', esecuzioni: 'Executions' }
            const data = deepcopy(tableWidgetMock.tableDataMock) as any
            widget.columns.forEach((column: any) => (column.alias = aliases[column.alias] ?? column.alias))
            data.metaData.fields.forEach((field: any) => {
                if (typeof field === 'object') field.header = aliases[field.header] ?? field.header
            })
            widget.settings.pagination.properties.itemsNumber = 5
            return { themeType, widget, data, initialData: data }
        }
        case 'python': {
            const widget = newWidget('python')
            const data = { result: PYTHON_RESULT }
            return { themeType, widget, data, initialData: data }
        }
        case 'discovery': {
            const widget = fromJsonMock(discoveryWidgetMock.discoveryModelMock, 'discovery')
            return { themeType, widget, data: discoveryWidgetMock.discoveryDataMock, initialData: discoveryWidgetMock.discoveryDataMock }
        }
        case 'map': {
            const widget = newWidget('map')
            widget.layers = []
            widget.settings.visualizations = []
            return { themeType, widget, data: {}, initialData: {} }
        }
        case 'pivot': {
            const widget = newWidget('ce-pivot-table')
            const data = { htmlTable: PIVOT_HTML }
            return { themeType, widget, data, initialData: data }
        }
    }
}

export const createMockWidget = (themeType: IEditorWidgetType, title: string): IMockWidget => {
    const mock = createMockByType(themeType)
    mock.widget.id = `${PREVIEW_DASHBOARD_ID}-${themeType}`
    if (mock.widget.settings?.style?.title) mock.widget.settings.style.title.text = title
    return mock
}

export const createPreviewDashboard = () => ({
    id: PREVIEW_DASHBOARD_ID,
    widgets: [],
    sheets: [],
    drivers: [],
    document: {},
    configuration: { datasets: [], variables: [], selections: [], associations: [], cssToRender: '', theme: {} }
})
