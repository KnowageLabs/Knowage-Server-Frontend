<template>
    <div v-if="widgetHelpSettingsModel" class="p-ai-center kn-flex p-p-4">
        <div class="p-col-12 p-mb-3">
            {{ widgetHelpSettingsModel }}
        </div>

        <form class="p-fluid p-formgrid p-grid">
            <div class="p-field p-col-6 p-d-flex p-flex-column">
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

            <div class="p-field p-col-12 q-pa-md q-gutter-sm">
                <label class="kn-material-input-label">{{ $t('common.text') }}</label>
                <q-editor v-model="widgetHelpSettingsModel.text" min-height="5rem" />
            </div>

            <div class="p-field p-col-12">
                <span class="p-float-label">
                    <InputText v-model="widgetHelpSettingsModel.url" class="kn-material-input p-inputtext-sm" />
                    <label class="kn-material-input-label">{{ $t('common.url') }}</label>
                </span>
            </div>

            <div class="p-field p-col-12">
                <span class="p-float-label">
                    <Dropdown v-model="widgetHelpSettingsModel.visualizationType" class="kn-material-input" :options="descriptor.visualizationTypes" option-value="value" @change="typeChanged">
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

            <div class="p-field p-col-12 p-mt-3 p-mb-5">
                <WidgetEditorStyleToolbar :options="descriptor.styleToolbarSettings" :prop-model="toolbarModel" @change="onStyleToolbarChange"></WidgetEditorStyleToolbar>
            </div>

            <div class="p-field p-col-12">
                <span class="p-float-label">
                    <Dropdown v-model="widgetHelpSettingsModel.iconPosition" class="kn-material-input" :options="descriptor.iconPositions" option-value="value" @change="typeChanged">
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

            <div class="p-field p-col-6">
                <span class="p-float-label">
                    <InputNumber v-model="widgetHelpSettingsModel.popupWidth" class="kn-material-input p-inputtext-sm" />
                    <label class="kn-material-input-label">{{ $t('common.width') }}</label>
                </span>
            </div>

            <div class="p-field p-col-6">
                <span class="p-float-label">
                    <InputNumber v-model="widgetHelpSettingsModel.popupHeight" class="kn-material-input p-inputtext-sm" />
                    <label class="kn-material-input-label">{{ $t('common.height') }}</label>
                </span>
            </div>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetHelpSettings, IWidgetStyleToolbarModel } from '@/modules/documentExecution/Dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import descriptor from './WidgetHelpSettingsDescriptor.json'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import WidgetEditorColorPicker from '../WidgetEditorColorPicker.vue'
import WidgetEditorStyleToolbar from '../styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'widget-help-settings',
    components: { WidgetEditorColorPicker, Dropdown, InputNumber, WidgetEditorStyleToolbar },
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
        typeChanged() {
            console.log('------- typeChanged!')
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.widgetHelpSettingsModel || !this.widgetHelpSettingsModel.icon) return
            this.toolbarModel.icon = model.icon ?? ''
            this.widgetHelpSettingsModel.icon = model.icon ?? ''
        }
    }
})
</script>
