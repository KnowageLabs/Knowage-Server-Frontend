import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'
import { isDocumentCreator } from '@/modules/documentExecution/dashboard/DashboardPermissions'

// Who can edit a document (details, clone, delete), in any engine. Admins and the creator in every state, developers only in DEV.
export const canManageDocument = (user: any, document: any): boolean => {
    if (!user || !document) return false
    if (user.isSuperadmin || user.functionalities?.includes(UserFunctionalitiesConstants.DOCUMENT_ADMIN_MANAGEMENT)) return true
    if (isDocumentCreator(user, document)) return true
    return document.stateCode === 'DEV' && !!user.functionalities?.includes(UserFunctionalitiesConstants.DOCUMENT_DEV_MANAGEMENT)
}
