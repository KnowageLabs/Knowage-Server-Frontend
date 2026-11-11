import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import deepcopy from 'deepcopy'
import DocumentDetailsHistory from '../DocumentDetailsHistory.vue'

const { store, dialog, onOk } = vi.hoisted(() => {
    const onOk = vi.fn()
    return {
        store: { user: {}, setInfo: vi.fn(), setError: vi.fn() },
        dialog: vi.fn(),
        onOk
    }
})

vi.mock('@/App.store', () => ({ default: () => store }))
vi.mock('quasar', async (importOriginal) => ({
    ...(await importOriginal<typeof import('quasar')>()),
    useQuasar: () => ({ dialog })
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('../DocumentDetailsHistoryEditor.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../../../dialogs/olapDesignerDialog/DocumentDetailOlapHelpers', () => ({ startOlap: vi.fn() }))
vi.mock('@/helpers/commons/fileHelper', () => ({ downloadDirect: vi.fn() }))

const renderHistory = async (failedIds: number[] = []) => {
    const server = {
        templates: [
            { id: 1, name: 'active.xml', active: true },
            { id: 2, name: 'march-first.xml', active: false },
            { id: 3, name: 'march-second.xml', active: false },
            { id: 4, name: 'april.xml', active: false }
        ]
    }
    const http = {
        get: vi.fn(async () => ({ data: deepcopy(server.templates) })),
        delete: vi.fn(async (url: string) => {
            const id = Number(url.split('/').pop())
            if (failedIds.includes(id)) throw new Error('Deletion failed')
            server.templates = server.templates.filter((template) => template.id !== id)
            return {}
        })
    }
    const wrapper = shallowMount(DocumentDetailsHistory, {
        props: { selectedDocument: { id: 99 } as any },
        global: {
            mocks: { $http: http, $t: (key: string, values?: { count: number }) => (values ? `${key}:${values.count}` : key) },
            renderStubDefaultSlot: true,
            directives: { ClosePopup: {} },
            stubs: ['q-checkbox', 'q-input', 'q-icon', 'q-separator', 'q-btn', 'q-badge', 'q-tooltip', 'q-scroll-area', 'q-linear-progress', 'q-list', 'q-item', 'q-item-section', 'q-item-label', 'q-avatar', 'q-menu', 'q-space']
        }
    })
    await flushPromises()
    return { wrapper, http, server }
}

describe('Document Details template history selection', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        dialog.mockReturnValue({ onOk })
    })

    it('selects only visible inactive templates without changing the preview or hidden selections', async () => {
        const { wrapper } = await renderHistory()
        try {
            expect(wrapper.findAllComponents('[data-test="template-checkbox"]')[0].props('disable')).toBe(true)
            expect(wrapper.findComponent('[data-test="delete-selected-templates"]').props('disable')).toBe(true)
            await wrapper.setData({ selectedTemplateIds: [4], searchText: 'march' })
            wrapper.findComponent('[data-test="select-all-templates"]').vm.$emit('update:modelValue', true)
            await wrapper.vm.$nextTick()

            expect(wrapper.vm.selectedTemplateIds).toEqual([4, 2, 3])
            expect(wrapper.vm.selectedTemplate).toEqual({})
            expect(wrapper.vm.templateSelectionState).toBe(true)
            wrapper.vm.toggleAllTemplates(false)
            expect(wrapper.vm.selectedTemplateIds).toEqual([4])
            expect(wrapper.vm.templateSelectionState).toBe(false)
            await wrapper.setData({ selectedTemplateIds: [2] })
            expect(wrapper.vm.templateSelectionState).toBe(null)
        } finally {
            wrapper.unmount()
        }
    })

    it('confirms once, deletes each selected inactive template, reloads once, and clears a deleted preview', async () => {
        const { wrapper, http } = await renderHistory()
        try {
            await wrapper.setData({
                selectedTemplateIds: [1, 2, 3],
                selectedTemplate: wrapper.vm.listOfTemplates[1],
                selectedTemplateFileType: 'xml',
                selectedTemplateContent: '<old />',
                originalTemplateContent: '<old />',
                isEditMode: true
            })
            wrapper.vm.deleteSelectedTemplatesConfirm()
            expect(dialog).toHaveBeenCalledOnce()
            expect(dialog.mock.calls[0][0].message).toBe('documentExecution.documentDetails.history.deleteTemplatesMessage:2')
            expect(http.delete).not.toHaveBeenCalled()

            await onOk.mock.calls[0][0]()

            expect(http.delete.mock.calls.map(([url]) => url.split('/').pop())).toEqual(['2', '3'])
            expect(http.get).toHaveBeenCalledTimes(2)
            expect(wrapper.vm.listOfTemplates.map((template) => template.id)).toEqual([1, 4])
            expect(wrapper.vm.selectedTemplateIds).toEqual([])
            expect(wrapper.vm.selectedTemplateFileType).toBe(null)
            expect(wrapper.vm.selectedTemplateContent).toBe('')
            expect(wrapper.vm.isEditMode).toBe(false)
            expect(wrapper.vm.deleting).toBe(false)
            expect(store.setInfo).toHaveBeenCalledOnce()
            expect(store.setError).not.toHaveBeenCalled()
        } finally {
            wrapper.unmount()
        }
    })

    it('continues after a failed deletion and keeps failed templates selected for retry', async () => {
        const { wrapper, http } = await renderHistory([3])
        try {
            await wrapper.setData({ selectedTemplateIds: [2, 3, 4] })
            await wrapper.vm.deleteTemplates(wrapper.vm.listOfTemplates)

            expect(http.delete.mock.calls.map(([url]) => url.split('/').pop())).toEqual(['2', '3', '4'])
            expect(http.get).toHaveBeenCalledTimes(2)
            expect(wrapper.vm.listOfTemplates.map((template) => template.id)).toEqual([1, 3])
            expect(wrapper.vm.selectedTemplateIds).toEqual([3])
            expect(wrapper.vm.deleting).toBe(false)
            expect(store.setError).toHaveBeenCalledWith({ title: 'common.toast.errorTitle', msg: 'march-second.xml: Deletion failed' })
            expect(store.setInfo).not.toHaveBeenCalled()
        } finally {
            wrapper.unmount()
        }
    })

    it('rechecks active status when confirming and preserves the single-template delete action', async () => {
        const { wrapper, http } = await renderHistory()
        try {
            await wrapper.setData({ selectedTemplateIds: [2] })
            wrapper.vm.deleteSelectedTemplatesConfirm()
            wrapper.vm.listOfTemplates[1].active = true
            await onOk.mock.calls[0][0]()
            expect(http.delete).not.toHaveBeenCalled()

            wrapper.vm.deleteTemplateConfirm(wrapper.vm.listOfTemplates[2])
            await onOk.mock.calls[1][0]()
            expect(http.delete.mock.calls.map(([url]) => url.split('/').pop())).toEqual(['3'])
        } finally {
            wrapper.unmount()
        }
    })

    it('ignores a pending preview response after that template has been cleared', async () => {
        const { wrapper, http } = await renderHistory()
        try {
            let resolvePreview!: (response: any) => void
            http.get.mockImplementationOnce(() => new Promise((resolve) => (resolvePreview = resolve)))
            wrapper.vm.selectTemplate(wrapper.vm.listOfTemplates[1])
            wrapper.vm.clearSelectedTemplate()
            resolvePreview({ data: '<deleted />' })
            await flushPromises()

            expect(wrapper.vm.selectedTemplateContent).toBe('')
            expect(wrapper.vm.originalTemplateContent).toBe('')
        } finally {
            wrapper.unmount()
        }
    })
})
