import moment from 'moment'
import { iExporter, ICrossNavigationBreadcrumb } from './DocumentExecution'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'
import deepcopy from 'deepcopy'
import { parameterSidebarEmitter } from '@/components/UI/KnParameterSidebar/KnParameterSidebarHelper'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { isDashboardEditor, isDocumentCreator } from '@/modules/documentExecution/dashboard/DashboardPermissions'
import { iParameter } from '@/components/UI/KnParameterSidebar/KnParameterSidebar'
import store from '@/App.store.js'

const mainStore = store()

export const EXPORT_MENU_ICON = 'sym_o_download'
export const EXPORTER_ICON = 'sym_o_file_download'

export function createToolbarMenuItems(document: any, functions: any, exporters: iExporter[] | null, user: any, isOrganizerEnabled: boolean, mode: string | null, $t: any, newDashboardMode: boolean, filtersData: { filterStatus: iParameter[]; isReadyForExecution: boolean }, dashboardReady = false, showDashboardEditorActions = false) {
    const toolbarMenuItems = [] as any[]
    const isDashboardDocument = document?.typeCode === 'DASHBOARD'

    if (mode === 'dashboard' && showDashboardEditorActions && user.functionalities?.includes(UserFunctionalitiesConstants.DOCUMENT_ADMIN_MANAGEMENT)) {
        toolbarMenuItems.push({
            icon: 'sym_o_settings',
            label: $t('common.settings'),
            items: [
                { icon: 'sym_o_tune', label: $t('common.general'), command: () => functions.openDashboardGeneralSettings('General') },
                { icon: 'sym_o_data_object', label: $t('common.variables'), command: () => functions.openDashboardGeneralSettings('Variables') },
                { icon: 'sym_o_web_asset', label: $t('dashboard.generalSettings.customHeader'), command: () => functions.openDashboardGeneralSettings('Custom Header') },
                { icon: 'sym_o_alt_route', label: $t('managers.crossNavigationManagement.title'), command: () => functions.openDashboardGeneralSettings('CrossNavigation') }
            ]
        })
        if (mainStore.isEnterprise) toolbarMenuItems[0].items.push({ icon: 'sym_o_palette', label: $t('common.themes'), command: () => functions.openDashboardGeneralSettings('Themes') })
        toolbarMenuItems[0].items.push({ icon: 'sym_o_cleaning_services', label: $t('documentExecution.main.clearCache'), command: () => functions.clearCache() })
    }

    if (exporters && exporters.length !== 0 && !newDashboardMode) {
        toolbarMenuItems.push({
            icon: EXPORT_MENU_ICON,
            label: $t('common.export'),
            items: []
        })
    }

    const viewMenuItems = [{ icon: 'sym_o_list', label: $t('documentExecution.main.savedViewsList'), command: () => functions.openSavedViewsListDialog() }]
    if (!isDashboardDocument || dashboardReady) {
        viewMenuItems.unshift({ icon: 'sym_o_save', label: $t('documentExecution.main.saveCurrentView'), command: () => (isDashboardDocument ? emitter.emit('openSaveCurrentViewDialog', document.dashboardId) : functions.openSaveCurrentViewDialog()) })
    }
    toolbarMenuItems.push({ icon: 'sym_o_bookmarks', label: $t('documentExecution.main.views'), items: viewMenuItems })

    if (user.enterprise && !newDashboardMode) {
        const items = [{ icon: 'sym_o_star', label: $t('common.rank'), command: () => functions.openRank() }]
        if (user.functionalities.includes(UserFunctionalitiesConstants.HELP_ONLINE)) items.push({ icon: 'sym_o_help', label: $t('common.onlineHelp'), command: () => functions.openHelp() })
        toolbarMenuItems.push({
            icon: 'sym_o_info',
            label: $t('common.info.info'),
            items: items
        })
    }

    if (!newDashboardMode) {
        toolbarMenuItems.push({
            icon: 'sym_o_bolt',
            label: $t('common.shortcuts'),
            items: []
        })
    }

    if (!newDashboardMode) {
        const exporterMenuItem = toolbarMenuItems.find((menuItem: any) => menuItem.label === $t('common.export'))
        if (exporterMenuItem) exporters?.forEach((exporter: any) => exporterMenuItem.items.push({ icon: EXPORTER_ICON, label: exporter.name, command: () => functions.export(exporter.name) }))
    }

    if (user.functionalities.includes(UserFunctionalitiesConstants.SEE_METADATA_FUNCTIONALITY) && !newDashboardMode) {
        const index = toolbarMenuItems.findIndex((item: any) => item.label === $t('common.info.info'))
        if (index !== -1) toolbarMenuItems[index].items.unshift({ icon: 'sym_o_description', label: $t('common.metadata'), command: () => functions.openMetadata() })
    }

    if (user.functionalities.includes(UserFunctionalitiesConstants.SEE_NOTES_FUNCTIONALITY) && !newDashboardMode) {
        const index = toolbarMenuItems.findIndex((item: any) => item.label === $t('common.info.info'))
        if (index !== -1) toolbarMenuItems[index].items.push({ icon: 'sym_o_sticky_note_2', label: $t('common.notes'), command: () => functions.openNotes() })
    }

    if (user.functionalities.includes(UserFunctionalitiesConstants.SEE_SNAPSHOTS_FUNCTIONALITY) && user.enterprise && !newDashboardMode) {
        const index = toolbarMenuItems.findIndex((item: any) => item.label === $t('common.shortcuts'))
        if (index !== -1) toolbarMenuItems[index].items.unshift({ icon: 'sym_o_schedule', label: $t('documentExecution.main.showScheduledExecutions'), command: () => functions.showScheduledExecutions() })
    }

    if (isOrganizerEnabled && !newDashboardMode) {
        const index = toolbarMenuItems.findIndex((item: any) => item.label === $t('common.shortcuts'))
        if (index !== -1) toolbarMenuItems[index].items.unshift({ icon: 'sym_o_work', label: $t('documentExecution.main.addToWorkspace'), command: () => functions.addToWorkspace() })
    }

    if (mode === 'olap') {
        const index = toolbarMenuItems.findIndex((item: any) => item.label === $t('common.shortcuts'))
        if (index !== -1) toolbarMenuItems[index].items.unshift({ icon: 'sym_o_visibility', label: $t('documentExecution.main.showOLAPCustomView'), command: () => functions.showOLAPCustomView() })
    }

    if (user.functionalities.includes(UserFunctionalitiesConstants.ENABLE_TO_COPY_AND_EMBED) && !newDashboardMode) {
        const index = toolbarMenuItems.findIndex((item: any) => item.label === $t('common.shortcuts'))
        if (index !== -1) {
            toolbarMenuItems[index].items.push({ icon: 'sym_o_link', label: $t('documentExecution.main.copyLink'), command: () => functions.copyLink(false) })
            toolbarMenuItems[index].items.push({ icon: 'sym_o_code', label: $t('documentExecution.main.embedInHtml'), command: () => functions.copyLink(true) })
        }
    }

    if (filtersData && filtersData.filterStatus?.length > 0) toolbarMenuItems.push({ icon: 'sym_o_ink_eraser', label: $t('documentExecution.main.resetParameters'), command: () => parameterSidebarEmitter.emit('resetAllParameters') })
    if (mode === 'dashboard' && user.functionalities?.includes(UserFunctionalitiesConstants.DOCUMENT_ADMIN_MANAGEMENT) && (showDashboardEditorActions || document?.seeAsFinalUser)) toolbarMenuItems.push({ icon: 'sym_o_supervisor_account', label: document.seeAsFinalUser ? $t('documentExecution.main.seeAsEditor') : $t('documentExecution.main.seeAsFinalUser'), command: () => functions.toggleFinalUser() })
    toolbarMenuItems.push({ icon: 'sym_o_fullscreen', label: $t('documentExecution.main.seeInFullscreen'), command: () => functions.fullScreen() })

    // Locking only matters to those who can move widgets, so it follows the same rule as the widgets (canEditDashboard)
    if (mode === 'dashboard' && dashboardReady && showDashboardEditorActions && isDashboardEditor(user, document)) {
        toolbarMenuItems.push({ icon: 'sym_o_lock', label: $t('dashboard.lockAllWidgets'), command: () => emitter.emit('lockAllWidgets', true) })
        toolbarMenuItems.push({ icon: 'sym_o_lock_open', label: $t('dashboard.unlockAllWidgets'), command: () => emitter.emit('unlockAllWidgets', false) })
    }

    removeEmptyToolbarItems(toolbarMenuItems)

    return toolbarMenuItems
}

export const getCurrentDocumentBreadcrumb = (document: any, breadcrumbs: ICrossNavigationBreadcrumb[]) => {
    const currentDocumentName = document?.name
    const currentDocumentLabel = document?.label
    if (!currentDocumentName && !currentDocumentLabel) return null
    return breadcrumbs.find((breadcrumb: ICrossNavigationBreadcrumb) => breadcrumb.label === currentDocumentName || breadcrumb.document?.label === currentDocumentLabel) ?? null
}

export const getCurrentDashboardReadyState = (document: any, breadcrumbs: ICrossNavigationBreadcrumb[], fallback = false) => {
    return getCurrentDocumentBreadcrumb(document, breadcrumbs)?.dashboardReady ?? fallback
}

export const canEditDocument = (user: any, document: any) => {
    if (!user || !document) return false
    const isEditableEngine = document.engine?.toLowerCase() === 'knowagecockpitengine' || document.engine?.toLowerCase() === 'knowagedashboardengine'
    if (!isEditableEngine) return false
    return user.functionalities?.includes(UserFunctionalitiesConstants.DOCUMENT_ADMIN_MANAGEMENT) || isDocumentCreator(user, document) || (document.stateCode === 'DEV' && user.functionalities?.includes(UserFunctionalitiesConstants.DOCUMENT_DEV_MANAGEMENT))
}

export const canSeeDashboardEditorActions = (user: any, document: any, seeAsFinalUser = false, newDashboardMode = false) => {
    if (seeAsFinalUser) return false
    if (newDashboardMode) return true
    return canEditDocument(user, document)
}

const removeEmptyToolbarItems = (toolbarMenuItems: any[]) => {
    for (let i = toolbarMenuItems.length - 1; i >= 0; i--) {
        if (toolbarMenuItems[i].items && toolbarMenuItems[i].items.length === 0) {
            toolbarMenuItems.splice(i, 1)
        }
    }
}

export const getValidDate = (value: string, serverDateFormat: string) => {
    const extractedDateValue = extractDatePart(value)
    let momentDate = moment(deepcopy(extractedDateValue))
    const tempServerDateFormat = convertToMomentFormat(serverDateFormat)
    const validFormats = [tempServerDateFormat, 'DD/MM/YYYY', 'DD/MM/YYYY HH:mm:ss.SSS']
    let tempDateFormatFromTheDateValue = extractDateFormatPart(value)
    if (tempDateFormatFromTheDateValue) {
        tempDateFormatFromTheDateValue = convertToMomentFormat(tempDateFormatFromTheDateValue)
        validFormats.unshift(tempDateFormatFromTheDateValue)
    }
    for (let i = 0; i < validFormats.length; i++) {
        momentDate = moment(deepcopy(extractedDateValue), validFormats[i])
        if (momentDate.isValid()) return momentDate.toDate()
    }
    return ''
}

const convertToMomentFormat = (format: string) => {
    return format.replace(/yyyy/g, 'YYYY').replace(/dd/g, 'DD').replace(/mm/g, 'MM')
}

const extractDatePart = (dateString: string) => {
    if (dateString.includes('#')) {
        return dateString.split('#')[0]
    }
    return dateString
}

const extractDateFormatPart = (dateString: string) => {
    if (dateString.includes('#')) {
        return dateString.split('#')[1]
    }
    return null
}
