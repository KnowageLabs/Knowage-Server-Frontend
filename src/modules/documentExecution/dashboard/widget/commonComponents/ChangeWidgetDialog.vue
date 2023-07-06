<template>
    <Dialog :visible="true" :modal="true" header="Change Widget Type" class="kn-dialog--toolbar--primary" :closable="false" style="width: 550px">
        <div class="p-grid gap-1 p-m-0 p-pt-4" style="column-gap: 0.5em; row-gap: 0.5em">
            <div
                v-for="(widgetType, index) in availableChartOptions"
                :key="index"
                v-tooltip.bottom="$t(widgetType.tooltip)"
                class="widgetTypeCards"
                :class="{ selected: selectedWidget === widgetType.name, starredChart: starredChartOptionsMap[widgetType.name] ?? false }"
                @click="selectWidget(widgetType.name)"
            >
                <img :src="getImageSource(widgetType.name)" />
            </div>
        </div>

        <template #footer>
            <Button class="kn-button kn-button--secondary" :label="$t('common.close')" @click="$emit('close')"></Button>
            <Button class="kn-button kn-button--primary" :label="$t('common.save')" @click="$emit('close')"></Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '../../Dashboard'
import Dialog from 'primevue/dialog'
import descriptor from './CommonComponentsDescriptor.json'

export default defineComponent({
    name: 'category-management-dialog',
    components: { Dialog },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, widgetData: { required: true, type: Object } },
    emits: ['close'],
    setup() {},
    data() {
        return {
            descriptor,
            selectedWidget: '',
            availableChartOptions: [] as { name: string; tooltip: string }[],
            numberOfCategories: 0,
            numberOfSeries: 9,
            starredChartOptionsMap: {} as any
        }
    },
    computed: {},
    watch: {},
    created() {
        console.log('------------ OPTIONS: ', descriptor.availableWidgets)
        this.loadData()
    },
    mounted() {},
    methods: {
        selectWidget(widgetName) {
            this.selectedWidget = widgetName
        },
        getImageSource(widgetType: string) {
            return `${import.meta.env.VITE_PUBLIC_PATH}images/dashboard/changeWidgetTypes/${widgetType}.png`
        },
        loadData() {
            this.getWidgetNumberOfCategoriesAndSeries()
            this.loadAvailableChartOptions()
            this.loadStarredChartsMap()
        },
        getWidgetNumberOfCategoriesAndSeries() {
            this.numberOfCategories = 0
            this.numberOfSeries = 0
            this.widgetModel.columns.forEach((column: IWidgetColumn) => {
                column.fieldType === 'ATTRIBUTE' ? this.numberOfCategories++ : this.numberOfSeries++
            })
        },
        loadAvailableChartOptions() {
            this.availableChartOptions = []
            console.log('-------- WIDGET MODEL: ', this.widgetModel)

            const seriesStacking = this.widgetModel.settings.chartModel?.model?.plotOptions?.series?.stacking ? true : false
            const groupedSeries = this.widgetModel.settings.configuration?.grouping ? this.widgetModel.settings.configuration.grouping.enabled || this.widgetModel.settings.configuration.grouping.secondSeries.enabled || this.widgetModel.settings.configuration.grouping.secondDimension.enabled : false

            const exactlyOneCategory = this.numberOfCategories === 1
            const exactlyTwoCategories = this.numberOfCategories === 2
            const exactlyOneSerie = this.numberOfSeries === 1
            const categoriesBetween1and100 = this.numberOfCategories >= 1 && this.numberOfCategories <= 100
            const seriesBetween1and100 = this.numberOfSeries >= 1 && this.numberOfSeries <= 100
            descriptor.availableWidgets.forEach((chartOption: { name: string; tooltip: string }) => {
                if (
                    (['scatter', 'radar'].includes(chartOption.name) && exactlyOneCategory && seriesBetween1and100 && !seriesStacking && !groupedSeries) ||
                    (chartOption.name === 'bubble' && categoriesBetween1and100 && this.numberOfSeries >= 3 && this.numberOfSeries <= 100 && !seriesStacking) ||
                    (['line', 'bar', 'area'].includes(chartOption.name) && categoriesBetween1and100 && seriesBetween1and100) ||
                    (chartOption.name === 'parallel' && exactlyOneCategory && this.numberOfSeries >= 2 && this.numberOfSeries <= 100 && !seriesStacking && !groupedSeries) ||
                    (chartOption.name === 'chord' && exactlyTwoCategories && exactlyOneSerie && !seriesStacking && !groupedSeries) ||
                    (['sunburst', 'tree'].includes(chartOption.name) && this.numberOfCategories >= 2 && this.numberOfCategories <= 100 && exactlyOneSerie && !seriesStacking && !groupedSeries) ||
                    (chartOption.name === 'pie' && categoriesBetween1and100 && exactlyOneSerie && !seriesStacking && !groupedSeries) ||
                    (['gauge', 'solidgauge', 'activitygauge'].includes(chartOption.name) && this.numberOfCategories === 0 && seriesBetween1and100 && !seriesStacking && !groupedSeries) ||
                    (chartOption.name === 'heatmap' && exactlyTwoCategories && exactlyOneSerie && !seriesStacking && !groupedSeries) ||
                    (chartOption.name === 'wordcloud' && exactlyOneCategory && exactlyOneSerie && !seriesStacking && !groupedSeries)
                )
                    this.availableChartOptions.push(chartOption)
            })
            console.log('-------- availableChartOptions', this.availableChartOptions)
        },
        loadStarredChartsMap() {
            this.starredChartOptionsMap = {}
            descriptor.availableWidgets.forEach((chartOption: { name: string; tooltip: string }) => {
                this.starredChartOptionsMap[chartOption.name] = true
            })
            console.log('-------- starredChartOptionsMap', this.starredChartOptionsMap)
        }
    }
})
</script>
<style lang="scss">
.widgetTypeCards {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 1px solid #cccccc;
    height: 80px;
    width: 80px;
    &.selected {
        background-color: #bbd6ed;
    }
    &.starredChart {
        border: 1px solid red;
    }
    &:hover {
        background-color: darken(#bbd6ed, 15%);
    }
    &:hover,
    &.selected {
        .visTypeIcon {
            background-color: #deecf8;
        }
    }
    img {
        height: 80%;
        width: 80%;
    }
}
</style>
