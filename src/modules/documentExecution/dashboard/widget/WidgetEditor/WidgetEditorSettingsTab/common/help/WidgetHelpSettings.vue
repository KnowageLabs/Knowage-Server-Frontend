<template>
    <div v-if="widgetHelpSettingsModel" class="p-ai-center kn-flex p-p-4">
        <div class="p-col-12 p-mb-3">
            {{ widgetHelpSettingsModel }}
        </div>

        <form class="p-fluid p-formgrid p-grid">
            <div class="p-field p-col-12">
                <span class="p-float-label">
                    <Dropdown v-model="widgetHelpSettingsModel.visualizationType" class="kn-material-input" :options="descriptor.visualizationTypes" option-value="value">
                        <template #value="slotProps">
                            <div>
                                <span>{{ getTranslatedLabel(slotProps.value, descriptor.visualizationTypes, $t) }}</span>
                            </div>
                        </template>
                        <template #option="slotProps">
                            <div>
                                <span>{{ $t(slotProps.option.label) }}</span>
                            </div>
                        </template>
                    </Dropdown>
                    <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.help.visualization') }}</label>
                </span>
            </div>

            <div class="p-field p-col-6 p-mt-3 p-mb-5">
                <WidgetEditorStyleToolbar :options="descriptor.styleToolbarSettings" :prop-model="toolbarModel" @change="onStyleToolbarChange"></WidgetEditorStyleToolbar>
            </div>

            <div class="p-field p-col-6 p-mt-2">
                <span class="p-float-label">
                    <Dropdown v-model="widgetHelpSettingsModel.iconPosition" class="kn-material-input" :options="descriptor.iconPositions" option-value="value">
                        <template #value="slotProps">
                            <div>
                                <span>{{ getTranslatedLabel(slotProps.value, descriptor.iconPositions, $t) }}</span>
                            </div>
                        </template>
                        <template #option="slotProps">
                            <div>
                                <span>{{ $t(slotProps.option.label) }}</span>
                            </div>
                        </template>
                    </Dropdown>
                    <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.help.iconPosition') }}</label>
                </span>
            </div>

            <div v-if="widgetHelpSettingsModel.visualizationType === 'pop-up'" class="p-field p-col-6 p-pb-3">
                <span class="p-float-label">
                    <InputText v-model="widgetHelpSettingsModel.popupWidth" class="kn-material-input p-inputtext-sm" />
                    <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.help.popupWidth') }}</label>
                </span>
            </div>

            <div v-if="widgetHelpSettingsModel.visualizationType === 'pop-up'" class="p-field p-col-6 p-pb-3">
                <span class="p-float-label">
                    <InputText v-model="widgetHelpSettingsModel.popupHeight" class="kn-material-input p-inputtext-sm" />
                    <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.help.popupHeight') }}</label>
                </span>
            </div>

            <div id="help-content-section" class="p-field p-col-12 p-pt-5">
                <span class="p-float-label">
                    <Dropdown v-model="widgetHelpSettingsModel.type" class="kn-material-input" :options="descriptor.types" option-value="value" @change="typeChanged">
                        <template #value="slotProps">
                            <div>
                                <span>{{ getTranslatedLabel(slotProps.value, descriptor.types, $t) }}</span>
                            </div>
                        </template>
                        <template #option="slotProps">
                            <div>
                                <span>{{ $t(slotProps.option.label) }}</span>
                            </div>
                        </template>
                    </Dropdown>
                    <label class="kn-material-input-label">{{ $t('common.type') }}</label>
                </span>
            </div>

            <div v-if="widgetHelpSettingsModel.type === 'free-text'" class="p-field p-col-12 q-pa-md q-gutter-sm">
                <label class="kn-material-input-label">{{ $t('common.text') }}</label>
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

            <div v-if="widgetHelpSettingsModel.type === 'link'" class="p-field p-col-12 p-mt-2">
                <span class="p-float-label">
                    <InputText v-model="widgetHelpSettingsModel.url" class="kn-material-input p-inputtext-sm" />
                    <label class="kn-material-input-label">{{ $t('common.url') }}</label>
                </span>
            </div>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetHelpSettings, IWidgetStyleToolbarModel } from '@/modules/documentExecution/Dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from './WidgetHelpSettingsDescriptor.json'
import Dropdown from 'primevue/dropdown'
import WidgetEditorColorPicker from '../WidgetEditorColorPicker.vue'
import WidgetEditorStyleToolbar from '../styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'widget-help-settings',
    components: { WidgetEditorColorPicker, Dropdown, WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true } },
    emits: [],
    data() {
        return {
            descriptor,
            widgetHelpSettingsModel: null as IWidgetHelpSettings | null,
            toolbarModel: { icon: '' } as { icon: string },
            getTranslatedLabel
        }
    },
    computed: {
        widgetHelpDisabled() {
            return !this.widgetHelpSettingsModel || !this.widgetHelpSettingsModel.enabled
        }
    },
    mounted() {
        this.loadWidgetHelpSettings()
    },
    unmounted() {},
    methods: {
        loadWidgetHelpSettings() {
            if (this.widgetModel?.settings?.help) this.widgetHelpSettingsModel = this.widgetModel.settings.help
            this.loadToolbarModel()
        },
        loadToolbarModel() {
            if (this.widgetHelpSettingsModel?.icon) this.toolbarModel.icon = this.widgetHelpSettingsModel.icon
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.widgetHelpSettingsModel || !this.widgetHelpSettingsModel.icon) return
            this.toolbarModel.icon = model.icon ?? ''
            this.widgetHelpSettingsModel.icon = model.icon ?? ''
        }
    }
})
</script>

<style lang="scss" scoped>
#help-content-section {
    border-top: 1px solid #c2c2c2;
}
</style>
