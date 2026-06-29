<template>
    <div v-if="model && model.yAxis && model.yAxis[0]" class="q-px-md q-pb-sm">
        <div class="row no-wrap items-start q-mb-sm">
            <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.highcharts.stops.stopsHint') }}</span>
            <q-btn flat round dense color="primary" icon="add" @click="addStop()" />
        </div>

        <div v-for="(stop, index) in model.yAxis[0].stops" :key="index" class="column-type-row row no-wrap q-mb-sm">
            <div class="kn-action-handle kn-action-handle-disabled"></div>
            <div class="col q-pa-sm">
                <div class="row q-col-gutter-sm">
                    <div class="col-6">
                        <q-input v-model.number="stop[0]" type="number" :label="$t('dashboard.widgetEditor.highcharts.stops.relativePosition')" outlined dense step="0.01" min="0" max="1" @blur="onRelativePositionChange">
                            <template #append>
                                <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                                    <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.stops.relativePositionHint') }}</q-tooltip>
                                </q-icon>
                            </template>
                        </q-input>
                    </div>
                    <div class="col-6">
                        <WidgetEditorColorPicker :initial-value="stop[1]" :label="$t('common.color')" @change="onSelectionColorChanged($event, stop)" />
                    </div>
                </div>
            </div>
            <div class="kn-action-handle row items-center justify-center">
                <q-btn flat round dense icon="delete" size="sm" @click="deleteStop(index)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartModel } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import descriptor from '../../HighchartsWidgetSettingsDescriptor.json'
import WidgetEditorColorPicker from '../../../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'hihgcharts-stops-settings',
    components: { WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            model: null as IHighchartsChartModel | null
        }
    },
    computed: {},
    created() {
        this.loadModel()
    },

    methods: {
        loadModel() {
            this.model = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        },
        onRelativePositionChange() {
            setTimeout(() => this.modelChanged(), 250)
        },
        onSelectionColorChanged(event: string | null, stop: [number, string]) {
            if (!event) return
            stop[1] = event
            this.modelChanged()
        },
        addStop() {
            if (!this.model) return
            if (!this.model.yAxis[0].stops) this.model.yAxis[0].stops = []
            this.model.yAxis[0].stops.push([0, 'rgba(0, 0, 0, 1)'])
        },
        deleteStop(index: number) {
            if (!this.model) return
            this.model.yAxis[0].stops.splice(index, 1)
            if (this.model.yAxis[0].stops.length === 0) this.model.yAxis[0].stops = null
            this.modelChanged()
        }
    }
})
</script>

<style lang="scss" scoped>
.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
