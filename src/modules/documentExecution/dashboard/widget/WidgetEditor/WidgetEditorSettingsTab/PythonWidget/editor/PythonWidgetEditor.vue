<template>
    <div v-if="editorSettings" id="python-widget-editor" class="p-grid p-jc-center p-p-4">
        <div class="p-col-12 p-md-6 p-d-flex p-flex-column p-p-2">
            <label class="kn-material-input-label p-mr-2">{{ $t('managers.widgetGallery.outputType') }}</label>
            <Dropdown v-model="editorSettings.outputType" class="kn-material-input" :options="descriptor.pythonOutputTypeOptions" option-value="value">
                <template #value="slotProps">
                    <div>
                        <span>{{ getTranslatedLabel(slotProps.value, descriptor.pythonOutputTypeOptions, $t) }}</span>
                    </div>
                </template>
                <template #option="slotProps">
                    <div>
                        <span>{{ $t(slotProps.option.label) }}</span>
                    </div>
                </template>
            </Dropdown>
        </div>

        <div class="p-col-12 p-md-6 p-d-flex p-flex-column">
            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.python.outputFileName') }}</label>
            <InputText v-model="editorSettings.outputName" class="kn-material-input p-inputtext-sm" />
        </div>

        <div>
            <Button v-tooltip.left="$t('common.menu')" icon="fas fa-ellipsis-v" class="p-button-text p-button-rounded p-button-plain editor-tags-menu-button" @click="toggle"></Button>
        </div>

        <div class="p-d-flex p-flex-column kn-flex p-mr-3 p-my-3 dashboard-card-shadow kn-overflow dashboard-scrollbar">
            <label class="kn-material-input-label p-m-3"> {{ $t('common.script') }}</label>
            <KnMonaco ref="monacoEditor" style="height: 500px" v-model="editorSettings.script" :options="{ theme: 'vs-light' }" :language="widgetModel.type === 'python' ? 'python' : 'r'" :text-to-insert="textToInsert" @stringInserted="textToInsert = ''" />
        </div>
    </div>

    <TieredMenu ref="menu" :model="toolbarMenuItems" :popup="true" />
    <PythonTagsDialog :visible="tagsDialogVisible" :widget-model="widgetModel" :mode="tagsDialogMode" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId" @close="closeTagsDialog" @insert="onInsert" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IWidget } from '../../../../../Dashboard'
import { IPythonEditorSettings } from '../../../../../interfaces/DashboardPythonWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from './PythonWidgetEditorDescriptor.json'
import Dropdown from 'primevue/dropdown'
import TieredMenu from 'primevue/tieredmenu'
import PythonTagsDialog from './PythonTagsDialog.vue'
import KnMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

export default defineComponent({
    name: 'python-widget-editor',
    components: { Dropdown, TieredMenu, PythonTagsDialog, KnMonaco },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        dashboardId: { type: String, required: true }
    },
    data() {
        return {
            descriptor,
            editorSettings: null as IPythonEditorSettings | null,
            toolbarMenuItems: [] as any[],
            tagsDialogMode: '' as string,
            tagsDialogVisible: false,
            code: '',
            textToInsert: '',
            getTranslatedLabel
        }
    },
    watch: {
        widgetModel() {
            this.loadModel()
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.editorSettings = this.widgetModel.settings.editor
        },
        toggle(event: Event) {
            this.createMenuItems()
            const menu = this.$refs.menu as any
            menu.toggle(event)
        },
        createMenuItems() {
            this.toolbarMenuItems.length = 0
            this.toolbarMenuItems.push(
                {
                    label: this.$t('dashboard.widgetEditor.editorTags.columnsData'),
                    command: () => this.openTagsDialog('columnsData')
                },
                {
                    label: this.$t('dashboard.widgetEditor.editorTags.parameters'),
                    command: () => this.openTagsDialog('parameters')
                }
            )
        },
        openTagsDialog(mode: string) {
            this.tagsDialogMode = mode
            this.tagsDialogVisible = true
        },
        closeTagsDialog() {
            this.tagsDialogMode = ''
            this.tagsDialogVisible = false
        },
        onInsert(value: string) {
            this.textToInsert = value
            this.tagsDialogVisible = false
        }
    }
})
</script>
<style lang="scss">
.editor-tags-menu-button {
    position: absolute;
    font-size: 20px;
    top: 45px;
    right: 20px;
    z-index: 9999;
}
</style>
