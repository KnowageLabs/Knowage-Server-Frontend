import { describe, it, expect } from 'vitest'
import { getFormattedStyle } from '../TableWidgetStyleHelper'

// ─── Factory helpers ─────────────────────────────────────────────────────────

const makeBaseWidget = (overrides: any = {}): any => ({
    style: {
        th: {
            height: 25,
            'background-color': 'rgb(137, 158, 175)',
            color: 'rgb(255, 255, 255)',
            'justify-content': 'center',
            'font-size': '14px',
            'font-family': '',
            'font-style': 'normal',
            'font-weight': ''
        },
        tr: { height: '30px' },
        title: { label: 'Table', height: 25, 'background-color': '#3b678c' },
        titles: true,
        padding: { enabled: true, 'padding-top': '5px', 'padding-left': '5px', 'padding-bottom': '5px', 'padding-right': '5px' },
        border: { 'border-color': '#ccc', 'border-style': 'solid', 'border-width': '1px' },
        borders: true,
        shadow: { 'box-shadow': '0px 2px 3px' },
        shadows: true,
        backgroundColor: '#ffffff'
    },
    settings: {
        multiselectable: false,
        multiselectablecolor: '',
        alternateRows: { enabled: false, evenRowsColor: 'rgb(228, 232, 236)', oddRowsColor: 'rgb(255, 255, 255)' }
    },
    groups: [],
    ...overrides
})

// ─── getFormattedStyle ────────────────────────────────────────────────────────

describe('getFormattedStyle', () => {
    it('restituisce un oggetto con tutte le chiavi attese', () => {
        const result = getFormattedStyle(makeBaseWidget())
        expect(result).toHaveProperty('themeId')
        expect(result).toHaveProperty('title')
        expect(result).toHaveProperty('borders')
        expect(result).toHaveProperty('columns')
        expect(result).toHaveProperty('columnGroups')
        expect(result).toHaveProperty('headers')
        expect(result).toHaveProperty('padding')
        expect(result).toHaveProperty('rows')
        expect(result).toHaveProperty('shadows')
        expect(result).toHaveProperty('summary')
        expect(result).toHaveProperty('background')
        expect(result).toHaveProperty('paginator')
    })

    it('themeId è null di default', () => {
        const result = getFormattedStyle(makeBaseWidget())
        expect(result.themeId).toBeNull()
    })

    // ─── Headers ───────────────────────────────────────────────────────────────

    it("formatta correttamente l'header dal th del widget", () => {
        const result = getFormattedStyle(makeBaseWidget())
        expect(result.headers.height).toBe(25)
        expect(result.headers.properties['background-color']).toBe('rgb(137, 158, 175)')
        expect(result.headers.properties.color).toBe('rgb(255, 255, 255)')
        expect(result.headers.properties['justify-content']).toBe('center')
        expect(result.headers.properties['font-size']).toBe('14px')
    })

    it('usa valori di default per headers se style.th è assente', () => {
        const widget = makeBaseWidget()
        delete widget.style.th
        const result = getFormattedStyle(widget)
        expect(result.headers).toBeDefined()
        expect(result.headers.properties['background-color']).toBe('rgb(137, 158, 175)')
    })

    // ─── Rows ──────────────────────────────────────────────────────────────────

    it('formatta correttamente le rows', () => {
        const result = getFormattedStyle(makeBaseWidget())
        expect(result.rows.height).toBe(30)
        expect(result.rows.multiselectable).toBe(false)
        expect(result.rows.alternatedRows.enabled).toBe(false)
        expect(result.rows.alternatedRows.evenBackgroundColor).toBe('rgb(228, 232, 236)')
        expect(result.rows.alternatedRows.oddBackgroundColor).toBe('rgb(255, 255, 255)')
    })

    it('imposta multiselectable a true se settings.multiselectable è true', () => {
        const widget = makeBaseWidget()
        widget.settings.multiselectable = true
        widget.settings.multiselectablecolor = '#aabbcc'
        const result = getFormattedStyle(widget)
        expect(result.rows.multiselectable).toBe(true)
        expect(result.rows.selectionColor).toBe('#aabbcc')
    })

    it('gestisce height come numero intero da stringa px', () => {
        const widget = makeBaseWidget()
        widget.style.tr = { height: '45px' }
        const result = getFormattedStyle(widget)
        expect(result.rows.height).toBe(45)
    })

    it('gestisce height già come numero', () => {
        const widget = makeBaseWidget()
        widget.style.tr = { height: 50 }
        const result = getFormattedStyle(widget)
        expect(result.rows.height).toBe(50)
    })

    // ─── Column groups ─────────────────────────────────────────────────────────

    it('columnGroups contiene sempre almeno lo stile di default per target="all"', () => {
        // getDefaultColumnStyles() include già uno stile per target='all' dal descriptor
        const result = getFormattedStyle(makeBaseWidget({ groups: [] }))
        expect(result.columnGroups.styles).toBeDefined()
        expect(result.columnGroups.styles.length).toBeGreaterThanOrEqual(1)
        const allStyle = result.columnGroups.styles.find((s: any) => s.target === 'all')
        expect(allStyle).toBeDefined()
    })

    it('aggiunge uno stile specifico per ogni group con proprietà di stile', () => {
        const widget = makeBaseWidget({
            groups: [
                {
                    id: 'grp1',
                    'background-color': '#123456',
                    color: '#ffffff',
                    'justify-content': 'center',
                    'font-size': '12px',
                    'font-family': 'Arial',
                    'font-style': 'normal',
                    'font-weight': 'bold'
                }
            ]
        })
        const result = getFormattedStyle(widget)
        // Uno stile per il gruppo + quello di default 'all'
        const grpStyle = result.columnGroups.styles.find((s: any) => Array.isArray(s.target) && s.target.includes('grp1'))
        expect(grpStyle).toBeDefined()
        expect(grpStyle.properties['background-color']).toBe('#123456')
        expect(grpStyle.properties.color).toBe('#ffffff')
    })

    it('non aggiunge stili specifici per group senza proprietà di stile', () => {
        const widget = makeBaseWidget({ groups: [{ id: 'grp1', name: 'Group 1' }] })
        const result = getFormattedStyle(widget)
        // Solo lo stile di default 'all', nessuno stile per grp1
        const grpStyle = result.columnGroups.styles.find((s: any) => Array.isArray(s.target) && s.target.includes('grp1'))
        expect(grpStyle).toBeUndefined()
    })

    // ─── Summary ───────────────────────────────────────────────────────────────

    it('restituisce summary di default se settings.summary è assente', () => {
        const widget = makeBaseWidget()
        delete widget.settings.summary
        const result = getFormattedStyle(widget)
        expect(result.summary).toBeDefined()
    })

    it('formatta il summary style convertendo i colori hsl in rgb', () => {
        const widget = makeBaseWidget()
        widget.settings.summary = {
            style: {
                'background-color': 'hsl(0, 0%, 100%)',
                color: 'hsl(0, 0%, 0%)',
                'font-family': 'Arial',
                'font-size': '12px',
                'font-style': 'normal',
                'font-weight': 'bold'
            }
        }
        const result = getFormattedStyle(widget)
        expect(result.summary['background-color']).toBe('rgb(255, 255, 255)')
        expect(result.summary.color).toBe('rgb(0, 0, 0)')
        expect(result.summary['font-family']).toBe('Arial')
    })
})
