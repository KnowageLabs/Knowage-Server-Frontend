<template>
    <div v-if="widgetModel" class="dashboard-editor-list-card-container kn-flex p-m-3">
        <div class="gallery-inputs p-d-flex p-flex-row p-ai-center p-flex-wrap p-mt-4 p-ml-4">
            <InputText v-model="searchWord" class="kn-material-input p-mr-2 model-search" :style="galleryDescriptor.style.filterInput" type="text" :placeholder="$t('common.search')" data-test="search-input" @input="searchItems" />
        </div>

        <MasonryWall class="scroll q-pa-md" :items="filteredChartTypes" :column-width="200" :gap="6">
            <template #default="{ chart, index }">
                <div class="gallery-card kn-cursor-pointer relative-position" :class="{ 'gallery-card-disabled': filteredChartTypes[index].disabled || (filteredChartTypes[index].eeOnly && !isEnterprise) }" :style="(galleryDescriptor.style.galleryCard as any)" @click="onChange(filteredChartTypes[index])">
                    <q-badge v-if="filteredChartTypes[index].eeOnly && !isEnterprise" color="accent" floating>
                        EE
                        <q-tooltip :delay="500">{{ $t('dashboard.widgets.eeOnly') }}</q-tooltip>
                    </q-badge>
                    <label class="kn-material-input-label">{{ $t(`${filteredChartTypes[index].label}`) }}</label>
                    <img :src="getImageSource(filteredChartTypes[index].value)" />
                </div>
            </template>
        </MasonryWall>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IChartType } from '@/modules/documentExecution/dashboard/Dashboard'
import galleryDescriptor from './ChartWidgetGalleryDescriptor.json'
import commonDescriptor from '../../common/WidgetCommonDescriptor.json'
import MasonryWall from '@yeger/vue-masonry-wall'
import { mapState } from 'pinia'
import mainStore from '@/App.store'

export default defineComponent({
    name: 'chart-widget-gallery',
    components: { MasonryWall },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    emits: ['selectedChartTypeChanged'],
    data() {
        return {
            galleryDescriptor,
            commonDescriptor,
            selectedType: '',
            searchWord: '',
            chartTypes: commonDescriptor.chartTypeOptions as IChartType[],
            filteredChartTypes: [] as IChartType[]
        }
    },
    async created() {
        this.loadSelectedType()
    },
    computed: {
        ...mapState(mainStore, ['isEnterprise'])
    },
    methods: {
        loadSelectedType() {
            const chartModel = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            this.filteredChartTypes = [...this.chartTypes] as IChartType[]
            if (chartModel?.chart.type) {
                this.selectedType = chartModel.chart.type
            }
        },
        onChange(chartType: IChartType) {
            if (chartType.disabled || (chartType.eeOnly && !this.isEnterprise)) return
            this.selectedType = chartType.value
            this.$emit('selectedChartTypeChanged', this.selectedType)
        },
        searchItems() {
            setTimeout(() => {
                if (!this.searchWord.trim().length) {
                    this.filteredChartTypes = [...this.chartTypes] as IChartType[]
                } else {
                    this.filteredChartTypes = this.filteredChartTypes.filter((icon: IChartType) => {
                        return icon.label?.toLowerCase().includes(this.searchWord.toLowerCase())
                    })
                }
            }, 250)
        },
        getImageSource(chartValue: string) {
            return `${import.meta.env.VITE_PUBLIC_PATH}images/dashboard/chartTypes/${chartValue}.svg`
        }
    }
})
</script>
<style lang="scss" scoped>
.gallery-card {
    height: 180px;
    width: 180px;
    .kn-material-input-label {
        font-size: 1.2rem;
        text-align: center;
    }
    img {
        max-height: 160px;
        filter: hue-rotate(196deg);
    }
    &.gallery-card-disabled {
        cursor: default;
        background-color: #dcdcdc;
        img {
            opacity: 0.5;
        }
    }
}
.gallery-card:not(.gallery-card-disabled):hover {
    border-color: #43749e !important;
    background-color: var(--kn-color-secondary);
    opacity: 0.8;
}
</style>
