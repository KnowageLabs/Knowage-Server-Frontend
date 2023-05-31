import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateBarChartModel } from './updater/KnowageChartJSUpdater'
import { KnowageChartJS } from './KnowageChartJS'
import deepcopy from 'deepcopy'

export class KnowageChartJSBarChart extends KnowageChartJS {
    constructor(model: any) {
        super()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model) this.model = deepcopy(model)
        this.model.chart.type = 'bar'
    }

    updateModel(oldModel: any) {
        updateBarChartModel(oldModel, this.model)
    }

    setData(data: any) {
        console.log('bar chart set data', data)
        this.model.data = {
            datasets: [
                {
                    backgroundColor: [],
                    data: []
                }
            ],
            labels: []
        }

        if (data && data.rows) {
            data.rows.forEach((row) => {
                this.model.data.labels.push(row['column_1'])
                this.model.data.datasets[0].data.push(row['column_2'])
            })
        }
        console.log('BAR DATA FINISH', this.model.data)
        return this.model.data
    }

    updateChartColorSettings(widgetModel: IWidget) {
        if (!this.model.data.datasets || !this.model.data.datasets[0]) return
        this.model.data.datasets[0].backgroundColor = widgetModel.settings.chart.colors
    }
}
