<template>
    <div class="dd-tab-layout">
        <!-- LEFT: list -->
        <div class="dd-tab-list-col">
            <div class="dd-list-header row items-center q-px-sm q-py-xs">
                <q-checkbox :model-value="templateSelectionState" dense :disable="loading || deleting || selectableTemplates.length === 0" :aria-label="$t('documentExecution.documentDetails.history.selectAllTemplates')" data-test="select-all-templates" @update:model-value="toggleAllTemplates">
                    <q-tooltip>{{ $t('documentExecution.documentDetails.history.selectAllTemplates') }}</q-tooltip>
                </q-checkbox>
                <q-input v-model="searchText" :placeholder="$t('common.search')" dense borderless clearable class="col q-pr-xs">
                    <template #prepend><q-icon name="search" size="16px" /></template>
                </q-input>
                <q-separator vertical />
                <q-btn class="q-ml-sm" flat round dense icon="delete" color="negative" :disable="loading || deleting || selectedTemplateIds.length === 0" :loading="deleting" :aria-label="$t('documentExecution.documentDetails.history.deleteSelectedTemplates', { count: selectedTemplateIds.length })" data-test="delete-selected-templates" @click="deleteSelectedTemplatesConfirm">
                    <q-badge v-if="selectedTemplateIds.length > 0" color="negative" floating>{{ selectedTemplateIds.length }}</q-badge>
                    <q-tooltip>{{ $t('documentExecution.documentDetails.history.deleteSelectedTemplates', { count: selectedTemplateIds.length }) }}</q-tooltip>
                </q-btn>
                <q-btn class="q-ml-sm" unelevated dense icon="upload" color="accent" :disable="deleting" @click="triggerFileUpload">
                    <q-tooltip>{{ $t('documentExecution.documentDetails.info.uploadTemplate') }}</q-tooltip>
                </q-btn>
                <input ref="fileInput" type="file" style="display: none" @change="startTemplateUpload" />
            </div>
            <q-separator />
            <q-scroll-area class="dd-scroll">
                <q-linear-progress v-if="loading" indeterminate color="primary" />
                <q-list separator class="dd-list">
                    <q-item v-for="tmpl in filteredTemplates" :key="tmpl.id" clickable :active="selectedTemplate === tmpl" active-class="kn-list-item--selected" @click="selectTemplate(tmpl)">
                        <q-item-section side @click.stop>
                            <q-checkbox v-model="selectedTemplateIds" :val="tmpl.id" dense :disable="tmpl.active || loading || deleting" :aria-label="tmpl.name" data-test="template-checkbox" />
                        </q-item-section>
                        <q-item-section avatar>
                            <q-avatar size="32px" :style="tmpl.active ? 'background:#74a748' : 'background:#ffc107'" text-color="white">
                                <q-icon :name="tmpl.active ? 'fas fa-check' : 'fas fa-history'" size="14px" />
                            </q-avatar>
                        </q-item-section>
                        <q-item-section>
                            <q-item-label>{{ tmpl.name }}</q-item-label>
                            <q-item-label caption>{{ formatDate(tmpl.creationDate) }}</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                            <q-btn flat round dense icon="more_vert" size="sm" :disable="deleting" @click.stop>
                                <q-menu anchor="bottom right" self="top right">
                                    <q-list dense style="min-width: 190px">
                                        <q-item v-if="!tmpl.active" clickable v-close-popup @click="setActiveTemplate(tmpl)">
                                            <q-item-section avatar><q-icon name="fas fa-check-circle" color="positive" size="xs" /></q-item-section>
                                            <q-item-section>{{ $t('documentExecution.documentDetails.history.activeButton') }}</q-item-section>
                                        </q-item>
                                        <q-item clickable v-close-popup @click="downloadTemplate(tmpl)">
                                            <q-item-section avatar><q-icon name="fas fa-download" size="xs" /></q-item-section>
                                            <q-item-section>{{ $t('documentExecution.documentDetails.history.downloadButton') }}</q-item-section>
                                        </q-item>
                                        <q-item v-if="!tmpl.active" clickable v-close-popup @click="deleteTemplateConfirm(tmpl)">
                                            <q-item-section avatar><q-icon name="fas fa-trash-alt" color="negative" size="xs" /></q-item-section>
                                            <q-item-section>{{ $t('documentExecution.documentDetails.history.deleteButton') }}</q-item-section>
                                        </q-item>
                                    </q-list>
                                </q-menu>
                            </q-btn>
                        </q-item-section>
                    </q-item>
                    <q-item v-if="filteredTemplates.length === 0 && !loading">
                        <q-item-section class="text-grey-6 q-pa-sm">{{ $t('common.info.noDataFound') }}</q-item-section>
                    </q-item>
                </q-list>
            </q-scroll-area>
        </div>

        <q-separator vertical />

        <!-- RIGHT: editor -->
        <div class="dd-history-editor-col">
            <KnHint v-if="!showTemplateContent" class="kn-hint-sm" :title="'documentExecution.documentDetails.history.templateTitle'" :hint="$t('documentExecution.documentDetails.history.templateHint')" data-test="hint"></KnHint>
            <template v-else>
                <div class="dd-history-editor-toolbar row items-center q-px-sm q-py-xs" style="background-color: #f3f3f3 !">
                    <q-btn v-if="designerButtonVisible" flat dense :label="$t('documentExecution.olap.openDesigner')" color="primary" size="sm" @click="openDesignerConfirm" />
                    <q-space />
                    <template v-if="!isEditMode">
                        <q-btn flat round dense icon="fa-solid fa-pen-to-square" size="sm" :disable="deleting" @click="enterEditMode">
                            <q-tooltip>{{ $t('workspace.myAnalysis.menuItems.editTemplate') }}</q-tooltip>
                        </q-btn>
                    </template>
                    <template v-else>
                        <q-btn flat round dense icon="save" color="primary" :disable="deleting" @click="saveEditedTemplate">
                            <q-tooltip>{{ $t('common.save') }}</q-tooltip>
                        </q-btn>
                        <q-btn flat round dense icon="close" @click="cancelEdit">
                            <q-tooltip>{{ $t('common.cancel') }}</q-tooltip>
                        </q-btn>
                    </template>
                </div>
                <q-separator />
                <DocumentDetailsHistoryEditor v-model="selectedTemplateContent" text-to-insert="" class="dd-history-editor" :options="{ wordWrap: 'on', readOnly: !isEditMode }" :language="getEditorLanguage" :original-content="isEditMode ? originalTemplateContent : ''" :show-diff="isEditMode" @keyup="$emit('touched')" />
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { iTemplate } from '@/modules/documentExecution/documentDetails/DocumentDetails'
import { defineComponent, PropType } from 'vue'
import { AxiosResponse } from 'axios'
import { iDocument } from '@/modules/documentExecution/documentDetails/DocumentDetails'
import { downloadDirect } from '@/helpers/commons/fileHelper'
import { mapState } from 'pinia'
import { startOlap } from '../../dialogs/olapDesignerDialog/DocumentDetailOlapHelpers'
import mainStore from '../../../../../App.store'
import DocumentDetailsHistoryEditor from './DocumentDetailsHistoryEditor.vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import KnHint from '@/components/UI/KnHint.vue'

export default defineComponent({
    name: 'document-history',
    components: { DocumentDetailsHistoryEditor, KnHint },
    props: { selectedDocument: { type: Object as PropType<iDocument>, required: true }, refresh: { type: Boolean, required: false } },
    emits: ['touched', 'openDesignerDialog'],
    setup() {
        const store = mainStore()
        const $q = useQuasar()
        const router = useRouter()
        return { store, $q, router }
    },
    data() {
        return {
            searchText: '',
            selectedTemplate: {} as iTemplate,
            selectedTemplateIds: [] as number[],
            listOfTemplates: [] as iTemplate[],
            selectedTemplateFileType: null as string | null,
            selectedTemplateContent: '' as any,
            loading: false,
            deleting: false,
            isEditMode: false,
            originalTemplateContent: '' as string
        }
    },
    computed: {
        filteredTemplates(): iTemplate[] {
            if (!this.searchText) return this.listOfTemplates
            const needle = this.searchText.toLowerCase()
            return this.listOfTemplates.filter((t) => t.name?.toLowerCase().includes(needle))
        },
        selectableTemplates(): iTemplate[] {
            return this.filteredTemplates.filter((template) => !template.active)
        },
        templateSelectionState(): boolean | null {
            const count = this.selectableTemplates.filter((template) => this.selectedTemplateIds.includes(template.id)).length
            if (count === 0) return false
            return count === this.selectableTemplates.length ? true : null
        },
        showTemplateContent(): boolean {
            return ['xml', 'xls', 'rptdesign', 'sbicockpit', 'json', 'sbigeoreport'].includes(this.selectedTemplateFileType ?? '')
        },
        getEditorLanguage(): string {
            switch (this.selectedTemplateFileType) {
                case 'xml':
                case 'xls':
                case 'rptdesign':
                    return 'html'
                case 'sbicockpit':
                case 'json':
                case 'sbigeoreport':
                    return 'json'
                default:
                    return ''
            }
        },
        designerButtonVisible(): boolean {
            return this.selectedDocument.typeCode == 'OLAP' || this.selectedDocument.typeCode == 'KPI' || this.selectedDocument.engine == 'knowagegisengine'
        },
        ...mapState(mainStore, { user: 'user' })
    },
    watch: {
        refresh(newValue) {
            if (newValue) this.getAllTemplates()
        }
    },
    created() {
        this.getAllTemplates()
    },
    methods: {
        formatDate(timestamp: number): string {
            if (!timestamp) return ''
            return new Date(timestamp).toLocaleDateString()
        },
        triggerFileUpload() {
            ;(this.$refs.fileInput as HTMLInputElement).click()
        },
        toggleAllTemplates(selected: boolean) {
            const ids = new Set(this.selectedTemplateIds)
            this.selectableTemplates.forEach((template) => (selected ? ids.add(template.id) : ids.delete(template.id)))
            this.selectedTemplateIds = [...ids]
        },
        async getAllTemplates() {
            this.loading = true
            return this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/templates`)
                .then((response: AxiosResponse<any>) => {
                    this.listOfTemplates = response.data as iTemplate[]
                    this.selectedTemplateIds = this.selectedTemplateIds.filter((id) => this.listOfTemplates.some((template) => template.id === id && !template.active))
                    if (this.selectedTemplate.id != null) {
                        const selected = this.listOfTemplates.find((template) => template.id === this.selectedTemplate.id)
                        if (selected) this.selectedTemplate = selected
                        else this.clearSelectedTemplate()
                    }
                    return response.data
                })
                .finally(() => (this.loading = false))
        },
        async getSelectedTemplate(templateId: number) {
            this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/templates/selected/${templateId}`, { headers: { 'X-Disable-Errors': 'true' } }).then((response: AxiosResponse<any>) => {
                if (this.selectedTemplate.id !== templateId) return
                const content = this.selectedTemplateFileType == 'sbicockpit' || this.selectedTemplateFileType == 'json' || this.selectedTemplateFileType == 'sbigeoreport' ? JSON.stringify(response.data, null, 4) : response.data
                this.selectedTemplateContent = content
                this.originalTemplateContent = content
            })
        },
        setFileType(template: iTemplate) {
            if (template?.name) {
                const parts = template.name.split('.')
                this.selectedTemplateFileType = parts[parts.length - 1]
            }
        },
        selectTemplate(template: iTemplate) {
            this.selectedTemplate = template
            this.setFileType(template)
            this.isEditMode = false
            this.getSelectedTemplate(template.id)
        },
        clearSelectedTemplate() {
            this.selectedTemplate = {} as iTemplate
            this.selectedTemplateFileType = null
            this.selectedTemplateContent = ''
            this.originalTemplateContent = ''
            this.isEditMode = false
        },
        startTemplateUpload(event: Event) {
            const file = (event.target as HTMLInputElement).files?.[0]
            if (file) this.uploadTemplate(file)
            ;(event.target as HTMLInputElement).value = ''
        },
        async uploadTemplate(uploadedFile: File) {
            const formData = new FormData()
            formData.append('file', uploadedFile)
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/templates`, formData, { headers: { 'X-Disable-Errors': 'true' } })
                .then(async () => {
                    this.store.setInfo({ title: this.$t('common.toast.success'), msg: this.$t('common.toast.uploadSuccess') })
                    await this.getAllTemplates()
                    this.selectTemplate(this.listOfTemplates[0])
                })
                .catch(() => this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.documentDetails.history.uploadError') }))
        },
        setActiveTemplate(template: iTemplate) {
            this.$http
                .put(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/templates/${template.id}`, { headers: { 'X-Disable-Errors': 'true' } })
                .then(() => {
                    this.store.setInfo({ title: this.$t('common.toast.success'), msg: this.$t('documentExecution.documentDetails.history.activeOk') })
                    this.getAllTemplates()
                })
                .catch(() => this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.documentDetails.history.activeError') }))
        },
        async downloadTemplate(template: iTemplate) {
            const parts = template.name.split('.')
            const fileType = parts[parts.length - 1]
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/templates/${template.id}/${fileType}/file`, {
                    headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9', 'X-Disable-Errors': 'true' }
                })
                .then((response: AxiosResponse<any>) => {
                    if (response.data.errors) {
                        this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('common.error.errorCreatingPackage') })
                    } else {
                        this.store.setInfo({ title: this.$t('common.toast.success') })
                        if (response.headers) {
                            const contentDisposition = response.headers['content-disposition']
                            const match = contentDisposition?.match(/filename[^;\n=]*=((['"]).*?\2|[^;\n]*)/i)
                            if (match?.length > 1) {
                                const completeFileName = match[1].replaceAll('"', '')
                                if (fileType == 'json' || fileType == 'sbicockpit') {
                                    downloadDirect(JSON.stringify(response.data), completeFileName, 'text/html; charset=UTF-8')
                                } else {
                                    downloadDirect(response.data, completeFileName, 'text/html; charset=UTF-8')
                                }
                            }
                        }
                    }
                })
                .catch((error) => this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: error.message }))
        },
        deleteTemplateConfirm(template: iTemplate) {
            this.$q
                .dialog({
                    title: this.$t('common.toast.deleteConfirmTitle'),
                    message: this.$t('common.toast.deleteMessage'),
                    cancel: true,
                    persistent: true
                })
                .onOk(() => this.deleteTemplate(template))
        },
        deleteSelectedTemplatesConfirm() {
            if (this.deleting) return
            const templates = this.listOfTemplates.filter((template) => !template.active && this.selectedTemplateIds.includes(template.id))
            if (templates.length === 0) return
            this.$q
                .dialog({
                    title: this.$t('common.toast.deleteConfirmTitle'),
                    message: templates.length === 1 ? this.$t('common.toast.deleteMessage') : this.$t('documentExecution.documentDetails.history.deleteTemplatesMessage', { count: templates.length }),
                    cancel: true,
                    persistent: true
                })
                .onOk(() => this.deleteTemplates(templates))
        },
        async deleteTemplate(template: iTemplate) {
            await this.deleteTemplates([template])
        },
        async deleteTemplates(templates: iTemplate[]) {
            if (this.deleting) return
            const targets = this.listOfTemplates.filter((template) => !template.active && templates.some((selected) => selected.id === template.id))
            if (targets.length === 0) return
            this.deleting = true
            const deletedIds: number[] = []
            const errors: string[] = []
            try {
                for (const template of targets) {
                    try {
                        await this.$http.delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/templates/${template.id}`, { headers: { 'X-Disable-Errors': 'true' } })
                        deletedIds.push(template.id)
                    } catch (error: any) {
                        errors.push(`${template.name}: ${error.message}`)
                    }
                }
                this.listOfTemplates = this.listOfTemplates.filter((template) => !deletedIds.includes(template.id))
                this.selectedTemplateIds = this.selectedTemplateIds.filter((id) => !deletedIds.includes(id))
                if (deletedIds.includes(this.selectedTemplate.id)) this.clearSelectedTemplate()
                try {
                    await this.getAllTemplates()
                } catch (error: any) {
                    errors.push(error.message)
                }
                if (errors.length > 0) this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: errors.join('\n') })
                else this.store.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: deletedIds.length === 1 ? this.$t('common.toast.deleteSuccess') : this.$t('documentExecution.documentDetails.history.deleteTemplatesSuccess', { count: deletedIds.length }) })
            } finally {
                this.deleting = false
            }
        },
        openDesignerConfirm() {
            this.$q
                .dialog({
                    title: this.$t('common.toast.warning'),
                    message: this.$t('documentExecution.olap.openDesignerMsg'),
                    cancel: true,
                    persistent: true
                })
                .onOk(() => {
                    switch (this.selectedDocument.typeCode) {
                        case 'KPI':
                            this.openKpiDocumentDesigner()
                            break
                        case 'MAP':
                            this.openGis()
                            break
                        default:
                            this.openDesigner()
                    }
                })
        },
        async openDesigner() {
            if (this.listOfTemplates.length === 0) {
                this.$emit('openDesignerDialog')
            } else {
                const activeTemplate = this.findActiveTemplate()
                const sbiExecutionId = crypto.randomUUID()
                await startOlap(this.$http, this.user, sbiExecutionId, this.selectedDocument, activeTemplate, this.router)
            }
        },
        findActiveTemplate(): iTemplate | null {
            return this.listOfTemplates.find((t) => t.active) ?? null
        },
        openGis() {
            this.router.push(`/gis/edit?documentId=${this.selectedDocument.id}`)
        },
        openKpiDocumentDesigner() {
            this.router.push(`/kpi-edit/${this.selectedDocument.id}?from=documentDetail`)
        },
        enterEditMode() {
            this.isEditMode = true
            this.originalTemplateContent = this.selectedTemplateContent
        },
        cancelEdit() {
            this.isEditMode = false
            this.selectedTemplateContent = this.originalTemplateContent
        },
        async saveEditedTemplate() {
            const fileExtension = this.selectedTemplateFileType
            let mimeType = 'text/plain'
            if (fileExtension === 'json' || fileExtension === 'sbicockpit' || fileExtension === 'sbigeoreport') mimeType = 'application/json'
            else if (fileExtension === 'xml' || fileExtension === 'rptdesign') mimeType = 'application/xml'
            else if (fileExtension === 'xls') mimeType = 'application/vnd.ms-excel'

            const blob = new Blob([this.selectedTemplateContent], { type: mimeType })
            const file = new File([blob], this.selectedTemplate.name, { type: mimeType })
            this.uploadTemplate(file)
            this.isEditMode = false
        }
    }
})
</script>
<style lang="scss" scoped>
.dd-history-editor-col {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    position: relative;
    background-color: #f3f3f3;
}

.dd-history-editor-toolbar {
    min-height: 40px;
    flex-shrink: 0;
}

.dd-history-editor {
    flex: 1;
    min-height: 0;
    overflow: hidden;
}
</style>
