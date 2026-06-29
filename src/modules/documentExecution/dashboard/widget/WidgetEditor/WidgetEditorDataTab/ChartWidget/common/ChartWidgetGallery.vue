<template>
    <div v-if="widgetModel" class="dashboard-editor-list-card-container kn-flex column">
        <div class="q-px-md q-pt-md">
            <q-input v-model="searchWord" outlined dense clearable :placeholder="$t('common.search')" data-test="search-input" @update:model-value="searchItems">
                <template #prepend><q-icon name="search" /></template>
            </q-input>
        </div>

        <div class="chart-gallery-grid q-pa-md">
            <q-card v-for="(chart, index) in filteredChartTypes" :key="index" class="gallery-card relative-position" :class="{ 'gallery-card-disabled': chart.disabled || (chart.eeOnly && !isEnterprise), 'gallery-card-selected': selectedType === chart.value }" flat bordered @click="onChange(chart)">
                <q-badge v-if="chart.eeOnly && !isEnterprise" color="accent" floating>
                    EE
                    <q-tooltip :delay="500">{{ $t('dashboard.widgets.eeOnly') }}</q-tooltip>
                </q-badge>
                <q-card-section class="column items-center q-pa-sm">
                    <img :src="getImageSource(chart.value)" class="gallery-img" />
                    <span class="gallery-label q-mt-xs">{{ $t(chart.label) }}</span>
                </q-card-section>
            </q-card>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IChartType } from '@/modules/documentExecution/dashboard/Dashboard'
import commonDescriptor from '../../common/WidgetCommonDescriptor.json'
import { mapState } from 'pinia'
import mainStore from '@/App.store'

export default defineComponent({
    name: 'chart-widget-gallery',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    emits: ['selectedChartTypeChanged'],
    data() {
        return {
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
                if (!this.searchWord?.trim().length) {
                    this.filteredChartTypes = [...this.chartTypes] as IChartType[]
                } else {
                    this.filteredChartTypes = this.chartTypes.filter((icon: IChartType) => {
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
.chart-gallery-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    overflow-y: auto;
}

.gallery-card {
    width: 150px;
    cursor: pointer;
    transition:
        border-color 0.2s ease,
        background-color 0.2s ease;
    border-radius: 8px !important;

    &.gallery-card-selected {
        border-color: var(--q-primary) !important;
        background-color: rgba(67, 116, 158, 0.08);
    }

    &.gallery-card-disabled {
        cursor: default;
        background-color: #f0f0f0;

        .gallery-img {
            opacity: 0.4;
        }
    }

    &:not(.gallery-card-disabled):hover {
        border-color: #43749e !important;
        background-color: rgba(67, 116, 158, 0.06);
    }
}

.gallery-img {
    height: 90px;
    width: 100%;
    object-fit: contain;
    filter: hue-rotate(196deg);
}

.gallery-label {
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    text-align: center;
    line-height: 1.3;
    color: var(--kn-color-default);
}
</style>
