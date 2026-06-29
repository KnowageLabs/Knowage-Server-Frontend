<template>
    <div class="q-px-md q-pb-md row q-col-gutter-sm items-center">
        <q-select class="col" v-model="filteredDatasets" :options="datasetOptions" option-label="label" option-value="label" emit-value :label="$t('common.datasets')" :disable="!widgetModel.settings.configuration.filter.enabled" multiple outlined dense />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'selections-widget-filter',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, selectedDatasets: { type: Array as PropType<any[]>, required: false } },
    emits: [],
    data() {
        return {
            filteredDatasets: [] as string[]
        }
    },
    computed: {
        datasetOptions(): any[] {
            return this.selectedDatasets || []
        }
    },
    watch: {
        filteredDatasets: {
            handler(newVal) {
                if (!this.widgetModel?.settings?.configuration?.filter) return
                this.widgetModel.settings.configuration.filter.filteredDatasets = newVal
            },
            deep: true
        }
    },
    mounted() {
        if (this.widgetModel?.settings?.configuration?.filter?.filteredDatasets) {
            this.filteredDatasets = this.widgetModel.settings.configuration.filter.filteredDatasets
        }
    },
    unmounted() {},
    methods: {}
})
</script>
