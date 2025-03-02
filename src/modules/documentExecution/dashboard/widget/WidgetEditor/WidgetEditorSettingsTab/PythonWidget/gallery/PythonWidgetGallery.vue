<template>
    <div v-if="widgetModel" class="dashboard-editor-list-card-container kn-flex p-m-3">
        <div class="gallery-inputs p-d-flex p-flex-row p-ai-center p-flex-wrap p-mt-4 p-ml-4">
            <InputText v-model="searchWord" class="kn-material-input p-mr-2 model-search" :style="galleryDescriptor.style.filterInput" type="text" :placeholder="$t('common.search')" data-test="search-input" @input="searchItems" />
        </div>

        <MasonryWall class="p-mx-4 p-my-2 kn-flex kn-overflow dashboard-scrollbar" :items="filteredChartTypes" :column-width="200" :gap="6">
            <template #default="{ chart, index }">
                <div class="gallery-card kn-cursor-pointer" :class="{ 'gallery-card-disabled': filteredChartTypes[index].disabled }" :style="(galleryDescriptor.style.galleryCard as any)" @click="onChange(filteredChartTypes[index])">
                    <label class="kn-material-input-label p-ml-2 p-mt-1">{{ $t(`${filteredChartTypes[index].label}`) }}</label>
                    <img :src="getImageSource(filteredChartTypes[index].value)" />
                </div>
            </template>
        </MasonryWall>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import MasonryWall from '@yeger/vue-masonry-wall'

export default defineComponent({
    name: 'python-widget-gallery',
    components: { MasonryWall },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    emits: ['selectedChartTypeChanged'],
    data() {
        return {
            galleryDescriptor,
            selectedType: '',
            searchWord: '',
            chartTypes: [] as any[],
            filteredChartTypes: [] as any[]
        }
    },
    async created() {
        this.loadSelectedType()
    },
    methods: {
        loadSelectedType() {
            const chartModel = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            this.filteredChartTypes = [...this.chartTypes] as IChartType[]
            if (chartModel?.chart.type) {
                this.selectedType = chartModel.chart.type
            }
        },
        onChange(chartType: any) {
            if (chartType.disabled) return
            this.selectedType = chartType.value
            this.$emit('selectedChartTypeChanged', this.selectedType)
        },
        searchItems() {
            setTimeout(() => {
                if (!this.searchWord.trim().length) {
                    this.filteredChartTypes = [...this.chartTypes] as any[]
                } else {
                    this.filteredChartTypes = this.filteredChartTypes.filter((icon: any) => {
                        return icon.label?.toLowerCase().includes(this.searchWord.toLowerCase())
                    })
                }
            }, 250)
        },
        getImageSource(chartValue: string) {
            return `${import.meta.env.VITE_PUBLIC_PATH}images/dashboard/chartTypes/${chartValue}.png`
        }
    }
})
</script>
<style lang="scss" scoped>
.gallery-card {
    height: 200px;
    width: 200px;
}
.gallery-card:hover {
    border-color: #43749e !important;
}
</style>
