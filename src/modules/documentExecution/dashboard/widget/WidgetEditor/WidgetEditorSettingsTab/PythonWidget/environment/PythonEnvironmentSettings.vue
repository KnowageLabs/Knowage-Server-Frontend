<template>
    <div class="p-grid p-ai-center p-p-4">
        <div class="p-col-8 p-d-flex p-flex-column">
            <label class="kn-material-input-label">{{ $t('common.environment') }}</label>
            <Dropdown v-model="selectedEnvironment" class="kn-material-input" :options="environments" option-label="label" option-value="label" @change="onEnvironmentSelected" />
        </div>

        <div class="p-col-12">
            <DataTable class="p-datatable-sm kn-table" :value="environmentLibraries" :paginator="environmentLibraries.length > 15" :rows="15" data-key="name" responsive-layout="stack" breakpoint="960px">
                <template #empty>
                    <div>
                        {{ $t('common.info.noDataFound') }}
                    </div>
                </template>
                <Column v-for="col of descriptor.columns" :key="col.field" class="kn-truncated" :style="col.style" :field="col.field" :header="$t(col.header)" :sortable="true"> </Column>
            </DataTable>
        </div>
    </div>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { IWidget } from '../../../../../Dashboard'
import { AxiosResponse } from 'axios'
import { mapActions } from 'pinia'
import appStore from '@/App.store'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dropdown from 'primevue/dropdown'
import descriptor from './PythonEnvironmentSettingsDescriptor.json'

export default defineComponent({
    name: 'python-environment-settings',
    components: { Column, DataTable, Dropdown },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            widget: null as IWidget | null,
            selectedEnvironment: null,
            environments: [] as any[],
            environmentLibraries: [] as { name: string; version: string }[]
        }
    },
    created() {
        this.loadWidget()
        this.loadEnvironments()
        this.loadSelectedEnvironment()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        loadWidget() {
            this.widget = this.widgetModel
        },
        loadSelectedEnvironment() {
            if (this.widget?.settings.editor) this.selectedEnvironment = this.widget.settings.editor.environment
            if (this.selectedEnvironment) this.onEnvironmentSelected()
        },
        async loadEnvironments() {
            this.setLoading(true)
            const configuration = this.widget?.type === 'r' ? 'R_CONFIGURATION' : 'PYTHON_CONFIGURATION'
            await this.$http
                .get(import.meta.env.VITE_RESTFUL_SERVICES_PATH + `2.0/configs/category/${configuration}`)
                .then((response: AxiosResponse<any>) => (this.environments = response.data))
                .catch(() => {})
            this.setLoading(false)
        },
        async onEnvironmentSelected() {
            if (this.widget?.settings.editor) this.widget.settings.editor = this.selectedEnvironment
            this.setLoading(true)
            const envUrlType = this.widget?.type === 'r' ? 'RWidget' : 'python'
            await this.$http
                .get(import.meta.env.VITE_RESTFUL_SERVICES_PATH + `2.0/backendservices/widgets/${envUrlType}/libraries/${this.selectedEnvironment}`)
                .then((response: AxiosResponse<any>) => (this.environmentLibraries = envUrlType === 'RWidget' && response.data.result ? this.getFormattedRLibraries(JSON.parse(response.data.result)) : JSON.parse(response.data.result)))
                .catch(() => {})
            this.setLoading(false)
        },
        getFormattedRLibraries(librariesFromBackend: string[][] | null) {
            if (!librariesFromBackend) return []
            const formattedLibraries = librariesFromBackend.map((tempLibrary: string[]) => {
                return { name: tempLibrary[0], version: tempLibrary[1] }
            })
            return formattedLibraries
        }
    }
})
</script>
