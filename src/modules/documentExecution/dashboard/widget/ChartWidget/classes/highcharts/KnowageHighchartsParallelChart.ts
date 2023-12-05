import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateParallelChartModel } from './updater/KnowageHighchartsParallelChartUpdater'
import { getAllColumnsOfSpecificTypeFromDataResponse, getFormattedDateCategoryValue } from './helpers/setData/HighchartsSetDataHelpers'
import deepcopy from 'deepcopy'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'

export class KnowageHighchartsParallelChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'spline') {
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'spline'
        if (!this.model.annotations) this.model.annotations = highchartsDefaultValues.getDefaultAnnotations()
    }

    updateModel(oldModel: any) {
        updateParallelChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        this.setParallelXAxis()
        this.setParallelYAxis()
    }

    setParallelXAxis() {
        if (this.model.xAxis && this.model.xAxis[0]) this.model.xAxis[0] = highchartsDefaultValues.getDefaultBarXAxis()
        else this.model.xAxis = [highchartsDefaultValues.getDefaultBarXAxis()]
    }

    setParallelYAxis() {
        if (this.model.yAxis && this.model.yAxis[0]) this.model.yAxis[0].visible = [highchartsDefaultValues.getDefaultBarYAxis()]
        else this.model.yAxis = [highchartsDefaultValues.getDefaultBarYAxis()]
    }

    setData(data: any, widgetModel: IWidget) {
        this.model.series = []

        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        this.setParallelData(data, attributeColumns, measureColumns, dateFormat)
        return this.model.series
    }

    setParallelData = (data: any, attributeColumns: any[], measureColumns: any[], dateFormat: string) => {
        if (!data || measureColumns.length < 2 || !attributeColumns[0]) return

        this.setDataForXAxis(measureColumns)
        this.setDataForYAxis(measureColumns)

        data.rows.forEach((row: any, index: number) => {
            const serieName = dateFormat && ['date', 'timestamp'].includes(row[attributeColumns[0].metadata.type]) ? getFormattedDateCategoryValue(row[attributeColumns[0].metadata.dataIndex], dateFormat, attributeColumns[0].metadata.type) : row[attributeColumns[0].metadata.dataIndex]
            const serieElement = { id: index, name: serieName, data: [] as any[], showInLegend: true }
            measureColumns.forEach((measureColumn: any) => serieElement.data.push(row[measureColumn.metadata.dataIndex]))
            this.model.series.push(serieElement)
        })
    }

    setDataForXAxis(measureColumns: any[]) {
        if (this.model.xAxis.length > 1) this.model.xAxis.splice(1)
        const categories = [] as string[]
        measureColumns.forEach((measureColumn: any) => categories.push(measureColumn.column.columnName))
        this.model.xAxis[0].categories = categories
        this.model.xAxis[0].offset = 10
    }

    setDataForYAxis(measureColumns: any[]) {
        if (this.model.yAxis.length > 1) this.model.yAxis.splice(1)
        for (let i = 0; i < measureColumns.length - 1; i++) {
            this.model.yAxis.push({ index: i })
        }
    }
}
