<template>
    <div v-if="model" class="q-px-md q-pb-sm">
        <div v-if="model.lang" class="row q-mb-sm">
            <div class="col-12">
                <q-input v-model="model.lang.noData" :label="$t('common.message')" type="textarea" outlined dense autogrow maxlength="250" @change="modelChanged" />
            </div>
        </div>
        <div v-if="model.noData?.position" class="row q-col-gutter-sm">
            <div class="col-6">
                <q-select v-model="model.noData.position.align" :label="$t('common.align')" emit-value map-options outlined dense :options="descriptor.alignmentOptions" option-value="value" option-label="label" @update:model-value="modelChanged">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.alignmentOptions, $t) }}</span>
                    </template>
                    <template #option="slotProps">
                        <q-item v-bind="slotProps.itemProps">
                            <q-item-section
                                ><q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label></q-item-section
                            >
                        </q-item>
                    </template>
                </q-select>
            </div>
            <div class="col-6">
                <q-select v-model="model.noData.position.verticalAlign" :label="$t('common.verticalAlign')" emit-value map-options outlined dense :options="descriptor.verticalAlignmentOptions" option-value="value" option-label="label" @update:model-value="modelChanged">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.verticalAlignmentOptions, $t) }}</span>
                    </template>
                    <template #option="slotProps">
                        <q-item v-bind="slotProps.itemProps">
                            <q-item-section
                                ><q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label></q-item-section
                            >
                        </q-item>
                    </template>
                </q-select>
            </div>
        </div>
        <div class="col-12 q-py-sm">
            <WidgetEditorStyleToolbar :options="descriptor.noDataToolbarStyleOptions" :prop-model="toolbarModel" @change="onStyleToolbarChange" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel } from '../../../../../../Dashboard'
import { IHighchartsChartModel } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../HighchartsWidgetSettingsDescriptor.json'
import WidgetEditorStyleToolbar from '../../../common/styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'hihgcharts-no-data-message-configuration',
    components: { WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            model: null as IHighchartsChartModel | null,
            toolbarModel: {} as { 'font-family': string; 'font-size': string; 'font-weight': string; color: string; 'background-color': string },
            getTranslatedLabel
        }
    },
    computed: {},
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            if (this.model && this.model.noData)
                this.toolbarModel = {
                    'font-family': this.model.noData.style.fontFamily,
                    'font-size': this.model.noData.style.fontSize,
                    'font-weight': this.model.noData.style.fontWeight,
                    color: this.model.noData.style.color,
                    'background-color': this.model.noData.style.backgroundColor
                }
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.model || !this.model.noData.style) return
            this.toolbarModel = {
                'font-family': model['font-family'] ?? '',
                'font-size': model['font-size'] ?? '14px',
                'font-weight': model['font-weight'] ?? '',
                color: model.color ?? '',
                'background-color': model['background-color'] ?? ''
            }
            this.model.noData.style = {
                backgroundColor: this.toolbarModel['background-color'] ?? '',
                color: this.toolbarModel.color ?? '',
                fontSize: this.toolbarModel['font-size'] ?? '14px',
                fontFamily: this.toolbarModel['font-family'] ?? '',
                fontWeight: this.toolbarModel['font-weight'] ?? ''
            }

            this.modelChanged()
        }
    }
})
</script>
