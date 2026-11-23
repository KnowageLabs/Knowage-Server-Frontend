// @vitest-environment jsdom
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
import { applyRecalculatedDefaultValues, getDefaultValueDependencyOrder } from './KnParameterSidebarDefaultValuesDependency'

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

describe('dependent driver defaults', () => {
    const wrappers: any[] = []
    let parent: iParameter
    let child: iParameter
    let post: ReturnType<typeof vi.fn>

    const yearParameter = (urlName: string, value: number, dependencies: string[] = []) =>
        ({
            ...createParameter(urlName, null),
            type: 'NUM',
            parameterValue: [{ value, description: '' + value }],
            driverDefaultValue: [{ value, desc: '' + value, _col0: value, _col1: '' + value }],
            dependencies: { data: [], visual: [], lov: [], defaultValue: dependencies },
            metadata: { colsMap: { _col0: 'CODE', _col1: 'DESCRIPTION' }, valueColumn: 'CODE', descriptionColumn: 'DESCRIPTION' }
        }) as iParameter

    const mount = (parameters: iParameter[], mode = 'execution') => {
        const wrapper = shallowMount(KnParameterSidebar, {
            props: {
                filtersData: { filterStatus: parameters, isReadyForExecution: true },
                propDocument: { label: 'Anno_default' },
                userRole: 'ROLE',
                propMode: mode,
                dateFormat: 'dd/MM/yyyy'
            },
            global: {
                mocks: { $http: { post }, $t: (key: string) => key },
                directives: { tooltip: () => { } },
                stubs: { Button: true, InputText: true }
            }
        })
        wrappers.push(wrapper)
        return wrapper
    }

    beforeEach(() => {
        vi.clearAllMocks()
        dataDependencyMock.mockReset()
        lovDependencyMock.mockReset()
        parent = yearParameter('year', 2026)
        child = yearParameter('comparison_year', 2025, ['year'])
        post = vi.fn().mockImplementation((_url, body) => {
            const source = body.parameters.find((parameter: any) => parameter.urlName === 'year')
            return Promise.resolve({ data: { defaultValues: [{ value: Number(source.value) - 1, description: '' + (Number(source.value) - 1) }] } })
        })
    })

    afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

    it('recalculates the comparison year on input changes, including returning to the initial year', async () => {
        const wrapper = mount([parent, child])
        await flushPromises()
        expect(post).not.toHaveBeenCalled()

        parent.parameterValue[0].value = 2025
        wrapper.find('[data-test="parameter-input-year"]').trigger('blur')
        await flushPromises()

        expect(post).toHaveBeenCalledOnce()
        expect(post.mock.calls[0][0]).toContain('/documentExeParameters/defaultValues')
        expect(post.mock.calls[0][1]).toMatchObject({
            label: 'Anno_default',
            role: 'ROLE',
            paramId: 'comparison_year',
            parameters: expect.arrayContaining([expect.objectContaining({ urlName: 'year', value: 2025 })])
        })
        expect(child.parameterValue).toEqual([{ value: 2024, description: '2024' }])
        expect(child.driverDefaultValue[0]).toMatchObject({ value: 2024, desc: '2024', _col0: 2024, _col1: '2024' })
        expect(dataDependencyMock.mock.calls.some((call) => call[1].urlName === 'comparison_year')).toBe(true)
        expect(wrapper.emitted('parametersChanged')?.at(-1)?.[0].parameters.filterStatus[1].parameterValue[0].value).toBe(2024)

        parent.parameterValue[0].value = 2026
        wrapper.find('[data-test="parameter-input-year"]').trigger('blur')
        await flushPromises()
        expect(post).toHaveBeenCalledTimes(2)
        expect(child.parameterValue[0].value).toBe(2025)
        expect((wrapper.vm as any).buttonsDisabled).toBe(false)
    })

    it('preserves a user-selected comparison year when an unrelated driver changes', async () => {
        const unrelated = yearParameter('other', 2000)
        const wrapper = mount([parent, child, unrelated])
        child.parameterValue[0].value = 2020
        await (wrapper.vm as any).updateDependency(child)
        unrelated.parameterValue[0].value = 2001
        await (wrapper.vm as any).updateDependency(unrelated)
        expect(post).not.toHaveBeenCalled()
        expect(child.parameterValue[0].value).toBe(2020)
    })

    it('does not recalculate fixed defaults or drivers without dependency metadata', async () => {
        delete child.dependencies.defaultValue
        const wrapper = mount([parent, child])
        parent.parameterValue[0].value = 2025
        await (wrapper.vm as any).updateDependency(parent)
        expect(post).not.toHaveBeenCalled()
        expect(child.parameterValue[0].value).toBe(2025)
    })

    it('recalculates chained defaults in parent-first order even when filters are reversed', async () => {
        const grandchild = yearParameter('previous_comparison_year', 2024, ['comparison_year'])
        post.mockImplementation((_url, body) => {
            const sourceName = body.paramId === 'comparison_year' ? 'year' : 'comparison_year'
            const value = Number(body.parameters.find((parameter: any) => parameter.urlName === sourceName).value) - 1
            return Promise.resolve({ data: { defaultValues: [{ value, description: '' + value }] } })
        })
        const wrapper = mount([grandchild, child, parent])
        parent.parameterValue[0].value = 2025
        await (wrapper.vm as any).updateDependency(parent)
        expect(post.mock.calls.map((call) => call[1].paramId)).toEqual(['comparison_year', 'previous_comparison_year'])
        expect(child.parameterValue[0].value).toBe(2024)
        expect(grandchild.parameterValue[0].value).toBe(2023)
    })

    it.each(['resolve', 'reject'] as const)('deduplicates requests and ignores an obsolete %s while the year changes again', async (settle) => {
        const first = deferredResponse()
        const latest = deferredResponse()
        post.mockReturnValueOnce(first.promise).mockReturnValueOnce(latest.promise)
        const wrapper = mount([parent, child])
        parent.parameterValue[0].value = 2025
        const firstUpdate = (wrapper.vm as any).updateDependency(parent)
        await flushPromises()
        parent.parameterValue[0].value = 2024
        const secondUpdate = (wrapper.vm as any).updateDependency(parent)
        await flushPromises()
        expect(post).toHaveBeenCalledOnce()
        expect((wrapper.vm as any).buttonsDisabled).toBe(true)

        if (settle === 'resolve') first.resolve({ data: { defaultValues: [{ value: 2024, description: 'obsolete' }] } })
        else first.reject(new Error('Obsolete request failed'))
        await flushPromises()
        expect(child.parameterValue[0].value).toBe(2025)
        expect(post).toHaveBeenCalledTimes(2)
        expect(post.mock.calls[1][1].parameters[0].value).toBe(2024)
        expect((wrapper.vm as any).buttonsDisabled).toBe(true)

        latest.resolve({ data: { defaultValues: [{ value: 2023, description: '2023' }] } })
        await Promise.all([firstUpdate, secondUpdate])
        expect(child.parameterValue[0].value).toBe(2023)
        expect(storeMock.setError).not.toHaveBeenCalled()
        expect((wrapper.vm as any).buttonsDisabled).toBe(false)
    })

    it('clears both the selection and cached default when the LOV returns no default', async () => {
        child.mandatory = true
        post.mockResolvedValueOnce({ data: { defaultValues: [] } })
        const wrapper = mount([parent, child])
        parent.parameterValue[0].value = ''
        await (wrapper.vm as any).updateDependency(parent)
        expect(child.parameterValue).toEqual([{ value: '', description: '' }])
        expect(child.driverDefaultValue).toEqual([])
        expect((wrapper.vm as any).buttonsDisabled).toBe(true)
        expect(() => (wrapper.vm as any).resetParameterValue(child)).not.toThrow()
        await flushPromises()
        expect(child.parameterValue[0].value).toBe('')
    })

    it('uses the recalculated default for multivalue list checkboxes, including zero', async () => {
        child.selectionType = 'LIST'
        child.multivalue = true
        child.data = []
        post.mockResolvedValueOnce({ data: { defaultValues: [{ value: 0, description: 'Zero' }, { value: 2024, description: '2024' }] } })
        const wrapper = mount([parent, child])
        parent.parameterValue[0].value = 2025
        await (wrapper.vm as any).updateDependency(parent)
        expect(child.parameterValue).toEqual([{ value: 0, description: 'Zero' }, { value: 2024, description: '2024' }])
        expect((wrapper.vm as any).selectedParameterCheckbox[child.id]).toEqual([0, 2024])
            ; (wrapper.vm as any).resetParameterValue(child)
        expect(child.parameterValue).toEqual([{ value: 0, description: 'Zero' }, { value: 2024, description: '2024' }])
        await flushPromises()
    })

    it.each(['resetParameterValue', 'onTreeSave'])('refreshes default dependencies after %s', async (method) => {
        const wrapper = mount([parent, child])
        parent.parameterValue[0].value = 2025
        await (wrapper.vm as any).updateDependency(parent)
        parent.parameterValue[0].value = 2026
            ; (wrapper.vm as any)[method](parent)
        await flushPromises()
        expect(post).toHaveBeenCalledTimes(2)
        expect(child.parameterValue[0].value).toBe(2025)
        parent.parameterValue[0].value = 2025
            ; (wrapper.vm as any).onInputTextChanged(parent)
        await flushPromises()
        expect(child.parameterValue[0].value).toBe(2024)
    })

    it('preserves explicitly saved values until a default parent is changed again', async () => {
        const unrelated = yearParameter('other', 2000)
        const wrapper = mount([parent, child, unrelated])
        await (wrapper.vm as any).fillParameterForm({ vpValueParams: 'year%3D2024%26comparison_year%3D2020' })
        unrelated.parameterValue[0].value = 2001
        await (wrapper.vm as any).updateDependency(unrelated)
        expect(child.parameterValue[0].value).toBe('2020')
        expect(post).not.toHaveBeenCalled()
        parent.parameterValue[0].value = 2026
            ; (wrapper.vm as any).onInputTextChanged(parent)
        await flushPromises()
        expect(child.parameterValue[0].value).toBe(2025)
    })

    it('blocks execution after a failed recalculation and recovers on the next change', async () => {
        post.mockRejectedValueOnce(new Error('Default LOV failed'))
        const wrapper = mount([parent, child])
        parent.parameterValue[0].value = 2025
        await (wrapper.vm as any).updateDependency(parent)
        expect((wrapper.vm as any).buttonsDisabled).toBe(true)
        expect(storeMock.setError).toHaveBeenCalledOnce()
        parent.parameterValue[0].value = 2024
        await (wrapper.vm as any).updateDependency(parent)
        expect(child.parameterValue[0].value).toBe(2023)
        expect((wrapper.vm as any).buttonsDisabled).toBe(false)
    })

    it('blocks execution rather than interpreting a malformed response as an empty default', async () => {
        post.mockResolvedValueOnce({ data: {} })
        const wrapper = mount([parent, child])
        parent.parameterValue[0].value = 2025
        await (wrapper.vm as any).updateDependency(parent)
        expect(child.parameterValue[0].value).toBe(2025)
        expect((wrapper.vm as any).buttonsDisabled).toBe(true)
        expect(storeMock.setError).toHaveBeenCalledOnce()
    })

    it('ignores a response belonging to the previous document', async () => {
        const response = deferredResponse()
        post.mockReturnValueOnce(response.promise)
        const wrapper = mount([parent, child])
        parent.parameterValue[0].value = 2025
        const update = (wrapper.vm as any).updateDependency(parent)
        await flushPromises()
        await wrapper.setProps({ propDocument: { label: 'OTHER_DOCUMENT' } })
        response.resolve({ data: { defaultValues: [{ value: 2024, description: 'obsolete' }] } })
        await update
        expect(child.parameterValue[0].value).toBe(2025)
        expect(post).toHaveBeenCalledOnce()
    })

    it.each(['qbeView', 'workspaceView', 'datasetManagement'])('does not use the execution endpoint in %s mode', async (mode) => {
        const wrapper = mount([parent, child], mode)
        parent.parameterValue[0].value = 2025
        await (wrapper.vm as any).updateDependency(parent)
        expect(post).not.toHaveBeenCalled()
    })

    it('rejects cyclic default dependencies instead of repeatedly recalculating them', () => {
        parent.dependencies.defaultValue = ['comparison_year']
        expect(() => getDefaultValueDependencyOrder([parent, child])).toThrow('Cyclic default value dependencies')
    })

    it('formats a recalculated manual date and its reset value with the server date format', async () => {
        const parameter = createParameter('reference_date', null)
        applyRecalculatedDefaultValues(parameter, [{ value: '12/01/2026#dd/MM/yyyy', description: 'Reference date' }], 'dd/MM/yyyy')
        expect(parameter.parameterValue[0].value).toEqual(date(12))
        const wrapper = mount([parameter])
            ; (wrapper.vm as any).resetParameterValue(parameter)
        expect(parameter.parameterValue[0].value).toEqual(date(12))
        await flushPromises()
    })
})

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
