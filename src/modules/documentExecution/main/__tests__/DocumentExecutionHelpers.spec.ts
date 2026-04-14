import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { iExporter } from '../DocumentExecution'

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

import { createToolbarMenuItems, getCurrentDashboardReadyState, getCurrentDocumentBreadcrumb } from '../DocumentExecutionHelpers'

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
