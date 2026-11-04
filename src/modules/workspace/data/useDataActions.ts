import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import mainStore from '@/App.store'
import { downloadDirectFromResponseWithCustomName } from '@/helpers/commons/fileHelper'
import { getCorrectRolesForExecution, getCorrectRolesForExecutionForType } from '@/helpers/commons/roleHelper'
import { WsDataRow } from '../Workspace'
import * as api from '../workspaceApi'
import { canCloneDataset } from '../workspaceHelpers'
import { WsAction } from '../common/WorkspaceActionMenu.vue'
import { canExportDataset, canLoadData, datasetIsIterable, formatDrivers, isOpenInQbeVisible } from './datasetHelpers'

// What the Data tab owns and the actions need: dialogs and overlays.
export interface WsDataUi {
    openPreview: (dataset: any, roles: string[]) => void
    openWizard: (dataset: any | null) => void
    openClone: (dataset: any) => void
    openQbe: (options: { dataset: any | null; sourceDataset: any | null }) => void
    openExportParameters: (dataset: any, filtersData: any, format: 'xls' | 'csv') => void
    reload: () => void
}

// The dataset menu of today (spec 8.2): same rules, B10 and B11 fixed (fixed order, real driver and parameter checks).
export function useDataActions(ui: WsDataUi) {
    const $q = useQuasar()
    const { t } = useI18n()
    const appStore = mainStore()

    const user = () => appStore.user
    const isOwner = (row: WsDataRow) => row.kind === 'DATASET' && user()?.userId === row.raw.owner
    const userRole = () => (user()?.sessionRole !== t('role.defaultRolePlaceholder') ? user()?.sessionRole : null)

    const canPreview = (row: WsDataRow) => row.kind === 'DATASET' && canLoadData(row.raw)
    const canOpenInQbe = (row: WsDataRow) => row.kind === 'MODEL' || isOpenInQbeVisible(row.raw)

    async function preview(row: WsDataRow) {
        try {
            const dataset = await api.getDatasetByLabel(row.raw.label)
            const roles = (await getCorrectRolesForExecution(null, row.raw)) as string[]
            if (dataset) dataset.drivers = row.raw.drivers
            ui.openPreview(dataset, roles)
        } catch {
            // the role helper and the interceptor show the error
        }
    }

    function openInQbe(row: WsDataRow) {
        if (row.kind === 'MODEL') {
            getCorrectRolesForExecutionForType('DATAMART', row.raw.id, row.raw.label)
                .then(() => ui.openQbe({ dataset: row.raw, sourceDataset: null }))
                .catch(() => {})
        } else ui.openQbe({ dataset: null, sourceDataset: row.raw })
    }

    async function prepareExport(row: WsDataRow, format: 'xls' | 'csv') {
        try {
            const dataset = await api.getDatasetByLabel(row.raw.label)
            let filtersData: any = {}
            if (dataset.label && dataset.id && dataset.dsTypeCd !== 'Prepared') {
                filtersData = await api.getDatasetFilters(dataset.label, userRole() || user().roles[0]).catch(() => ({}))
                if (filtersData.filterStatus) filtersData.filterStatus = filtersData.filterStatus.filter((filter: any) => filter.id)
                formatDrivers(filtersData)
            }
            if (dataset.pars.length > 0 || filtersData.filterStatus?.length > 0) ui.openExportParameters(dataset, filtersData, format)
            else await exportNow(dataset, format)
        } catch {
            // the interceptor shows the error
        }
    }

    // The export runs on the server; the file shows up in the Downloads of the main menu.
    async function exportNow(dataset: any, format: 'xls' | 'csv', body?: any) {
        await api.exportDataset(dataset.id, format, body)
        appStore.setInfo({ title: 'common.toast.updateTitle', msg: 'workspace.myData.exportSuccess' })
    }

    async function downloadFile(row: WsDataRow) {
        try {
            const dataset = await api.getDatasetByLabel(row.raw.label)
            const response = await api.downloadDatasetFile(dataset.label, dataset.fileType)
            if (response.data.errors) appStore.setError({ title: 'common.error.downloading', msg: 'common.error.downloading' })
            else {
                const fileName = response.headers['content-disposition'].split('fileName=')[1].split(';')[0]
                downloadDirectFromResponseWithCustomName(response, fileName)
                appStore.setInfo({ title: 'common.toast.success' })
            }
        } catch {
            // the interceptor shows the error
        }
    }

    async function clone(row: WsDataRow) {
        try {
            ui.openClone(await api.getDatasetByLabel(row.raw.label))
        } catch {
            // the interceptor shows the error
        }
    }

    function remove(row: WsDataRow, insideDrawer = false) {
        $q.dialog({ title: t('common.toast.deleteConfirmTitle'), message: t('common.toast.deleteMessage'), cancel: true, persistent: true, class: insideDrawer ? 'kn-ws-above-drawer' : undefined }).onOk(async () => {
            try {
                await api.deleteDataset(row.raw.label)
                appStore.setInfo({ title: 'common.toast.deleteTitle', msg: 'common.toast.success' })
                ui.reload()
            } catch {
                // the interceptor shows the error
            }
        })
    }

    function edit(row: WsDataRow) {
        const ds = row.raw
        if (ds.dsTypeCd == 'File') ui.openWizard(ds)
        else if (ds.dsTypeCd == 'Qbe') ui.openQbe({ dataset: ds, sourceDataset: null })
        else if (ds.dsTypeCd == 'Derived') ui.openQbe({ dataset: null, sourceDataset: ds })
    }

    // Fixed order (B11). Federated datasets lose the QBE edit (federations are removed, spec 8.1).
    function menu(row: WsDataRow, options: { insideDrawer?: boolean; withPrimary?: boolean } = {}): WsAction[] {
        const actions: WsAction[] = []
        if (options.withPrimary) {
            if (canPreview(row)) actions.push({ id: 'preview', icon: 'sym_o_visibility', labelKey: 'common.preview', run: () => preview(row) })
            if (canOpenInQbe(row)) actions.push({ id: 'qbe', icon: 'sym_o_manage_search', labelKey: 'workspace.openInQbe', run: () => openInQbe(row) })
        }
        if (row.kind === 'MODEL') return actions
        const ds = row.raw
        const editable = (isOwner(row) && (ds.dsTypeCd == 'File' || ds.dsTypeCd == 'Qbe')) || ds.dsTypeCd == 'Derived'
        if (editable) actions.push({ id: 'edit', icon: 'sym_o_edit', labelKey: 'workspace.myModels.editDataset', run: () => edit(row) })
        if (canExportDataset(ds) && datasetIsIterable(ds)) actions.push({ id: 'xlsx', icon: 'sym_o_grid_on', labelKey: 'workspace.exportXlsx', run: () => prepareExport(row, 'xls') })
        if (canExportDataset(ds)) actions.push({ id: 'csv', icon: 'sym_o_description', labelKey: 'workspace.exportCsv', run: () => prepareExport(row, 'csv') })
        if (ds.dsTypeCd == 'File') actions.push({ id: 'download', icon: 'sym_o_download', labelKey: 'workspace.downloadFile', run: () => downloadFile(row) })
        if (canLoadData(ds) && canCloneDataset(user())) actions.push({ id: 'clone', icon: 'sym_o_content_copy', labelKey: 'common.clone', run: () => clone(row) })
        if (isOwner(row)) actions.push({ id: 'delete', icon: 'sym_o_delete', labelKey: 'workspace.delete', run: () => remove(row, options.insideDrawer) })
        return actions
    }

    return { canPreview, canOpenInQbe, preview, openInQbe, menu, exportNow }
}
