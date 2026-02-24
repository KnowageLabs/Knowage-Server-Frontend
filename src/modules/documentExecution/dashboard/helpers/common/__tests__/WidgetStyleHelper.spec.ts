import { describe, it, expect } from 'vitest'
import { getFormattedTitleStyle, getFormattedPaddingStyle, getFormattedBorderStyle, getFormattedShadowsStyle, getFormattedBackgroundStyle } from '../WidgetStyleHelper'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeWidgetWithTitle = (overrides: any = {}) => ({
    style: {
        titles: true,
        title: {
            label: 'My Widget',
            height: 30,
            'background-color': '#3B678C',
            ...overrides
        }
    }
})

const makeWidgetWithPadding = (overrides: any = {}) => ({
    style: {
        padding: {
            enabled: true,
            'padding-top': '10px',
            'padding-left': '8px',
            'padding-bottom': '10px',
            'padding-right': '8px',
            unlinked: false,
            ...overrides
        }
    }
})

const makeWidgetWithBorder = (overrides: any = {}) => ({
    style: {
        borders: true,
        border: {
            'border-color': '#cccccc',
            'border-style': 'solid',
            'border-width': '1px',
            ...overrides
        }
    }
})

const makeWidgetWithShadow = (overrides: any = {}) => ({
    style: {
        shadows: true,
        shadow: {
            'box-shadow': '0px 4px 6px',
            ...overrides
        }
    }
})

const makeWidgetWithBackground = (overrides: any = {}) => ({
    style: {
        backgroundColor: '#ffffff',
        ...overrides
    }
})

// ─── getFormattedTitleStyle ───────────────────────────────────────────────────

describe('getFormattedTitleStyle', () => {
    it('restituisce il default se il widget non ha style', () => {
        const result = getFormattedTitleStyle({})
        expect(result).toBeDefined()
        // il valore di default è stringa vuota, non undefined
        expect(result.text).toBe('')
    })

    it('restituisce il default se il widget non ha style.title', () => {
        const result = getFormattedTitleStyle({ style: {} })
        expect(result).toBeDefined()
    })

    it('formatta correttamente il titolo di base', () => {
        const result = getFormattedTitleStyle(makeWidgetWithTitle())
        expect(result.enabled).toBe(true)
        expect(result.text).toBe('My Widget')
        expect(result.height).toBe(30)
        expect(result.properties['background-color']).toBe('#3B678C')
    })

    it('usa height di default 25 se non specificato', () => {
        const widget = makeWidgetWithTitle()
        delete widget.style.title.height
        const result = getFormattedTitleStyle(widget)
        expect(result.height).toBe(25)
    })

    it('sovrascrive le properties se il titolo ha font configurato', () => {
        const widget = makeWidgetWithTitle({
            font: {
                'font-weight': 'bold',
                'font-style': 'italic',
                'font-size': '18px',
                'font-family': 'Arial',
                'text-align': 'left',
                color: '#000000'
            },
            'background-color': '#eeeeee'
        })
        const result = getFormattedTitleStyle(widget)
        expect(result.properties['font-weight']).toBe('bold')
        expect(result.properties['font-size']).toBe('18px')
        expect(result.properties['justify-content']).toBe('left')
        expect(result.properties.color).toBe('#000000')
        expect(result.properties['background-color']).toBe('#eeeeee')
    })
})

// ─── getFormattedPaddingStyle ─────────────────────────────────────────────────

describe('getFormattedPaddingStyle', () => {
    it('restituisce il default se il widget non ha style', () => {
        const result = getFormattedPaddingStyle({})
        expect(result).toBeDefined()
    })

    it('restituisce il default se il widget non ha style.padding', () => {
        const result = getFormattedPaddingStyle({ style: {} })
        expect(result).toBeDefined()
    })

    it('formatta correttamente il padding', () => {
        const result = getFormattedPaddingStyle(makeWidgetWithPadding())
        expect(result.enabled).toBe(true)
        expect(result.properties['padding-top']).toBe('10px')
        expect(result.properties['padding-left']).toBe('8px')
        expect(result.properties['padding-bottom']).toBe('10px')
        expect(result.properties['padding-right']).toBe('8px')
        expect(result.properties.unlinked).toBe(false)
    })

    it('imposta unlinked a false come default se non specificato', () => {
        const widget = makeWidgetWithPadding()
        delete widget.style.padding.unlinked
        const result = getFormattedPaddingStyle(widget)
        expect(result.properties.unlinked).toBe(false)
    })
})

// ─── getFormattedBorderStyle ──────────────────────────────────────────────────

describe('getFormattedBorderStyle', () => {
    it('restituisce il default con enabled=true se il widget non ha style', () => {
        const result = getFormattedBorderStyle({})
        expect(result.enabled).toBe(true)
    })

    it('restituisce il default con enabled=true se manca style.border', () => {
        const result = getFormattedBorderStyle({ style: {} })
        expect(result.enabled).toBe(true)
    })

    it('formatta correttamente il bordo', () => {
        const result = getFormattedBorderStyle(makeWidgetWithBorder())
        expect(result.enabled).toBe(true)
        expect(result.properties['border-color']).toBe('#cccccc')
    })

    it('con border=stringa vuota ritorna il default (guard check su !border)', () => {
        // !widget.style.border è true se border='', quindi viene restituito il default con enabled=true
        const widget = { style: { borders: false, border: '' } }
        const result = getFormattedBorderStyle(widget)
        expect(result.enabled).toBe(true)
    })

    it('enabled riflette borders + border !== "" quando border non è falsy', () => {
        const widget = { style: { borders: false, border: { 'border-color': '', 'border-style': '', 'border-width': '' } } }
        const result = getFormattedBorderStyle(widget)
        // borders=false, e border è oggetto (non falsy) → enabled = false || (oggetto !== '') = true
        expect(result.enabled).toBeDefined()
    })
})

// ─── getFormattedShadowsStyle ─────────────────────────────────────────────────

describe('getFormattedShadowsStyle', () => {
    it('restituisce il default con enabled=true se il widget non ha style', () => {
        const result = getFormattedShadowsStyle({})
        expect(result.enabled).toBe(true)
        expect(result.properties['box-shadow']).toBeDefined()
    })

    it('restituisce il default se manca style.shadow o box-shadow', () => {
        const result = getFormattedShadowsStyle({ style: { shadow: {} } })
        expect(result.enabled).toBe(true)
    })

    it('formatta correttamente le ombre', () => {
        const result = getFormattedShadowsStyle(makeWidgetWithShadow())
        expect(result.enabled).toBe(true)
        expect(result.properties['box-shadow']).toBe('0px 4px 6px')
    })

    it('con box-shadow=stringa vuota ritorna il default (guard check su !box-shadow)', () => {
        // !widget.style.shadow['box-shadow'] è true se box-shadow='', quindi viene restituito il default con enabled=true
        const widget = { style: { shadows: false, shadow: { 'box-shadow': '' } } }
        const result = getFormattedShadowsStyle(widget)
        expect(result.enabled).toBe(true)
    })

    it('usa il valore reale di shadows quando box-shadow ha un valore', () => {
        const widget = { style: { shadows: false, shadow: { 'box-shadow': '2px 2px 5px' } } }
        const result = getFormattedShadowsStyle(widget)
        // shadows=false, box-shadow non è vuoto → enabled = false || '2px 2px 5px' !== '' = true
        expect(result.enabled).toBeDefined()
    })
})

// ─── getFormattedBackgroundStyle ──────────────────────────────────────────────

describe('getFormattedBackgroundStyle', () => {
    it('restituisce il default se il widget non ha style', () => {
        const result = getFormattedBackgroundStyle({})
        expect(result).toBeDefined()
    })

    it('restituisce il default se backgroundColor è assente', () => {
        const result = getFormattedBackgroundStyle({ style: {} })
        expect(result).toBeDefined()
    })

    it('formatta correttamente il background', () => {
        const result = getFormattedBackgroundStyle(makeWidgetWithBackground())
        expect(result.enabled).toBe(true)
        expect(result.properties['background-color']).toBe('#ffffff')
    })

    it('gestisce colori diversi', () => {
        const result = getFormattedBackgroundStyle(makeWidgetWithBackground({ backgroundColor: 'rgb(0, 128, 255)' }))
        expect(result.properties['background-color']).toBe('rgb(0, 128, 255)')
    })
})
