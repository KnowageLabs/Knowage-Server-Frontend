<template>
    <div>
        <div class="row q-gutter-md">
            <q-select class="col-12" filled v-model="model" :options="options" use-input input-debounce="0" bottom-slots new-value-mode="add" :label="$t('dashboard.widgetEditor.libraries.select')" @new-value="addLibrary" @update:model-value="addLibrary" >
                <template v-slot:hint>
                    {{ $t('dashboard.widgetEditor.libraries.hint') }}
                </template>
            </q-select>

            <q-list v-if="selectedLibraries.length !== 0" class="col-12 q-mt-sm" bordered separator>
                <q-item v-for="(library, index) in selectedLibraries" :key="index" clickable v-ripple>
                    <q-item-section avatar>
                        <q-img :id="'library-image_' + library" class="library-image" :src="getLibraryIcon(library)" spinner-color="grey-5">
                            <template v-slot:error>
                                <img class="library-image" :src="getDefaultLibraryIcon()"></img>
                            </template>
                        </q-img>
                    </q-item-section>

                    <q-item-section>
                        {{ library }}
                    </q-item-section>

                    <q-item-section side>
                        <q-btn class="library-delete-icon" flat dense round icon="fa fa-trash" @click.stop="removeLibrary(index)" />
                    </q-item-section>
                </q-item>
            </q-list>

            <div v-else class="row p-lg-12">
                <q-banner rounded class="bg-info col">
                    <template v-slot:avatar>
                        <q-icon name="info" />
                    </template>
                    {{ $t('dashboard.widgetEditor.libraries.hint') }}
                </q-banner>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { AxiosResponse } from 'axios'
import dashStore from '../../../../../Dashboard.store'

export default defineComponent({
    name: 'custom-chart-libraries-list',
    components: {},
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        dashboardId: { type: String, required: true }
    },
    emits: [],
    setup() {
        const dashboardStore = dashStore()
        return { dashboardStore }
    },
    data() {
        return {
            model: null as string | null,
            options: [] as string[],
            selectedLibraries: [] as string[]
        }
    },
    created() {
        this.loadData()
    },
    methods: {
        async loadData() {
            this.loadSelectedLibraries()
            await this.loadLibraryOptions()
        },
        loadSelectedLibraries() {
            if (!this.widgetModel.settings.configuration?.libraries) this.widgetModel.settings.configuration.libraries = []
            this.selectedLibraries = this.widgetModel.settings.configuration.libraries
        },
        async loadLibraryOptions() {
            await this.loadLibraryOptionsFromTheBEWhitelist()
            this.selectedLibraries.forEach((library: string) => {
                if (!this.options.includes(library.trim())) this.options.push(library.trim())
            })
            this.loadLibraryOptionsFromOtherCustomChartWidget()
        },
        async loadLibraryOptionsFromTheBEWhitelist() {
            let libraries = [] as string[]
            // TODO - Uncomment whhen the BE service is ready, maybe move it to DashboradController and put it in store?
            // await this.$http
            //     .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/libraries`)
            //     .then((response: AxiosResponse<any>) => (libraries = response.data))
            //     .catch(() => {})
            libraries.forEach((library: string) => {
                if (!this.options.includes(library.trim())) this.options.push(library.trim())
            })
        },
        loadLibraryOptionsFromOtherCustomChartWidget() {
            const widgets = this.dashboardStore.$state.dashboards[this.dashboardId]?.widgets ?? []

            widgets.forEach((widget: IWidget) => {
                if (widget.type !== 'customchart') return
                widget.settings.configuration?.libraries?.forEach((library: string) => {
                    if (!this.options.includes(library.trim())) this.options.push(library.trim())
                })
            })
        },
        addLibrary(newLibrary: string) {
            if (!newLibrary) return
            const newLibraryFormatted = newLibrary.trim()
            if (!this.options.includes(newLibraryFormatted)) this.options.push(newLibraryFormatted)
            if (!this.selectedLibraries.includes(newLibraryFormatted)) this.selectedLibraries.push(newLibraryFormatted)

            this.model = null
        },
        removeLibrary(index: number) {
            this.selectedLibraries.splice(index, 1)

            this.model = null
        },
        getLibraryIcon(library: string) {
            const root = this.getRootUrl(library)
            return root ? root + 'favicon.ico' : ''
        },
        getRootUrl(url: string) {
            try {
                const parsed = new URL(url)
                return `${parsed.origin}/`
            } catch (e) {
                return null
            }
        },
        getDefaultLibraryIcon() {
            return import.meta.env.VITE_PUBLIC_PATH + 'images/dashboard/customChart/cdn-48.ico'
        }
    }
})
</script>

<style lang="scss" scoped>
.library-image {
    width: 32px;
    height: 32px;
    min-height: 32px;
    min-width: 32px;
}

.library-delete-icon {
    font-size: 0.8rem;
}
</style>
