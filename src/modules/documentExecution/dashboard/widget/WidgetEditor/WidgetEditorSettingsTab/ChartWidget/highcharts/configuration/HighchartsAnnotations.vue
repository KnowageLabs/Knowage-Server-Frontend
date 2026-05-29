<template>
    <div v-if="annotations && annotations[0]" class="q-px-md q-pb-sm">
        <div class="row items-center justify-between q-mb-xs">
            <span class="text-subtitle2">{{ $t('common.labels') }}</span>
            <q-btn flat round dense color="primary" icon="add" @click="addLabel()" />
        </div>

        <div v-for="(label, index) in annotations[0].labels" :key="index" class="column-type-row row no-wrap q-mb-sm">
            <div class="kn-action-handle kn-action-handle-disabled"></div>
            <div class="col q-pa-sm">
                <div class="row q-col-gutter-sm">
                    <div class="col-3">
                        <q-input v-model.number="label.point.x" type="number" label="X" outlined dense />
                    </div>
                    <div class="col-3">
                        <q-input v-model.number="label.point.y" type="number" label="Y" outlined dense />
                    </div>
                    <div class="col">
                        <q-input v-model="label.text" :label="$t('common.label')" outlined dense />
                    </div>
                </div>
            </div>
            <div class="kn-action-handle row items-center justify-center">
                <q-btn flat round dense icon="delete" size="sm" @click="removeLabel(index)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsAnnotation } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
export default defineComponent({
    name: 'highcharts-annotations',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            annotations: [] as IHighchartsAnnotation[]
        }
    },
    created() {
        this.loadAnnotations()
    },
    methods: {
        loadAnnotations() {
            this.annotations = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model.annotations : null
        },
        addLabel() {
            this.annotations[0].labels.push({
                point: {
                    x: 0,
                    y: 0
                },
                text: ''
            })
        },
        removeLabel(index: number) {
            this.annotations[0].labels.splice(index, 1)
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
