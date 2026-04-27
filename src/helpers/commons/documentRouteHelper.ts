type DocumentRouteType =
    | 'registry'
    | 'dashboard'
    | 'document-composite'
    | 'office-doc'
    | 'olap'
    | 'map'
    | 'report'
    | 'kpi'
    | 'dossier'
    | 'etl'
    | ''

interface IDocumentRouteItem {
    routeType?: string | null
    documentRouteType?: string | null
    typeCode?: string | null
    biObjectTypeCode?: string | null
    documentType?: string | null
    DOCUMENT_TYPE?: string | null
    DOCUMENT_TYPE_CODE?: string | null
}

const DOCUMENT_ROUTE_TYPE_MAP: Record<string, Exclude<DocumentRouteType, ''>> = {
    DATAMART: 'registry',
    DASHBOARD: 'dashboard',
    DOCUMENT_COMPOSITE: 'document-composite',
    OFFICE_DOC: 'office-doc',
    OLAP: 'olap',
    MAP: 'map',
    REPORT: 'report',
    KPI: 'kpi',
    DOSSIER: 'dossier',
    ETL: 'etl'
}

export function getRouteDocumentType(item: IDocumentRouteItem | null | undefined): DocumentRouteType {
    const persistedRouteType = item?.documentRouteType?.trim() || item?.routeType?.trim()
    if (persistedRouteType && Object.values(DOCUMENT_ROUTE_TYPE_MAP).includes(persistedRouteType as Exclude<DocumentRouteType, ''>)) {
        return persistedRouteType as Exclude<DocumentRouteType, ''>
    }

    const rawDocumentType =
        item?.typeCode ??
        item?.biObjectTypeCode ??
        item?.documentType ??
        item?.DOCUMENT_TYPE_CODE ??
        item?.DOCUMENT_TYPE ??
        ''
    const normalizedDocumentType = rawDocumentType.trim().toUpperCase()

    return DOCUMENT_ROUTE_TYPE_MAP[normalizedDocumentType] ?? ''
}
