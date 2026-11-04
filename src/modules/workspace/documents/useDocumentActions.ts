import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import mainStore from '@/App.store'
import { canManageDocument } from '@/helpers/commons/documentPermissionsHelper'
import useWorkspaceStore from '../workspace.store'
import { WsDocumentRow } from '../Workspace'
import { canUseCollections, getExecutionRoute, isFavoriteRow, isOnlyLinked } from '../workspaceHelpers'

export interface WsDocumentAction {
    id: string
    icon: string
    labelKey: string
    run: () => void
    // rendered as a sub-menu (the collection picker) instead of a plain item
    submenu?: 'collections'
}

// What the Documents tab owns and the actions need: dialogs and the file input.
export interface WsDocumentUi {
    openEditDetails: (row: WsDocumentRow) => void
    openRenameView: (row: WsDocumentRow) => void
    openDossierDesigner: (row: WsDocumentRow | null) => void
    pickPreviewImage: (row: WsDocumentRow) => void
}

const DESIGNER_TYPES = ['KPI', 'MAP', 'DOSSIER']

export function useDocumentActions(ui: WsDocumentUi) {
    const $q = useQuasar()
    const { t } = useI18n()
    const router = useRouter()
    const appStore = mainStore()
    const store = useWorkspaceStore()

    const user = () => appStore.user
    const canManage = (row: WsDocumentRow) => row.kind === 'DOCUMENT' && canManageDocument(user(), row)
    const hasDesigner = (row: WsDocumentRow) => canManage(row) && DESIGNER_TYPES.includes(row.typeCode)

    // Confirmations opened from the drawer must show above it (hand-off section 6.6).
    const confirm = (options: { title: string; message: string; insideDrawer?: boolean }, onOk: () => void) => $q.dialog({ title: options.title, message: options.message, cancel: true, persistent: true, class: options.insideDrawer ? 'kn-ws-above-drawer' : undefined }).onOk(onOk)

    const done = (titleKey: string) => appStore.setInfo({ title: titleKey, msg: 'common.toast.success' })

    // B9: a row without a label shows an error instead of doing nothing.
    function run(row: WsDocumentRow) {
        const route = getExecutionRoute(row)
        if (!route) {
            appStore.setError({ title: 'common.error.generic', msg: 'workspace.noLabelError' })
            return
        }
        router.push(route)
    }

    async function toggleFavorite(row: WsDocumentRow) {
        try {
            if (isFavoriteRow(row, store.favoritesFolderId)) await store.unstar(row)
            else await store.star(row)
        } catch {
            // the axios interceptor shows the error
        }
    }

    function openDesigner(row: WsDocumentRow) {
        if (row.typeCode === 'KPI') router.push(`/kpi-edit/${row.biObjectId}?from=Workspace`)
        else if (row.typeCode === 'MAP') router.push(`/gis/edit?documentId=${row.biObjectId}`)
        else if (row.typeCode === 'DOSSIER') ui.openDossierDesigner(row)
    }

    function cloneDocument(row: WsDocumentRow, insideDrawer = false) {
        confirm({ title: t('common.toast.cloneConfirmTitle'), message: row.name, insideDrawer }, async () => {
            try {
                await store.cloneDocument(row)
                done('common.toast.createTitle')
            } catch {
                // the axios interceptor shows the error
            }
        })
    }

    function deleteRow(row: WsDocumentRow, insideDrawer = false, onDeleted?: () => void) {
        confirm({ title: t('common.toast.deleteConfirmTitle'), message: t('common.toast.deleteMessage'), insideDrawer }, async () => {
            try {
                if (row.kind === 'VIEW') await store.deleteView(row)
                else await store.deleteDocument(row)
                done('common.toast.deleteTitle')
                onDeleted?.()
            } catch {
                // the axios interceptor shows the error
            }
        })
    }

    function removeFromWorkspace(row: WsDocumentRow, insideDrawer = false, onRemoved?: () => void) {
        confirm({ title: t('workspace.removeFromWorkspace'), message: t('workspace.removeFromWorkspaceMessage', { name: row.name }), insideDrawer }, async () => {
            try {
                await store.removeFromWorkspace(row)
                done('common.toast.updateTitle')
                onRemoved?.()
            } catch {
                // the axios interceptor shows the error
            }
        })
    }

    // The row menu of spec 7.2. A hidden action is not in the list (no disabled placeholders).
    function rowActions(row: WsDocumentRow, options: { insideDrawer?: boolean; onRemoved?: () => void; withRun?: boolean } = {}): WsDocumentAction[] {
        const isView = row.kind === 'VIEW'
        const collections = canUseCollections(user())
        const actions: WsDocumentAction[] = []
        if (options.withRun !== false) actions.push({ id: 'run', icon: 'sym_o_play_arrow', labelKey: 'common.run', run: () => run(row) })
        if (!isView && collections) {
            const fav = isFavoriteRow(row, store.favoritesFolderId)
            actions.push({ id: 'favorite', icon: fav ? 'star' : 'sym_o_star', labelKey: fav ? 'workspace.removeFromFavorites' : 'workspace.addToFavorites', run: () => toggleFavorite(row) })
        }
        if (collections) actions.push({ id: 'collection', icon: isView ? 'sym_o_drive_file_move' : 'sym_o_create_new_folder', labelKey: isView ? 'workspace.moveToCollection' : 'workspace.addToCollection', run: () => {}, submenu: 'collections' })
        if (isView) actions.push({ id: 'rename', icon: 'sym_o_edit', labelKey: 'workspace.renameView', run: () => ui.openRenameView(row) })
        else if (canManage(row)) actions.push({ id: 'edit', icon: 'sym_o_edit', labelKey: 'workspace.editDetails', run: () => ui.openEditDetails(row) })
        if (hasDesigner(row)) actions.push({ id: 'designer', icon: 'sym_o_design_services', labelKey: 'workspace.openDesigner', run: () => openDesigner(row) })
        if (canManage(row) && row.typeCode !== 'DOSSIER') actions.push({ id: 'clone', icon: 'sym_o_content_copy', labelKey: 'common.clone', run: () => cloneDocument(row, options.insideDrawer) })
        if (canManage(row)) actions.push({ id: 'preview', icon: 'sym_o_image', labelKey: 'workspace.uploadPreview', run: () => ui.pickPreviewImage(row) })
        if (isOnlyLinked(row) && collections) actions.push({ id: 'remove', icon: 'sym_o_remove_circle_outline', labelKey: 'workspace.removeFromWorkspace', run: () => removeFromWorkspace(row, options.insideDrawer, options.onRemoved) })
        if (isView || canManage(row)) actions.push({ id: 'delete', icon: 'sym_o_delete', labelKey: 'workspace.delete', run: () => deleteRow(row, options.insideDrawer, options.onRemoved) })
        return actions
    }

    return { run, toggleFavorite, openDesigner, hasDesigner, canManage, rowActions }
}
