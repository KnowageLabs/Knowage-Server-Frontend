<template>
    <q-card flat class="doc-sidebar-card column no-wrap full-height">
        <!-- Sticky header: name + close -->
        <div class="doc-sidebar-sticky-header row items-center no-wrap q-px-md q-py-sm">
            <div class="col text-h6 text-weight-bold" style="line-height: 1.3">{{ document?.name }}</div>
            <q-btn flat round dense icon="close" size="sm" class="q-ml-xs" @click="$emit('closePanel')" />
        </div>

        <q-scroll-area class="col">
            <!-- Preview image -->
            <div v-if="selectedDocument?.previewFile && previewImage" class="doc-sidebar-preview">
                <img :src="previewImage" class="doc-sidebar-img" />
            </div>
            <div v-else class="doc-sidebar-no-preview row items-center justify-center bg-grey-2">
                <q-icon :name="getTypeIcon(document?.typeCode)" size="4em" color="grey-4" />
            </div>

            <q-separator />

            <!-- Actions -->
            <!-- <div class="q-pa-md q-pb-sm">
                <div class="row q-gutter-sm q-mb-sm">
                    <q-btn v-if="user?.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_USER_MANAGEMENT)" dense unelevated color="primary" icon="play_arrow" :label="$t('documentBrowser.executeDocument')" class="col" data-test="execution" @click="executeDocument" />
                    <q-btn v-if="canEditDocument" unelevated outline dense color="grey-8" icon="edit" :label="$t('documentBrowser.editDocument')" class="col" @click="$emit('showDocumentDetails', document)" />
                </div>
                <div class="row justify-between">
                    <q-btn v-if="canEditDocument && document?.typeCode !== 'DOSSIER'" flat dense icon="file_copy" color="grey-7" @click="cloneDocumentConfirm">
                        <q-tooltip>{{ $t('documentBrowser.cloneDocument') }}</q-tooltip>
                    </q-btn>
                    <q-btn v-if="user?.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_MOVE_UP_STATE) && document?.stateCode === 'TEST'" flat dense icon="arrow_upward" color="grey-7" @click="changeStateDocumentConfirm('UP')">
                        <q-tooltip>{{ $t('documentBrowser.moveUpDocumentState') }}</q-tooltip>
                    </q-btn>
                    <q-btn v-if="user?.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_MOVE_DOWN_STATE) && (document?.stateCode === 'TEST' || document?.stateCode === 'REL')" flat dense icon="arrow_downward" color="grey-7" @click="changeStateDocumentConfirm('DOWN')">
                        <q-tooltip>{{ $t('documentBrowser.moveDownDocumentState') }}</q-tooltip>
                    </q-btn>
                    <q-btn v-if="canEditDocument && user?.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_DELETE_MANAGEMENT)" flat dense icon="delete" color="negative" @click="deleteDocumentConfirm">
                        <q-tooltip>{{ $t('common.delete') }}</q-tooltip>
                    </q-btn>
                </div>
            </div> -->
            <div class="row q-gutter-sm q-pa-sm justify-between">
                <q-btn v-if="user?.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_USER_MANAGEMENT)" dense unelevated color="primary" icon="play_arrow" @click="executeDocument">
                    <q-tooltip>{{ $t('documentBrowser.executeDocument') }}</q-tooltip>
                </q-btn>

                <q-btn v-if="canEditDocument" dense outline unelevated icon="edit" @click="$emit('showDocumentDetails', document)">
                    <q-tooltip>{{ $t('documentBrowser.editDocument') }}</q-tooltip>
                </q-btn>

                <q-btn v-if="canEditDocument && document?.typeCode !== 'DOSSIER'" flat dense icon="file_copy" @click="cloneDocumentConfirm">
                    <q-tooltip>{{ $t('documentBrowser.cloneDocument') }}</q-tooltip>
                </q-btn>

                <q-btn v-if="user?.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_MOVE_UP_STATE) && document?.stateCode === 'TEST'" flat dense icon="arrow_upward" @click="changeStateDocumentConfirm('UP')">
                    <q-tooltip>{{ $t('documentBrowser.moveUpDocumentState') }}</q-tooltip>
                </q-btn>

                <q-btn v-if="user?.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_MOVE_DOWN_STATE) && (document?.stateCode === 'TEST' || document?.stateCode === 'REL')" flat dense icon="arrow_downward" @click="changeStateDocumentConfirm('DOWN')">
                    <q-tooltip>{{ $t('documentBrowser.moveDownDocumentState') }}</q-tooltip>
                </q-btn>

                <q-btn v-if="canEditDocument && user?.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_DELETE_MANAGEMENT)" flat dense icon="delete" @click="deleteDocumentConfirm">
                    <q-tooltip>{{ $t('common.delete') }}</q-tooltip>
                </q-btn>
            </div>

            <q-separator />

            <!-- Details -->
            <div class="q-pa-md">
                <div class="doc-section-title q-mb-md">{{ $t('common.details').toUpperCase() }}</div>
                <div class="doc-details-card">
                    <div v-if="document?.typeCode" class="doc-detail-row">
                        <span class="doc-detail-label">{{ $t('common.type') }}</span>
                        <span class="doc-detail-value"
                            >{{ document.typeCode }}<q-tooltip>{{ document.typeCode }}</q-tooltip></span
                        >
                    </div>
                    <div v-if="document?.stateCode" class="doc-detail-row">
                        <span class="doc-detail-label">{{ $t('common.status') }}</span>
                        <span class="doc-detail-value"
                            >{{ document.stateCodeStr || document.stateCode }}<q-tooltip>{{ document.stateCodeStr || document.stateCode }}</q-tooltip></span
                        >
                    </div>
                    <div v-if="document?.label" class="doc-detail-row">
                        <span class="doc-detail-label">{{ $t('common.label') }}</span>
                        <span class="doc-detail-value"
                            >{{ document.label }}<q-tooltip>{{ document.label }}</q-tooltip></span
                        >
                    </div>
                    <div v-if="document?.creationUser" class="doc-detail-row">
                        <span class="doc-detail-label">{{ $t('common.author') }}</span>
                        <span class="doc-detail-value"
                            >{{ document.creationUser }}<q-tooltip>{{ document.creationUser }}</q-tooltip></span
                        >
                    </div>
                    <div v-if="document?.creationDate" class="doc-detail-row">
                        <span class="doc-detail-label">{{ $t('common.creationDate') }}</span>
                        <span class="doc-detail-value"
                            >{{ getFormatedDate(document.creationDate) }}<q-tooltip>{{ getFormatedDate(document.creationDate) }}</q-tooltip></span
                        >
                    </div>
                    <div v-if="document?.visible !== undefined" class="doc-detail-row">
                        <span class="doc-detail-label">{{ $t('common.visibility') }}</span>
                        <span class="doc-detail-value" :class="document.visible ? 'text-positive' : 'text-grey-6'">
                            <q-icon :name="document.visible ? 'visibility' : 'visibility_off'" size="xs" class="q-mr-xs" />
                            {{ document.visible ? $t('common.visible') : $t('common.notVisible') }}
                            <q-tooltip>{{ document.visible ? $t('common.visible') : $t('common.notVisible') }}</q-tooltip>
                        </span>
                    </div>
                </div>
            </div>

            <q-separator class="q-mb-md" />

            <!-- Description -->
            <div v-if="document?.description" class="q-px-md q-pb-md">
                <div class="doc-section-title q-mb-sm">{{ $t('common.description').toUpperCase() }}</div>
                <div class="text-body2 text-grey-8" style="line-height: 1.6; word-break: break-word; overflow-wrap: break-word">{{ document.description }}</div>
            </div>
        </q-scroll-area>
    </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { formatDate } from '@/helpers/commons/localeHelper'
import mainStore from '../../../../App.store'
import { useQuasar } from 'quasar'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'

export default defineComponent({
    name: 'document-browser-sidebar',
    props: { selectedDocument: { type: Object } },
    emits: ['documentCloneClick', 'documentDeleteClick', 'itemSelected', 'documentChangeStateClicked', 'showDocumentDetails', 'closePanel'],
    setup() {
        const store = mainStore()
        const $q = useQuasar()
        return { store, $q }
    },
    data() {
        return {
            UserFunctionalitiesConstants,
            document: null as any,
            user: null as any,
            previewImage: null as any
        }
    },
    computed: {
        isSuperAdmin(): boolean {
            return this.user?.isSuperadmin
        },
        canEditDocument(): boolean {
            if (!this.user) return false
            switch (this.document?.stateCode) {
                case 'DEV':
                    return this.user.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_DEV_MANAGEMENT)
                case 'REL':
                    return this.user.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_ADMIN_MANAGEMENT)
                case 'SUSPENDED':
                case 'SUSP':
                    return this.user.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_ADMIN_MANAGEMENT)
                default:
                    return false
            }
        }
    },
    watch: {
        selectedDocument() {
            this.loadDocument()
        },
        'selectedDocument.previewFile': {
            immediate: true,
            async handler() {
                if (this.selectedDocument?.previewFile) {
                    const imageData = await this.getImageUrl()
                    if (imageData) {
                        if (this.previewImage) URL.revokeObjectURL(this.previewImage)
                        this.previewImage = URL.createObjectURL(imageData)
                    }
                } else {
                    this.previewImage = null
                }
            }
        }
    },
    created() {
        this.loadDocument()
        this.user = (this.store.$state as any).user
    },
    beforeUnmount() {
        if (this.previewImage) URL.revokeObjectURL(this.previewImage)
    },
    methods: {
        async getImageUrl(): Promise<Blob | null> {
            if (!this.selectedDocument?.previewFile) return null
            try {
                const response = await this.$http.get(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/preview-file/download?fileName=${this.selectedDocument.previewFile}`, { responseType: 'blob' })
                return response.data
            } catch {
                return null
            }
        },
        loadDocument() {
            this.document = this.selectedDocument
        },
        getFormatedDate(date: any) {
            return formatDate(date, 'MMM DD, YYYY h:mm:ss A')
        },
        getTypeColor(typeCode: string): string {
            const map: Record<string, string> = { DASHBOARD: 'indigo-5', REPORT: 'teal-6', DOCUMENT_COMPOSITE: 'purple-5', KPI: 'orange-7', MAP: 'green-6', COCKPIT: 'blue-5' }
            return map[typeCode] ?? 'grey-6'
        },
        getTypeIcon(typeCode: string): string {
            const map: Record<string, string> = { DASHBOARD: 'dashboard', REPORT: 'description', DOCUMENT_COMPOSITE: 'layers', KPI: 'speed', MAP: 'map', COCKPIT: 'widgets' }
            return map[typeCode] ?? 'article'
        },
        getStatusColor(stateCode: string): string {
            const map: Record<string, string> = { DEV: 'blue-4', TEST: 'orange-6', REL: 'positive', SUSPENDED: 'grey-6', SUSP: 'grey-6' }
            return map[stateCode] ?? 'grey-6'
        },
        cloneDocumentConfirm() {
            this.$q
                .dialog({
                    title: this.$t('common.toast.cloneConfirmTitle'),
                    cancel: true,
                    persistent: true
                })
                .onOk(() => this.$emit('documentCloneClick', this.document))
        },
        deleteDocumentConfirm() {
            this.$q
                .dialog({
                    message: this.$t('common.toast.deleteMessage'),
                    title: this.$t('common.toast.deleteTitle'),
                    cancel: true,
                    persistent: true
                })
                .onOk(() => this.$emit('documentDeleteClick', this.document))
        },
        changeStateDocumentConfirm(direction: string) {
            this.$q
                .dialog({
                    message: this.$t('documentBrowser.changeStateMessage'),
                    title: this.$t('documentBrowser.changeStateTitle'),
                    cancel: true,
                    persistent: true
                })
                .onOk(() => this.$emit('documentChangeStateClicked', { document: this.document, direction }))
        },
        executeDocument() {
            this.$emit('itemSelected', { item: this.document, mode: 'execute' })
        }
    }
})
</script>

<style lang="scss" scoped>
.doc-sidebar-card {
    background-color: #f3f3f3;
    width: 100%;
    border-radius: 0;
    border-top: none;
    border-bottom: none;
    border-right: none;
}
.doc-sidebar-sticky-header {
    flex: 0 0 auto;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    z-index: 1;
}
.doc-sidebar-preview {
    height: 180px;
    overflow: hidden;
    flex: 0 0 auto;
}
.doc-sidebar-img {
    width: 100%;
    height: 180px;
    object-fit: cover;
}
.doc-sidebar-no-preview {
    height: 120px;
    flex: 0 0 auto;
}
.doc-section-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--q-grey-6, #757575);
}
.doc-details-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    overflow: hidden;
    // background: #f3f3f3;
    background: #ffff;
}
.doc-detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    &:last-child {
        border-bottom: none;
    }
}
.doc-detail-label {
    font-size: 13px;
    color: #757575;
}
.doc-detail-value {
    font-size: 13px;
    font-weight: 500;
    text-align: right;
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
