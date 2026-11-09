import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'

export const isDocumentCreator = (user: any, document: any): boolean => {
    return !!user?.userId && !!document?.creationUser && document.creationUser === user.userId
}

// Who can edit the dashboard layout (drag, resize, lock widgets). Pure, so it can be used with any user object.
export const isDashboardEditor = (user: any, document: any): boolean => {
    if (!user || !document || document.seeAsFinalUser) return false
    return !!user.functionalities?.includes(UserFunctionalitiesConstants.DOCUMENT_ADMIN_MANAGEMENT) || isDocumentCreator(user, document)
}
