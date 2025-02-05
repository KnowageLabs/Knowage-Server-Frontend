<template>
    <div class="htmlMirrorContainer" style="height: 500px; width: 100%">
        <Button v-tooltip.left="$t('common.menu')" icon="fas fa-ellipsis-v" class="p-button-text p-button-rounded p-button-plain editor-tags-menu-button" @click="toggle"></Button>
        <knMonaco ref="editor" v-model="model.settings.editor.html" style="height: 500px" language="html" @editor-setup="editorSetup"></knMonaco>
    </div>

    <TieredMenu ref="menu" :model="toolbarMenuItems" :popup="true" />
    <TagsDialog :visible="tagsDialogVisible" :widget-model="model" :mode="tagsDialogMode" widget-type="html" :variables="variables" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId" @close="closeTagsDialog" @insert="onInsert" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IVariable, IWidget } from '@/modules/documentExecution/Dashboard/Dashboard'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'
import TieredMenu from 'primevue/tieredmenu'
import TagsDialog from '../../common/editor/WidgetTagsDialog.vue'

let editor = null

export default defineComponent({
    name: 'widget-html-editor',
    components: { knMonaco, TieredMenu, TagsDialog },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        activeIndex: { type: Number, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        dashboardId: { type: String, required: true }
    },
    data() {
        return {
            model: {} as IWidget,
            monaco: null as any,
            toolbarMenuItems: [] as any[],
            tagsDialogMode: '' as string,
            tagsDialogVisible: false,
            cursorPosition: null,
            code: ''
        }
    },
    computed: {
        isCustomHeader() {
            return this.model.settings?.isCustomDashboardHeader
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
        editorSetup(monacoInstance) {
            this.monaco = monacoInstance.monaco
            editor = monacoInstance.editor
        },
        loadModel() {
            this.model = this.widgetModel
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
                },
                {
                    label: this.$t('dashboard.widgetEditor.editorTags.variables'),
                    command: () => this.openTagsDialog('variables')
                },
                {
                    label: this.$t('dashboard.widgetEditor.editorTags.internationalization'),
                    command: () => this.openTagsDialog('internationalization')
                },
                {
                    label: this.$t('dashboard.widgetEditor.editorTags.repeater'),
                    items: [
                        {
                            label: this.$t('dashboard.widgetEditor.editorTags.repeater'),
                            command: () => this.openTagsDialog('repeater')
                        },
                        {
                            label: this.$t('dashboard.widgetEditor.editorTags.repeatIndex'),
                            command: () => this.openTagsDialog('repeatIndex')
                        }
                    ]
                },
                {
                    label: this.$t('dashboard.widgetEditor.editorTags.calculator'),
                    command: () => this.openTagsDialog('calculator')
                }
            )
            if (!this.isCustomHeader)
                this.toolbarMenuItems.push({
                    label: this.$t('dashboard.widgetEditor.interactions.title'),
                    items: [
                        {
                            label: this.$t('dashboard.widgetEditor.editorTags.selection'),
                            command: () => this.openTagsDialog('selection')
                        },
                        {
                            label: this.$t('dashboard.widgetEditor.editorTags.preview'),
                            command: () => this.openTagsDialog('preview')
                        },
                        {
                            label: this.$t('dashboard.widgetEditor.editorTags.crossnav'),
                            command: () => this.openTagsDialog('crossnav')
                        },
                        {
                            label: this.$t('dashboard.widgetEditor.editorTags.iframe'),
                            command: () => this.openTagsDialog('iframe')
                        }
                    ]
                })
            this.toolbarMenuItems.push({
                label: this.$t('dashboard.widgetEditor.editorTags.conditional'),
                command: () => this.openTagsDialog('conditional')
            })
            if (!this.isCustomHeader)
                this.toolbarMenuItems.push({
                    label: this.$t('dashboard.widgetEditor.editorTags.activesel'),
                    command: () => this.openTagsDialog('activesel')
                })
        },
        openTagsDialog(mode: string) {
            this.tagsDialogMode = mode
            this.tagsDialogVisible = true
        },
        closeTagsDialog() {
            this.tagsDialogVisible = false
        },
        onInsert(value: string) {
            const selection = editor.getSelection()
            let range = new this.monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn)
            this.tagsDialogVisible = false
            const op = { range: range || selection, text: value, forceMoveMarkers: true }
            editor.executeEdits('my-source', [op])
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
