<template>
    <div v-if="annotations && annotations[0]" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-col-12">
            {{ annotations }}
        </div>
        <div v-for="(label, index) in annotations[0].labels" :key="index" class="dynamic-form-item p-grid p-col-12 p-ai-center">
            <div class="p-col-12 p-md-3 p-d-flex p-flex-column">
                <label class="kn-material-input-label p-mr-2">{{ 'X' }}</label>
                <InputNumber v-model="label.point.x" class="kn-material-input p-inputtext-sm" />
            </div>
            <div class="p-col-12 p-md-3 p-d-flex p-flex-column">
                <label class="kn-material-input-label p-mr-2">{{ 'Y' }}</label>
                <InputNumber v-model="label.point.y" class="kn-material-input p-inputtext-sm" />
            </div>
            <div class="p-col-11 p-md-5 p-d-flex p-flex-column kn-flex">
                <label class="kn-material-input-label p-mr-2">{{ $t('common.label') }}</label>
                <InputText v-model="label.text" class="kn-material-input p-inputtext-sm" />
            </div>
            <div class="p-col-1 p-d-flex p-flex-row p-jc-around p-ai-center p-pl-2">
                <i v-if="index === 0" class="pi pi-plus-circle kn-cursor-pointer p-ml-2 p-mt-4" @click="addLabel()"></i>
                <i class="pi pi-trash kn-cursor-pointer p-ml-2 p-mt-4" @click="removeLabel(index)"></i>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsAnnotation } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import InputNumber from 'primevue/inputnumber'

export default defineComponent({
    name: 'highcharts-annotations',
    components: { InputNumber },
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
