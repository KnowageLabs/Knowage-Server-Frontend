import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { iExporter } from '../DocumentExecution'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'

const { emitMock, mainStoreMock, resetParametersMock } = vi.hoisted(() => {
    const emitMock = vi.fn()
    const mainStoreMock = { isEnterprise: false }
    const resetParametersMock = vi.fn()
    return { emitMock, mainStoreMock, resetParametersMock }
})

vi.mock('@/App.store.js', () => ({
    default: vi.fn(() => mainStoreMock)
}))

vi.mock('@/modules/documentExecution/dashboard/DashboardHelpers', () => ({
    emitter: {
        emit: emitMock
    }
}))

vi.mock('@/components/UI/KnParameterSidebar/KnParameterSidebarHelper', () => ({
    parameterSidebarEmitter: {
        emit: resetParametersMock
    }
}))

import { canEditDocument, canSeeDashboardEditorActions, createToolbarMenuItems, getCurrentDashboardReadyState, getCurrentDocumentBreadcrumb } from '../DocumentExecutionHelpers'

const t = (key: string) => key

const createFunctions = () => ({
    openRank: vi.fn(),
    export: vi.fn(),
    openMailDialog: vi.fn(),
    openMetadata: vi.fn(),
    openNotes: vi.fn(),
    showScheduledExecutions: vi.fn(),
    addToWorkspace: vi.fn(),
    showOLAPCustomView: vi.fn(),
    copyLink: vi.fn(),
    openDashboardGeneralSettings: vi.fn(),
    openSaveCurrentViewDialog: vi.fn(),
    openSavedViewsListDialog: vi.fn(),
    openHelp: vi.fn(),
    fullScreen: vi.fn(),
    toggleFinalUser: vi.fn(),
    clearCache: vi.fn()
})

const createUser = () => ({
    enterprise: false,
    functionalities: [],
    userId: 'test-user'
})

const createDocument = (overrides = {}) => ({
    typeCode: 'DASHBOARD',
    dashboardId: 'dashboard-1',
    seeAsFinalUser: false,
    engine: 'KnowageDashboardEngine',
    ...overrides
})

const getViewsItems = (toolbarMenuItems: any[]) => toolbarMenuItems.find((menuItem: any) => menuItem.label === 'documentExecution.main.views')?.items ?? []

describe('createToolbarMenuItems', () => {
    beforeEach(() => {
        emitMock.mockReset()
        resetParametersMock.mockReset()
    })

    it('keeps Saved Views List available before a dashboard is ready', () => {
        const functions = createFunctions()

        const toolbarMenuItems = createToolbarMenuItems(createDocument(), functions, [] as iExporter[], createUser(), false, 'dashboard', t, false, { filterStatus: [], isReadyForExecution: false }, false)
        const viewItems = getViewsItems(toolbarMenuItems)

        expect(viewItems).toHaveLength(1)
        expect(viewItems[0].label).toBe('documentExecution.main.savedViewsList')

        viewItems[0].command()

        expect(functions.openSavedViewsListDialog).toHaveBeenCalledOnce()
        expect(emitMock).not.toHaveBeenCalled()
    })

    it('shows Save Current View only after the dashboard is ready', () => {
        const functions = createFunctions()

        const toolbarMenuItems = createToolbarMenuItems(createDocument(), functions, [] as iExporter[], createUser(), false, 'dashboard', t, false, { filterStatus: [], isReadyForExecution: true }, true)
        const viewItems = getViewsItems(toolbarMenuItems)

        expect(viewItems.map((item: any) => item.label)).toEqual(['documentExecution.main.saveCurrentView', 'documentExecution.main.savedViewsList'])

        viewItems[0].command()

        expect(emitMock).toHaveBeenCalledWith('openSaveCurrentViewDialog', 'dashboard-1')
        expect(functions.openSaveCurrentViewDialog).not.toHaveBeenCalled()
    })

    it('preserves the non-dashboard Save Current View behavior', () => {
        const functions = createFunctions()

        const toolbarMenuItems = createToolbarMenuItems(createDocument({ typeCode: 'DOCUMENT_COMPOSITE' }), functions, [] as iExporter[], createUser(), false, 'iframe', t, false, { filterStatus: [], isReadyForExecution: false }, false)
        const viewItems = getViewsItems(toolbarMenuItems)

        expect(viewItems.map((item: any) => item.label)).toEqual(['documentExecution.main.saveCurrentView', 'documentExecution.main.savedViewsList'])

        viewItems[0].command()

        expect(functions.openSaveCurrentViewDialog).toHaveBeenCalledOnce()
        expect(emitMock).not.toHaveBeenCalled()
    })

    it('hides dashboard settings when editor actions are not allowed yet', () => {
        const functions = createFunctions()
        const user = createUser()
        user.functionalities = [UserFunctionalitiesConstants.DOCUMENT_ADMIN_MANAGEMENT]

        const toolbarMenuItems = createToolbarMenuItems(createDocument(), functions, [] as iExporter[], user, false, 'dashboard', t, false, { filterStatus: [], isReadyForExecution: false }, false, false)

        expect(toolbarMenuItems.find((menuItem: any) => menuItem.label === 'common.settings')).toBeUndefined()
    })
})

describe('getCurrentDocumentBreadcrumb', () => {
    it('matches the active breadcrumb by document name when available', () => {
        const breadcrumb = { label: 'Sales Dashboard', document: { label: 'SALES_DASH' }, dashboardReady: true }

        expect(getCurrentDocumentBreadcrumb({ name: 'Sales Dashboard', label: 'OTHER' }, [breadcrumb] as any)).toEqual(breadcrumb)
    })

    it('falls back to document label when the current document name is unavailable', () => {
        const breadcrumb = { label: 'Sales Dashboard', document: { label: 'SALES_DASH' }, dashboardReady: true }

        expect(getCurrentDocumentBreadcrumb({ label: 'SALES_DASH' }, [breadcrumb] as any)).toEqual(breadcrumb)
    })
})

describe('getCurrentDashboardReadyState', () => {
    it('returns the active breadcrumb readiness when available', () => {
        const breadcrumbs = [{ label: 'Sales Dashboard', document: { label: 'SALES_DASH' }, dashboardReady: true }]

        expect(getCurrentDashboardReadyState({ label: 'SALES_DASH' }, breadcrumbs as any, false)).toBe(true)
    })

    it('falls back to the provided state when no active breadcrumb is found', () => {
        expect(getCurrentDashboardReadyState({ label: 'UNKNOWN' }, [] as any, false)).toBe(false)
        expect(getCurrentDashboardReadyState({ label: 'UNKNOWN' }, [] as any, true)).toBe(true)
    })
})

describe('canSeeDashboardEditorActions', () => {
    it('does not expose editor actions to final users before execution just because dashboardId is missing', () => {
        const user = createUser()
        const document = createDocument({ dashboardId: undefined, creationUser: 'different-user' })

        expect(canSeeDashboardEditorActions(user, document, false, false)).toBe(false)
    })

    it('keeps editor actions available to document owners even before execution', () => {
        const user = createUser()
        const document = createDocument({ dashboardId: undefined, creationUser: 'test-user' })

        expect(canSeeDashboardEditorActions(user, document, false, false)).toBe(true)
    })

    it('hides editor actions in see-as-final-user mode', () => {
        const user = createUser()
        user.functionalities = [UserFunctionalitiesConstants.DOCUMENT_ADMIN_MANAGEMENT]

        expect(canSeeDashboardEditorActions(user, createDocument(), true, false)).toBe(false)
    })

    it('allows editor actions to DEV managers on DEV documents', () => {
        const user = createUser()
        user.functionalities = [UserFunctionalitiesConstants.DOCUMENT_DEV_MANAGEMENT]

        expect(canSeeDashboardEditorActions(user, createDocument({ creationUser: 'different-user', stateCode: 'DEV' }), false, false)).toBe(true)
    })
})

describe('canEditDocument', () => {
    it('returns false for unsupported engines', () => {
        expect(canEditDocument(createUser(), createDocument({ engine: 'QBE' }))).toBe(false)
    })
})
