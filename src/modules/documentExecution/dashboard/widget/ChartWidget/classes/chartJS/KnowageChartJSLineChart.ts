import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateBarChartModel } from './updater/KnowageChartJSUpdater'
import { KnowageChartJS } from './KnowageChartJS'
import deepcopy from 'deepcopy'

export class KnowageChartJSLineChart extends KnowageChartJS {
    constructor(model: any) {
        super()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model) this.model = deepcopy(model)
        this.model.chart.type = 'line'
    }

    updateModel(oldModel: any) {
        updateBarChartModel(oldModel, this.model)
    }

    setData(data: any) {
        this.model.data = { datasets: [], labels: [] }

        if (data && data.rows) {
            //Always take 1st category, there is no drilldown so taking more doesnt make sense
            this.model.data.labels = data.stats[1].distinct

            //Skip ID and Category field and take all measures
            data.metaData.fields.forEach((field) => {
                if (typeof field === 'object' && field.name !== 'column_1') {
                    const dataset = { label: field.header, data: data.rows.map((row) => row[field.dataIndex]) }
                    this.model.data.datasets.push(dataset)
                }
            })
        }

        return this.model.data
    }

    updateChartColorSettings(widgetModel: IWidget) {
        if (!this.model.data.datasets || this.model.data.datasets.length == 0) return
        this.model.data.datasets.forEach((dataset, index) => {
            dataset.backgroundColor = widgetModel.settings.chart.colors[index]
            dataset.borderColor = widgetModel.settings.chart.colors[index]
        })
    }
}
