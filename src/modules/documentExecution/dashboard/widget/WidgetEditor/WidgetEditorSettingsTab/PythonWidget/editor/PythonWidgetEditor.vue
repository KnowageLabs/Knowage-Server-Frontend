<template>
    <div v-if="editorSettings" id="python-widget-editor">
        <Button v-tooltip.left="$t('common.menu')" icon="fas fa-ellipsis-v" class="p-button-text p-button-rounded p-button-plain editor-tags-menu-button" @click="toggle"></Button>
        {{ 'TODO - MONACO EDITOR' }}
    </div>

    <TieredMenu ref="menu" :model="toolbarMenuItems" :popup="true" />
    <PythonTagsDialog :visible="tagsDialogVisible" :widget-model="widgetModel" :mode="tagsDialogMode" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId" @close="closeTagsDialog" @insert="onInsert" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IWidget } from '../../../../../Dashboard'
import { IPythonEditorSettings } from '../../../../../interfaces/DashboardPythonWidget'
import TieredMenu from 'primevue/tieredmenu'
import PythonTagsDialog from './PythonTagsDialog.vue'

export default defineComponent({
    name: 'python-widget-editor',
    components: { TieredMenu, PythonTagsDialog },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        dashboardId: { type: String, required: true }
    },
    data() {
        return {
            editorSettings: null as IPythonEditorSettings | null,
            toolbarMenuItems: [] as any[],
            tagsDialogMode: '' as string,
            tagsDialogVisible: false,
            code: ''
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
            console.log('------ ON INSERT: ', value)
            this.tagsDialogVisible = false
        }
    }
})
</script>
<style lang="scss">
#python-widget-editor {
    height: 500px;
    width: 100%;
}

.editor-tags-menu-button {
    position: absolute;
    font-size: 20px;
    top: 45px;
    right: 20px;
    z-index: 9999;
}
</style>
