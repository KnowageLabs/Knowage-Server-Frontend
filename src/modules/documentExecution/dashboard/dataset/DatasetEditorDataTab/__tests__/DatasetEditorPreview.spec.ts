import { describe, expect, it, vi } from 'vitest'
import DatasetEditorPreview from '../DatasetEditorPreview.vue'

vi.mock('@/modules/workspace/views/dataView/tables/DatasetPreviewTable.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/modules/documentExecution/dashboard/DashboardHelpers', () => ({ DATASET_EXPORT_FORMATS: ['csv', 'xls'] }))

describe('Dataset Preview exports', () => {
    it.each(['csv', 'xls'])('uses current dynamic values for repeated %s exports without altering preview parameters', async (format) => {
        const controller = {
            dashboardId: 'dashboard',
            dashboards: { dashboard: { drivers: [{ urlName: 'year', value: '2026' }], configuration: { variables: [] } } },
            variables: [{ name: 'region', value: 'EMEA' }],
            exportFileName: 'Sales $P{year} $V{region}',
            dataset: { id: 12 },
            postData: { pars: [{ name: 'country', value: 'IT' }], drivers: { country: [{ value: 'IT' }] } },
            loading: false,
            $http: { post: vi.fn().mockResolvedValue({ data: 'export-job' }) },
            $t: (key: string) => key,
            setInfo: vi.fn(),
            setError: vi.fn()
        }
        const exportDataset = DatasetEditorPreview.methods!.exportDataset.bind(controller)

        await exportDataset(format)
        controller.variables[0].value = 'APAC'
        await exportDataset(format)

        expect(controller.$http.post.mock.calls[0][0]).toContain(`/2.0/export/dataset/12/${format}`)
        expect(controller.$http.post.mock.calls[0][1].fileName).toBe('Sales 2026 EMEA')
        expect(controller.$http.post.mock.calls[1][1].fileName).toBe('Sales 2026 APAC')
        expect(controller.$http.post.mock.calls[1][1].parameters).toEqual([{ name: 'country', value: 'IT' }])
        expect(controller.postData.pars).toEqual([{ name: 'country', value: 'IT' }])
        expect(controller.postData).not.toHaveProperty('parameters')
        expect(controller.setError).not.toHaveBeenCalled()
    })
})
