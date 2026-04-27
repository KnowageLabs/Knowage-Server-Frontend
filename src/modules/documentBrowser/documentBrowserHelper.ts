import { getRouteDocumentType as resolveRouteDocumentType } from '@/helpers/commons/documentRouteHelper'

export function getRouteDocumentType(item: any) {
    return resolveRouteDocumentType(item)
}
