import { beforeEach, describe, expect, it, vi } from 'vitest'
import { invalidateAssociativeSelections, loadAssociativeSelections } from '../InteractionHelper'

const { dashboards, emit, setAssociations } = vi.hoisted(() => ({
    dashboards: {} as Record<string, any>,
    emit: vi.fn(),
    setAssociations: vi.fn()
}))

vi.mock('../../../DashboardHelpers', () => ({ emitter: { emit } }))
vi.mock('../../../Dashboard.store', () => ({
    default: () => ({
        getDashboard: (id: string) => dashboards[id],
        getDashboardsList: () => dashboards,
        getSelections: (id: string) => dashboards[id]?.selections ?? [],
        setAssociations: (id: string, associations: any) => {
            dashboards[id].associations = associations
            setAssociations(id, associations)
        }
    })
}))
vi.mock('../../../helpers/datasetRefresh/DatasetRefreshHelpers', () => ({ clearDatasetInterval: vi.fn() }))

const deferred = () => {
    let resolve!: (value: any) => void
    const promise = new Promise<any>((resolvePromise) => (resolve = resolvePromise))
    return { promise, resolve }
}

const createDashboard = (id = 'dashboard') => {
    const model = {
        configuration: {
            id,
            datasets: [{ id: 1, dsLabel: 'sales' }],
            associations: [{ id: 'association', fields: [{ dataset: 1, column: 'CODE' }] }]
        },
        widgets: [],
        selections: [{ datasetId: 1, datasetLabel: 'sales', columnName: 'CODE', value: ['A'] }],
        associations: {}
    } as any
    dashboards[id] = model
    return model
}

const datasets = [{ id: { dsId: 1 }, label: 'sales' }] as any

describe('associative selection request ordering', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        Object.keys(dashboards).forEach((id) => delete dashboards[id])
    })

    it('applies and notifies only the newest response and keeps loading until overlapping requests finish', async () => {
        const model = createDashboard()
        const older = deferred()
        const newer = deferred()
        const http = { post: vi.fn().mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise) }
        const first = loadAssociativeSelections('dashboard', model, datasets, model.selections, http)
        model.selections[0].value[0] = 'B'
        const second = loadAssociativeSelections('dashboard', model, datasets, model.selections, http)
        const latestAssociations = { sales: { CODE: ["('B')"] } }

        expect(http.post.mock.calls[0][1].selections).toEqual({ 'sales.CODE': ['A'] })
        newer.resolve({ data: latestAssociations })
        await second

        expect(model.associations).toEqual(latestAssociations)
        expect(emit).toHaveBeenCalledWith('selectionsChanged', { dashboardId: 'dashboard', selections: model.selections })
        expect(emit).not.toHaveBeenCalledWith('setWidgetLoading', false)

        older.resolve({ data: { sales: { CODE: ["('A')"] } } })
        await first

        expect(setAssociations).toHaveBeenCalledOnce()
        expect(model.associations).toEqual(latestAssociations)
        expect(emit.mock.calls.filter(([event]) => event === 'selectionsChanged')).toHaveLength(1)
        expect(emit.mock.calls.filter(([event, value]) => event === 'setWidgetLoading' && value === false)).toHaveLength(1)
    })

    it('does not restore associations after selections have been cleared', async () => {
        const model = createDashboard()
        const response = deferred()
        const http = { post: vi.fn().mockReturnValue(response.promise) }
        const pending = loadAssociativeSelections('dashboard', model, datasets, model.selections, http)

        invalidateAssociativeSelections(model)
        model.selections = []
        response.resolve({ data: { sales: { CODE: ["('A')"] } } })
        await pending

        expect(model.associations).toEqual({})
        expect(setAssociations).not.toHaveBeenCalled()
        expect(emit.mock.calls.filter(([event]) => event === 'selectionsChanged')).toHaveLength(0)
    })

    it('keeps requests for different dashboards independent', async () => {
        const firstModel = createDashboard('first')
        const secondModel = createDashboard('second')
        const firstResponse = deferred()
        const secondResponse = deferred()
        const http = { post: vi.fn().mockReturnValueOnce(firstResponse.promise).mockReturnValueOnce(secondResponse.promise) }
        const first = loadAssociativeSelections('first', firstModel, datasets, firstModel.selections, http)
        const second = loadAssociativeSelections('second', secondModel, datasets, secondModel.selections, http)

        secondResponse.resolve({ data: { sales: { CODE: ["('B')"] } } })
        firstResponse.resolve({ data: { sales: { CODE: ["('A')"] } } })
        await Promise.all([first, second])

        expect(setAssociations).toHaveBeenCalledTimes(2)
        expect(emit).toHaveBeenCalledWith('selectionsChanged', { dashboardId: 'first', selections: firstModel.selections })
        expect(emit).toHaveBeenCalledWith('selectionsChanged', { dashboardId: 'second', selections: secondModel.selections })
    })
})
