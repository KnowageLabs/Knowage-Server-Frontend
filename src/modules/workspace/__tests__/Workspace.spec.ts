import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Workspace from '../Workspace.vue'
import * as api from '../workspaceApi'
import useWorkspaceStore from '../workspace.store'

vi.mock('../workspaceApi')
vi.mock('@/App.store', () => ({ default: () => ({ user: { userId: 'me', functionalities: [] } }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/composables/usePageTour', () => ({ usePageTour: vi.fn() }))
vi.mock('../WorkspaceTour', () => ({ startWorkspaceTour: vi.fn() }))
vi.mock('vue-router', () => ({ useRoute: () => route }))

let route: { meta: { wsTab: string }; query: Record<string, string> }

function mountWorkspace() {
    return shallowMount(Workspace, { global: { mocks: { $t: (key: string) => key } } })
}

describe('workspace document refresh', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        vi.stubEnv('VITE_WORKSPACE_BE1', undefined)
        setActivePinia(createPinia())
        route = reactive({ meta: { wsTab: 'documents' }, query: {} })
        vi.mocked(api.getFolderTree).mockResolvedValue({ id: null, parentId: null, name: 'root', description: '', progr: 0, created: '', children: [] })
        vi.mocked(api.getWorkspaceDocuments).mockResolvedValue([])
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('reloads cached documents when returning from execution and shares the initial requests', async () => {
        const firstVisit = mountWorkspace()
        await flushPromises()
        expect(api.getWorkspaceDocuments).toHaveBeenCalledOnce()
        firstVisit.unmount()

        vi.mocked(api.getWorkspaceDocuments).mockResolvedValueOnce([
            { kind: 'DOCUMENT', id: 5, biObjectId: 5, label: 'SALES', name: 'Sales', typeCode: 'DASHBOARD', lastRun: '2026-11-12T09:00:00Z', links: [] }
        ])
        const returnVisit = mountWorkspace()
        await flushPromises()

        expect(api.getWorkspaceDocuments).toHaveBeenCalledTimes(2)
        expect(useWorkspaceStore().documents[0].lastRun).toBe(Date.parse('2026-11-12T09:00:00Z'))
        returnVisit.unmount()
    })

    it('refreshes on entering Recent but not when changing search or collection filters', async () => {
        const wrapper = mountWorkspace()
        await flushPromises()

        route.query = { scope: 'recent' }
        await flushPromises()
        expect(api.getWorkspaceDocuments).toHaveBeenCalledTimes(2)

        route.query = { scope: 'recent', q: 'Sales', collection: 'finance' }
        await flushPromises()
        expect(api.getWorkspaceDocuments).toHaveBeenCalledTimes(2)
        wrapper.unmount()
    })

    it('refreshes when switching back to the kept-alive documents tab', async () => {
        const wrapper = mountWorkspace()
        await flushPromises()
        route.meta.wsTab = 'datasets'
        route.query = {}
        await flushPromises()
        route.meta.wsTab = 'documents'
        await flushPromises()

        expect(api.getWorkspaceDocuments).toHaveBeenCalledTimes(2)
        wrapper.unmount()
    })
})
