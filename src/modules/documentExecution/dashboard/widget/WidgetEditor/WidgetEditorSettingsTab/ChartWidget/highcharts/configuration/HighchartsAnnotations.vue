<template>
    <div v-if="annotations && annotations[0]" class="q-px-md q-pb-sm">
        <div v-for="(label, index) in annotations[0].labels" :key="index" class="row items-center q-col-gutter-sm q-mb-sm">
            <div class="col-3">
                <q-input v-model.number="label.point.x" type="number" label="X" outlined dense />
            </div>
            <div class="col-3">
                <q-input v-model.number="label.point.y" type="number" label="Y" outlined dense />
            </div>
            <div class="col">
                <q-input v-model="label.text" :label="$t('common.label')" outlined dense />
            </div>
            <div class="col-auto row items-center">
                <q-btn v-if="index === 0" flat round dense icon="add_circle_outline" size="sm" @click="addLabel()" />
                <q-btn v-if="index !== 0" flat round dense icon="delete" size="sm" @click="removeLabel(index)" />
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
            if (index === 0) {
                this.annotations[0].labels[0] = {
                    point: {
                        x: 0,
                        y: 0
                    },
                    text: ''
                }
            } else this.annotations[0].labels.splice(index, 1)
        }
    }
})
</script>
