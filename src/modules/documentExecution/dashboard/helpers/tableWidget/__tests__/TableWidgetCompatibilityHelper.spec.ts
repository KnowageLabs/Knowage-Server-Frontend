import { describe, it, expect, beforeEach } from 'vitest'
import { getFormattedPaginations } from '../TableWidgetCompatibilityHelper'
// Nota: getColumnId dipende da columnNameIdMap che viene popolato da formatTableWidget
// che a sua volta richiede l'intero modello dashboard. Viene testato qui tramite
// l'indiretta di getFormattedWidgetColumns, già coperta in WidgetColumnHelper.spec.ts.

// ─── getFormattedPaginations ──────────────────────────────────────────────────

describe('getFormattedPaginations', () => {
    it('restituisce la paginazione di default se settings è assente', () => {
        const widget = {}
        const result = getFormattedPaginations(widget)
        expect(result).toBeDefined()
        expect(result.properties).toBeDefined()
        expect(result.properties.offset).toBe(0)
    })

    it('restituisce la paginazione di default se settings.pagination è assente', () => {
        const widget = { settings: {} }
        const result = getFormattedPaginations(widget)
        expect(result).toBeDefined()
        expect(result.properties.offset).toBe(0)
    })

    it('mappa correttamente enabled e itemsNumber', () => {
        const widget = {
            settings: {
                pagination: {
                    enabled: true,
                    itemsNumber: 25
                }
            }
        }
        const result = getFormattedPaginations(widget)
        expect(result.enabled).toBe(true)
        expect(result.properties.itemsNumber).toBe(25)
    })

    it('usa 15 come itemsNumber di default se non specificato', () => {
        const widget = {
            settings: {
                pagination: {
                    enabled: true
                }
            }
        }
        const result = getFormattedPaginations(widget)
        expect(result.properties.itemsNumber).toBe(15)
    })

    it('offset è sempre 0 al caricamento', () => {
        const widget = {
            settings: {
                pagination: {
                    enabled: true,
                    itemsNumber: 50
                }
            }
        }
        const result = getFormattedPaginations(widget)
        expect(result.properties.offset).toBe(0)
    })

    it('totalItems è sempre 0 al caricamento', () => {
        const widget = {
            settings: {
                pagination: {
                    enabled: true,
                    itemsNumber: 10
                }
            }
        }
        const result = getFormattedPaginations(widget)
        expect(result.properties.totalItems).toBe(0)
    })

    it('enabled è false quando pagination.enabled è false', () => {
        const widget = {
            settings: {
                pagination: {
                    enabled: false,
                    itemsNumber: 15
                }
            }
        }
        const result = getFormattedPaginations(widget)
        expect(result.enabled).toBe(false)
    })
})
