<template>
    <div class="p-grid">
        <div class="p-col-12">
            <q-editor
                ref="editor"
                class="q-ma-sm"
                v-model="model.settings.editor.text"
                :toolbar="[
                    [
                        {
                            label: $q.lang.editor.align,
                            icon: $q.iconSet.editor.align,
                            fixedLabel: true,
                            list: 'only-icons',
                            options: ['left', 'center', 'right', 'justify']
                        }
                    ],
                    ['bold', 'italic', 'underline'],
                    [
                        {
                            label: $q.lang.editor.fontSize,
                            icon: $q.iconSet.editor.fontSize,
                            fixedLabel: true,
                            fixedIcon: true,
                            list: 'no-icons',
                            options: ['size-1', 'size-2', 'size-3', 'size-4', 'size-5', 'size-6', 'size-7']
                        },
                        'font-family',
                        'color',
                        'removeFormat'
                    ],
                    ['unordered', 'ordered'],

                    ['undo', 'redo'],
                    ['test']
                ]"
                min-height="200px"
            >
                <template #test>
                    <q-btn dense no-caps icon="data_array" unelevated label="placeholders" size="sm" @click="toggle" />
                </template>
                <template #font-family>
                    <q-btn-dropdown dense no-caps ref="familytoken" no-wrap unelevated icon="font_download" label="Font Family" size="sm">
                        <q-list dense>
                            <q-item v-for="font in TextWidgetEditorDescriptor.fontFamilies" clickable data-test="list-item" @click="setFontFamily(font)"
                                ><q-item-section
                                    ><span :style="{ 'font-family': font }">{{ font }}</span></q-item-section
                                ></q-item
                            >
                        </q-list>
                    </q-btn-dropdown>
                </template>
                <template #color>
                    <q-btn-dropdown dense no-caps ref="token" no-wrap unelevated icon="format_color_text" label="Text Color" size="sm">
                        <q-list dense>
                            <q-item tag="label" clickable data-test="list-item" @click="color('backColor', highlight)">
                                <q-item-section side>
                                    <q-icon name="format_color_fill" />
                                </q-item-section>
                                <q-item-section>
                                    <q-color
                                        v-model="highlight"
                                        default-view="palette"
                                        no-header
                                        no-footer
                                        :palette="[
                                            '#ffccccaa',
                                            '#ffe6ccaa',
                                            '#ffffccaa',
                                            '#ccffccaa',
                                            '#ccffe6aa',
                                            '#ccffffaa',
                                            '#cce6ffaa',
                                            '#ccccffaa',
                                            '#e6ccffaa',
                                            '#ffccffaa',
                                            '#ff0000aa',
                                            '#ff8000aa',
                                            '#ffff00aa',
                                            '##00ff00aa',
                                            '#00ff80aa',
                                            '#00ffffaa',
                                            '#0080ffaa',
                                            '#0000ffaa',
                                            '#8000ffaa',
                                            '#ff00ffaa'
                                        ]"
                                        class="my-picker"
                                    />
                                </q-item-section>
                            </q-item>
                            <q-item tag="label" clickable data-test="list-item" @click="color('foreColor', foreColor)">
                                <q-item-section side>
                                    <q-icon name="format_color_text" />
                                </q-item-section>
                                <q-item-section>
                                    <q-color v-model="foreColor" no-header no-footer default-view="palette" :palette="['#ff0000', '#ff8000', '#ffff00', '##00ff00', '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff', '#ff00ff']" class="my-picker" />
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-btn-dropdown>
                </template>
            </q-editor>
        </div>
    </div>

    <TieredMenu ref="menu" :model="toolbarMenuItems" :popup="true" />
    <TagsDialog :visible="tagsDialogVisible" :widget-model="model" :mode="tagsDialogMode" widget-type="text" :variables="variables" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId" @close="closeTagsDialog" @insert="onInsert" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IVariable, IWidget, IDataset } from '@/modules/documentExecution/Dashboard/Dashboard'
import TextWidgetEditorDescriptor from './TextWidgetEditorDescriptor.json'
import TieredMenu from 'primevue/tieredmenu'
import TagsDialog from '../../common/editor/WidgetTagsDialog.vue'

export default defineComponent({
    name: 'text-widget-editor',
    components: { TieredMenu, TagsDialog },
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
            toolbarMenuItems: [] as any[],
            tagsDialogMode: '' as string,
            tagsDialogVisible: false,
            foreColor: '#000000',
            highlight: '#ffff00aa',
            TextWidgetEditorDescriptor: TextWidgetEditorDescriptor
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
        color(cmd, name) {
            const edit = this.$refs.editor
            this.$refs.token.hide()
            edit.caret.restore()
            edit.runCmd(cmd, name)
            edit.focus()
        },
        setFontFamily(name) {
            const edit = this.$refs.editor
            this.$refs.familytoken.hide()
            edit.caret.restore()
            edit.runCmd('fontName', name)
            edit.focus()
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
                        }
                    ]
                }
            )
        },
        openTagsDialog(mode: string) {
            this.tagsDialogMode = mode
            this.tagsDialogVisible = true
        },
        closeTagsDialog() {
            this.tagsDialogVisible = false
        },
        onInsert(value: string) {
            this.model.settings.editor.text += '<p>' + value + '</p>'
            this.model.settings.editor.text += '&#8205;'
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

#editor-container {
    font-family: 'Arial';
    font-size: 18px;
    height: 375px;
}

#toolbar-container .ql-font span[data-label='Aref Ruqaa']::before {
    font-family: 'Aref Ruqaa';
}
#toolbar-container .ql-font span[data-label='Mirza']::before {
    font-family: 'Mirza';
}
#toolbar-container .ql-font span[data-label='Roboto']::before {
    font-family: 'Roboto';
}
#toolbar-container .ql-font span[data-label='Sans Serif']::before {
    font-family: 'Sans Serif';
}
#toolbar-container .ql-font span[data-label='Inconsolata']::before {
    font-family: 'Inconsolata';
}
#toolbar-container .ql-font span[data-label='Arial']::before {
    font-family: 'Arial';
}
#toolbar-container .ql-font span[data-label='Arial']::before {
    font-family: 'Serif';
}
#toolbar-container .ql-font span[data-label='Arial']::before {
    font-family: 'Monospace';
}

.ql-font-aref-ruqua {
    font-family: 'Aref Ruqaa';
}
.ql-font-mirza {
    font-family: 'Mirza';
}
.ql-font-roboto {
    font-family: 'Roboto';
}
.ql-font-sans-serif {
    font-family: 'Sans Serif';
}
.ql-font-inconsolata {
    font-family: 'Inconsolata';
}
.ql-font-arial {
    font-family: 'Arial';
}
.ql-font-serif {
    font-family: 'Arial';
}
.ql-font-monospace {
    font-family: 'Monospace';
}

.crossNavigation,
.preview,
.selection {
    font-weight: bold;
    font-style: italic;
    transition: all 0.3s ease;
    padding: 2px;
    border: 1px solid #ccc;
}

.crossNavigation:hover,
.preview:hover,
.selection:hover {
    background-color: #ccc;
    cursor: pointer;
}

#menu-icon-container {
    float: right;
}
</style>
