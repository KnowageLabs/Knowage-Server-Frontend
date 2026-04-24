import { describe, expect, it } from 'vitest'
import { getRouteDocumentType } from '../documentRouteHelper'

describe('documentRouteHelper', () => {
    it('maps document type codes to the correct execution route', () => {
        expect(getRouteDocumentType({ typeCode: 'DASHBOARD' })).toBe('dashboard')
        expect(getRouteDocumentType({ typeCode: 'DOCUMENT_COMPOSITE' })).toBe('document-composite')
        expect(getRouteDocumentType({ typeCode: 'REPORT' })).toBe('report')
    })

    it('supports alternative document type field names used across the app', () => {
        expect(getRouteDocumentType({ documentType: 'DATAMART' })).toBe('registry')
        expect(getRouteDocumentType({ biObjectTypeCode: 'OLAP' })).toBe('olap')
        expect(getRouteDocumentType({ DOCUMENT_TYPE_CODE: 'KPI' })).toBe('kpi')
    })

    it('reuses persisted route types when available', () => {
        expect(getRouteDocumentType({ documentRouteType: 'dashboard' })).toBe('dashboard')
        expect(getRouteDocumentType({ routeType: 'document-composite' })).toBe('document-composite')
    })
})
