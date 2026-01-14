<template>
    <div class="p-d-flex kn-flex p-p-2">
        <q-toggle v-model="widgetModel.settings.configuration.filter.enabled" :label="$t('common.enabled')" color="black" />
        <q-select class="p-ml-4 kn-flex" v-model="filteredDatasets" :options="datasetOptions" option-label="label" option-value="label" emit-value :label="$t('common.datasets')" :disable="!widgetModel.settings.configuration.filter.enabled" multiple dense />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../../WidgetEditorSettingsTabDescriptor.json'
import Dropdown from 'primevue/dropdown'
import WidgetEditorColorPicker from '../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'widget-shadows-style',
    components: { Dropdown, WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, selectedDatasets: { type: Array as PropType<any[]>, required: false } },
    emits: [],
    data() {
        return {
            descriptor,
            widgetType: '' as string,
            getTranslatedLabel,
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

<style lang="scss" scoped>
#padding-left-container {
    max-width: 300px;
}
</style>
