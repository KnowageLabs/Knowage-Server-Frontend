<template>
    <div v-if="widgetHelpSettingsModel" class="q-pa-md">
        <div class="row q-col-gutter-sm">
            <div class="col-6">
                <WidgetEditorStyleToolbar :options="descriptor.styleToolbarSettings" :prop-model="toolbarModel" @change="onStyleToolbarChange" />
            </div>
            <div class="col-6">
                <q-select v-model="widgetHelpSettingsModel.iconPosition" :options="translatedIconPositions" :label="$t('dashboard.widgetEditor.help.iconPosition')" option-value="value" option-label="label" emit-value map-options outlined dense />
            </div>
            <div class="col-12"><q-separator /></div>

            <div class="col-12">
                <q-select v-model="widgetHelpSettingsModel.visualizationType" :options="translatedVisualizationTypes" :label="$t('dashboard.widgetEditor.help.visualization')" option-value="value" option-label="label" emit-value map-options outlined dense />
            </div>

            <template v-if="widgetHelpSettingsModel.visualizationType === 'pop-up'">
                <div class="col-6">
                    <q-input v-model="widgetHelpSettingsModel.popupWidth" :label="$t('dashboard.widgetEditor.help.popupWidth')" outlined dense />
                </div>
                <div class="col-6">
                    <q-input v-model="widgetHelpSettingsModel.popupHeight" :label="$t('dashboard.widgetEditor.help.popupHeight')" outlined dense />
                </div>
            </template>

            <div class="col-12"><q-separator /></div>

            <div class="col-12">
                <q-select v-model="widgetHelpSettingsModel.type" :options="translatedTypes" :label="$t('common.type')" option-value="value" option-label="label" emit-value map-options outlined dense />
            </div>

            <div v-if="widgetHelpSettingsModel.type === 'free-text'" class="col-12">
                <q-editor
                    v-model="widgetHelpSettingsModel.text"
                    :dense="$q.screen.lt.md"
                    :toolbar="[
                        ['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript'],
                        ['token', 'hr', 'link', 'custom_btn'],
                        [
                            { label: $q.lang.editor.fontSize, icon: $q.iconSet.editor.fontSize, fixedLabel: true, fixedIcon: true, list: 'no-icons', options: ['size-1', 'size-2', 'size-3', 'size-4', 'size-5', 'size-6', 'size-7'] },
                            { label: $q.lang.editor.defaultFont, icon: $q.iconSet.editor.font, fixedIcon: true, list: 'no-icons', options: ['default_font', 'arial', 'arial_black', 'comic_sans', 'courier_new', 'impact', 'lucida_grande', 'roboto', 'tahoma', 'times_new_roman', 'verdana'] }
                        ],
                        ['quote', 'unordered', 'ordered', 'outdent', 'indent'],
                        ['undo', 'redo']
                    ]"
                    :fonts="{ arial: 'Arial', arial_black: 'Arial Black', comic_sans: 'Comic Sans MS', courier_new: 'Courier New', impact: 'Impact', lucida_grande: 'Lucida Grande', roboto: 'Roboto', tahoma: 'Tahoma', times_new_roman: 'Times New Roman', verdana: 'Verdana' }"
                />
            </div>

            <div v-if="widgetHelpSettingsModel.type === 'link'" class="col-12">
                <q-input v-model="widgetHelpSettingsModel.url" :label="$t('common.url')" outlined dense />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { useQuasar } from 'quasar'
import { IWidget, IWidgetHelpSettings, IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import descriptor from './WidgetHelpSettingsDescriptor.json'
import WidgetEditorStyleToolbar from '../styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'widget-help-settings',
    components: { WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true } },
    emits: [],
    setup() {
        const $q = useQuasar()
        return { $q }
    },
    data() {
        return {
            descriptor,
            widgetHelpSettingsModel: null as IWidgetHelpSettings | null,
            toolbarModel: { icon: '' } as { icon: string }
        }
    },
    computed: {
        translatedVisualizationTypes(): { label: string; value: string }[] {
            return descriptor.visualizationTypes.map((opt) => ({ label: this.$t(opt.label), value: opt.value }))
        },
        translatedIconPositions(): { label: string; value: string }[] {
            return descriptor.iconPositions.map((opt) => ({ label: this.$t(opt.label), value: opt.value }))
        },
        translatedTypes(): { label: string; value: string }[] {
            return descriptor.types.map((opt) => ({ label: this.$t(opt.label), value: opt.value }))
        }
    },
    mounted() {
        this.loadWidgetHelpSettings()
    },
    methods: {
        loadWidgetHelpSettings() {
            if (this.widgetModel?.settings?.help) this.widgetHelpSettingsModel = this.widgetModel.settings.help
            this.loadToolbarModel()
        },
        loadToolbarModel() {
            if (this.widgetHelpSettingsModel?.icon) this.toolbarModel.icon = this.widgetHelpSettingsModel.icon
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.widgetHelpSettingsModel) return
            this.toolbarModel.icon = model.icon ?? ''
            this.widgetHelpSettingsModel.icon = model.icon ?? ''
        }
    }
})
</script>
