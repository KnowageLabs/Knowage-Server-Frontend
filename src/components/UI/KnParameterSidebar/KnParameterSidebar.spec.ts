import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import type { iParameter } from './KnParameterSidebar'

const { storeMock, dataDependencyMock, lovDependencyMock } = vi.hoisted(() => ({
    storeMock: { $state: { user: { sessionRole: 'ROLE' } }, setInfo: vi.fn(), setError: vi.fn() },
    dataDependencyMock: vi.fn(),
    lovDependencyMock: vi.fn()
}))

vi.mock('@/App.store.js', () => ({ default: () => storeMock }))
vi.mock('@/modules/documentExecution/dashboard/DashboardHelpers', () => ({ emitter: { emit: vi.fn() } }))
vi.mock('./dialogs/KnParameterPopupDialog.vue', () => ({ default: { template: '<div />' } }))
vi.mock('./dialogs/KnParameterTreeDialog.vue', () => ({ default: { template: '<div />' } }))
vi.mock('./dialogs/KnParameterSavedParametersDialog.vue', () => ({ default: { template: '<div />' } }))
vi.mock('./KnParameterSidebarDataDependency', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./KnParameterSidebarDataDependency')>()),
    updateDataDependency: dataDependencyMock
}))
vi.mock('./KnParameterSidebarLovsDependency', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./KnParameterSidebarLovsDependency')>()),
    updateLovDependency: lovDependencyMock
}))

import KnParameterSidebar from './KnParameterSidebar.vue'

const date = (day: number, month = 0, year = 2026) => new Date(year, month, day)
const createParameter = (urlName: string, value: Date | null, dependencies: string[] = []) =>
    ({
        id: urlName,
        urlName,
        label: urlName,
        type: 'DATE',
        selectionType: '',
        valueSelection: 'man_in',
        showOnPanel: 'true',
        visible: true,
        mandatory: false,
        multivalue: false,
        parameterValue: [{ value, description: '' }],
        dependencies: { data: [], visual: [], lov: [], maxValue: dependencies },
        metadata: {},
        driverMaxValue: dependencies.length ? '31/12/2026' : null,
        driverMaxDateValue: dependencies.length ? date(31, 11) : null
    }) as unknown as iParameter

const deferredResponse = () => {
    let resolve!: (value: any) => void
    let reject!: (reason: any) => void
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
    })
    return { promise, resolve, reject }
}

describe('dynamic date maximum', () => {
    const wrappers: any[] = []
    let parent: iParameter
    let child: iParameter
    let post: ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.clearAllMocks()
        dataDependencyMock.mockReset()
        lovDependencyMock.mockReset()
        parent = createParameter('DATA_DA', date(1))
        child = createParameter('DATA_A', date(10), ['DATA_DA'])
        post = vi.fn().mockResolvedValue({ data: { maxValue: '31/01/2026' } })
    })

    afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

    const mount = (parameters: iParameter[], mode = 'execution') => {
        const wrapper = shallowMount(KnParameterSidebar, {
            props: {
                filtersData: { filterStatus: parameters, isReadyForExecution: true },
                propDocument: { label: 'TEST_MAX_DATA' },
                userRole: 'ROLE',
                propMode: mode,
                dateFormat: 'dd/MM/yyyy'
            },
            global: {
                mocks: { $http: { post }, $t: (key: string) => key },
                directives: { tooltip: () => {} },
                stubs: { Button: true, InputText: true }
            }
        })
        wrappers.push(wrapper)
        return wrapper
    }

    it('sends current formatted values and refreshes only when a max LOV parent changes', async () => {
        const unrelated = createParameter('OTHER', date(2))
        const wrapper = mount([parent, child, unrelated])
        await flushPromises()

        expect(post).toHaveBeenCalledOnce()
        expect(post.mock.calls[0][0]).toContain('/documentExeParameters/maxValue')
        expect(post.mock.calls[0][1]).toMatchObject({
            label: 'TEST_MAX_DATA',
            role: 'ROLE',
            paramId: 'DATA_A',
            parameters: expect.arrayContaining([{ urlName: 'DATA_DA', value: '01/01/2026', description: '01/01/2026' }])
        })
        expect(child.driverMaxDateValue).toEqual(date(31))
        expect(child.parameterValue[0].value).toEqual(date(10))

        unrelated.parameterValue[0].value = date(3)
        await (wrapper.vm as any).updateDependency(unrelated)
        expect(post).toHaveBeenCalledOnce()

        parent.parameterValue[0].value = date(15)
        post.mockResolvedValue({ data: { maxValue: '15/02/2026' } })
        await (wrapper.vm as any).updateDependency(parent)
        expect(post).toHaveBeenCalledTimes(2)
        expect(child.driverMaxDateValue).toEqual(date(15, 1))
    })

    it('handles the calendar Clear event and removes both previous maximum fields on null', async () => {
        const wrapper = mount([parent, child])
        await flushPromises()
        post.mockResolvedValue({ data: { maxValue: null } })
        parent.parameterValue[0].value = null
        wrapper.findAllComponents({ name: 'Calendar' })[0].vm.$emit('clear-click')
        await flushPromises()

        expect(post).toHaveBeenCalledTimes(2)
        expect(post.mock.calls[1][1].parameters[0].value).toBeNull()
        expect(child.driverMaxValue).toBeNull()
        expect(child.driverMaxDateValue).toBeNull()
        expect(storeMock.setError).not.toHaveBeenCalled()
    })

    it('refreshes after resetting the parent to its default', async () => {
        parent.driverDefaultValue = [{ value: '01/01/2026', desc: '01/01/2026#dd/MM/yyyy' }]
        const wrapper = mount([parent, child])
        await flushPromises()
        parent.parameterValue[0].value = date(15)
        await (wrapper.vm as any).updateDependency(parent)
        ;(wrapper.vm as any).resetParameterValue(parent)
        await flushPromises()

        expect(post).toHaveBeenCalledTimes(3)
        expect(post.mock.calls[2][1].parameters[0].value).toBe('01/01/2026')
    })

    it('deduplicates in-flight refreshes and discards a maximum for an outdated parent value', async () => {
        const first = deferredResponse()
        const latest = deferredResponse()
        post.mockReturnValueOnce(first.promise).mockReturnValueOnce(latest.promise)
        const wrapper = mount([parent, child])
        parent.parameterValue[0].value = date(20)
        const refresh = (wrapper.vm as any).refreshMaxValues()

        expect(post).toHaveBeenCalledOnce()
        first.resolve({ data: { maxValue: '15/01/2026' } })
        await flushPromises()
        expect(post).toHaveBeenCalledTimes(2)
        expect(child.driverMaxValue).toBe('31/12/2026')
        expect((wrapper.vm as any).buttonsDisabled).toBe(true)

        latest.resolve({ data: { maxValue: '20/02/2026' } })
        await refresh
        expect(child.driverMaxDateValue).toEqual(date(20, 1))
        expect((wrapper.vm as any).buttonsDisabled).toBe(false)
    })

    it('clears only an out-of-range child and updates its existing and maximum dependents', async () => {
        child.parameterValue[0].value = date(20)
        const grandchild = createParameter('AFTER_DATA_A', null, ['DATA_A'])
        post.mockResolvedValueOnce({ data: { maxValue: '15/01/2026' } }).mockResolvedValueOnce({ data: { maxValue: null } })
        mount([parent, child, grandchild])
        await flushPromises()

        expect(child.parameterValue[0].value).toBeNull()
        expect(storeMock.setInfo).toHaveBeenCalledOnce()
        expect(dataDependencyMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ urlName: 'DATA_A' }), expect.anything(), expect.anything(), 'ROLE', expect.anything(), 'execution', false, 'dd/MM/yyyy')
        expect(post.mock.calls[1][1].parameters.find((parameter: any) => parameter.urlName === 'DATA_A').value).toBeNull()
    })

    it('accepts a selected date on the maximum calendar day even when it contains a time', async () => {
        child.parameterValue[0].value = new Date(2026, 0, 31, 15, 30)
        mount([parent, child])
        await flushPromises()

        expect(child.parameterValue[0].value).toEqual(new Date(2026, 0, 31, 15, 30))
        expect(storeMock.setInfo).not.toHaveBeenCalled()
    })

    it('marks initial execution as not ready when a mandatory date is cleared', async () => {
        child.mandatory = true
        child.parameterValue[0].value = date(20, 1)
        const wrapper = mount([parent, child])
        await flushPromises()

        expect(child.parameterValue[0].value).toBeNull()
        expect((wrapper.props('filtersData') as any).isReadyForExecution).toBe(false)
        expect((wrapper.vm as any).buttonsDisabled).toBe(true)
    })

    it('also clears an out-of-range date represented as a formatted string after reset', async () => {
        child.parameterValue[0].value = '20/02/2026'
        mount([parent, child])
        await flushPromises()

        expect(child.parameterValue[0].value).toBeNull()
        expect(storeMock.setInfo).toHaveBeenCalledOnce()
    })

    it('detects an indirect parent changed by an existing data dependency', async () => {
        const indirect = createParameter('INDIRECT', date(2))
        child.dependencies.maxValue = ['INDIRECT']
        const wrapper = mount([parent, indirect, child])
        await flushPromises()
        dataDependencyMock.mockImplementationOnce(() => {
            indirect.parameterValue[0].value = date(12)
        })
        await (wrapper.vm as any).updateDependency(parent)

        expect(post).toHaveBeenCalledTimes(2)
        expect(post.mock.calls[1][1].parameters.find((parameter: any) => parameter.urlName === 'INDIRECT').value).toBe('12/01/2026')
        expect(lovDependencyMock).toHaveBeenCalled()
    })

    it.each(['qbeView', 'workspaceView', 'datasetManagement'])('does not use the execution endpoint in %s mode', async (mode) => {
        const wrapper = mount([parent, child], mode)
        await (wrapper.vm as any).refreshMaxValues()
        expect(post).not.toHaveBeenCalled()
    })

    it('does not refresh dates without max LOV dependencies, including fixed maxima', async () => {
        child.dependencies.maxValue = []
        const wrapper = mount([parent, child])
        await (wrapper.vm as any).updateDependency(parent)
        expect(post).not.toHaveBeenCalled()
    })

    it('blocks execution on errors and recovers after the parent changes', async () => {
        post.mockRejectedValueOnce(new Error('LOV failed'))
        const wrapper = mount([parent, child])
        await flushPromises()

        expect(child.driverMaxValue).toBe('31/12/2026')
        expect((wrapper.vm as any).buttonsDisabled).toBe(true)
        expect(storeMock.setError).toHaveBeenCalledOnce()

        parent.parameterValue[0].value = date(2)
        await (wrapper.vm as any).updateDependency(parent)
        expect(child.driverMaxDateValue).toEqual(date(31))
        expect((wrapper.vm as any).buttonsDisabled).toBe(false)
    })

    it('does not interpret a malformed response as removal of the bound', async () => {
        post.mockResolvedValueOnce({ data: {} })
        const wrapper = mount([parent, child])
        await flushPromises()

        expect(child.driverMaxValue).toBe('31/12/2026')
        expect((wrapper.vm as any).buttonsDisabled).toBe(true)
    })

    it('does not apply an obsolete response or query the old filters for a new document', async () => {
        const response = deferredResponse()
        post.mockReturnValueOnce(response.promise)
        const wrapper = mount([parent, child])
        await wrapper.setProps({ propDocument: { label: 'OTHER_DOCUMENT' } })
        response.resolve({ data: { maxValue: '15/01/2026' } })
        await flushPromises()

        expect(child.driverMaxValue).toBe('31/12/2026')
        expect(post).toHaveBeenCalledOnce()

        const nextParent = createParameter('NEXT_PARENT', date(2))
        const nextChild = createParameter('NEXT_CHILD', null, ['NEXT_PARENT'])
        await wrapper.setProps({ filtersData: { filterStatus: [nextParent, nextChild], isReadyForExecution: true } })
        await flushPromises()
        expect(post).toHaveBeenCalledTimes(2)
        expect(post.mock.calls[1][1]).toMatchObject({ label: 'OTHER_DOCUMENT', paramId: 'NEXT_CHILD' })
        expect(nextChild.driverMaxDateValue).toEqual(date(31))
    })

    it('waits for the saved-view maximum before emitting execution', async () => {
        const wrapper = mount([parent, child])
        await flushPromises()
        const response = deferredResponse()
        post.mockReturnValueOnce(response.promise)
        const execution = (wrapper.vm as any).executeViewpoint({ vpValueParams: 'DATA_DA%3D2026-01-15' })
        await flushPromises()
        expect(wrapper.emitted('execute')).toBeUndefined()
        expect(post.mock.calls[1][1].parameters[0].value).toBe('15/01/2026')

        response.resolve({ data: { maxValue: '15/02/2026' } })
        await execution
        expect(wrapper.emitted('execute')).toHaveLength(1)
        expect(child.driverMaxDateValue).toEqual(date(15, 1))
    })
})
