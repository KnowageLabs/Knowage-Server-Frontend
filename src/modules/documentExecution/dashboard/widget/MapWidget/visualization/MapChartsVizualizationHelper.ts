import { ISelection, IVariable, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { getColumnName, getCoordinates, LEGEND_DATA_TYPE } from '../LeafletHelper'
import { addDialogToMarker, addDialogToMarkerForLayerData, addTooltipToMarker, addTooltipToMarkerForLayerData } from './MapDialogHelper'
import { getChartConditionalStyle, getCoordinatesFromWktPointFeature, isConditionMet, transformDataUsingForeignKeyReturningAllColumns } from './MapVisualizationHelper'
import L from 'leaflet'
import ChartJS from 'chart.js/auto'

interface IChartValuesRecord {
    value: number | string
    measureName: string
}

export type ChartValuesRecord = Record<string, IChartValuesRecord>

export const addMapCharts = (data: any, model: IWidget, target: IMapWidgetLayer, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], layersData: any, targetDatasetData: any, variables: IVariable[], activeSelections: ISelection[], dashboardId: string) => {
    if (data && data[target.id] && !targetDatasetData) {
        return addMapChartsUsingData(data, model, target, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, variables, activeSelections, dashboardId)
    } else {
        return addMapChartsUsingLayer(layersData, layerGroup, layerVisualizationSettings, markerBounds, model, variables, activeSelections, dashboardId, targetDatasetData)
    }
}

const addMapChartsUsingData = (data: any, model: IWidget, target: IMapWidgetLayer, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], variables: IVariable[], activeSelections: ISelection[], dashboardId: string) => {
    const charts = [] as any[]
    const fieldMetadata = getFieldMapFromMetadata(data[target.id])

    const id = 'id-' + performance.now().toString(36) + Math.random().toString(36)
    for (const row of data[target.id].rows) {
        const chartValuesRecord = {} as ChartValuesRecord

        layerVisualizationSettings.chartMeasures?.forEach((chartMeasure: string) => {
            const value = row[fieldMetadata[chartMeasure]]
            chartValuesRecord[chartMeasure] = { value: value, measureName: chartMeasure }
        })

        const customIcon = L.divIcon({
            html: `<div id='${id}'></div>`,
            iconSize: [30, 30],
            iconAnchor: [30, 30],
            className: 'custom-icon'
        })
        const marker = L.marker(getCoordinates(spatialAttribute, row[geoColumn]), { icon: customIcon }).addTo(layerGroup)

        const chart = createChart(chartValuesRecord, layerVisualizationSettings, marker._icon, variables, model)
        charts.push(chart)

        addDialogToMarker(data, model, target, layerVisualizationSettings, row, marker, activeSelections, dashboardId, variables)
        addTooltipToMarker(data, model, target, layerVisualizationSettings, row, marker, activeSelections, dashboardId, variables)
        markerBounds.push(marker.getLatLng())
    }

    return { charts: charts, type: LEGEND_DATA_TYPE.CHARTS }
}

const getFieldMapFromMetadata = (data: any) => {
    return Object.fromEntries(data.metaData?.fields?.filter((field: any) => typeof field === 'object' && field.header && field.name).map((field: any) => [field.header, field.name]))
}

const addMapChartsUsingLayer = (layersData: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, variables: IVariable[], activeSelections: ISelection[], dashboardId: string, targetDatasetData?: any) => {
    let mappedData: Record<string, number> | null = null
    let fieldMetadata: Record<string, string> | null = null
    const charts = [] as any[]

    if (targetDatasetData) {
        if (!layerVisualizationSettings.targetDataset) return

        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetDatasetForeignKeyColumn, targetDatasetData)
        if (!foreignKeyColumnName) throw Error(`Foreign key column ${layerVisualizationSettings.targetDatasetForeignKeyColumn} is not present in the dataset`)

        mappedData = transformDataUsingForeignKeyReturningAllColumns(targetDatasetData.rows, foreignKeyColumnName)
        fieldMetadata = getFieldMapFromMetadata(targetDatasetData)
    }

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addChartsUsingLayersPoint(feature, layerVisualizationSettings, mappedData, layerGroup, widgetModel, markerBounds, null, fieldMetadata, variables, charts, activeSelections, dashboardId)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addChartsUsingLayersPoint(feature, layerVisualizationSettings, mappedData, layerGroup, widgetModel, markerBounds, coord, fieldMetadata, variables, charts, activeSelections, dashboardId)
            })
        }
    })

    return { charts: charts, type: LEGEND_DATA_TYPE.CHARTS }
}

const addChartsUsingLayersPoint = (feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, layerGroup: any, widgetModel: IWidget, markerBounds: any[], coord: any[] | null, fieldMetadata: Record<string, string> | null, variables: IVariable[], charts: any[], activeSelections: ISelection[], dashboardId: string) => {
    const chartValuesRecord = {} as ChartValuesRecord

    let foreignKeyValue = null as string | null
    if (mappedData && fieldMetadata) {
        const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
        const mappedRow = mappedData[valueKey]
        if (!mappedRow) return
        foreignKeyValue = layerVisualizationSettings.targetDatasetForeignKeyColumn ? mappedRow[fieldMetadata[layerVisualizationSettings.targetDatasetForeignKeyColumn]] : ''

        layerVisualizationSettings.targetDatasetMeasures?.forEach((targetDatasetMeasure: string) => {
            const columnKey = fieldMetadata[targetDatasetMeasure]
            const value = mappedRow[columnKey]
            chartValuesRecord[targetDatasetMeasure] = { value: value, measureName: targetDatasetMeasure }
        })
    } else {
        layerVisualizationSettings.chartMeasures?.forEach((chartMeasure: string) => {
            chartValuesRecord[chartMeasure] = { value: feature.properties[chartMeasure], measureName: chartMeasure }
        })
    }

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    if (!coordinates) return

    const id = 'id-' + performance.now().toString(36) + Math.random().toString(36)

    const customIcon = L.divIcon({
        html: `<div id='${id}'></div>`,
        iconSize: [30, 30],
        iconAnchor: [30, 30],
        className: 'custom-icon'
    })
    const marker = L.marker(coordinates.reverse(), { icon: customIcon }).addTo(layerGroup)

    const chart = createChart(chartValuesRecord, layerVisualizationSettings, marker._icon, variables, widgetModel)
    charts.push(chart)

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, chartValuesRecord, marker, activeSelections, dashboardId, variables, foreignKeyValue)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, chartValuesRecord, marker, activeSelections, dashboardId, variables, foreignKeyValue)

    markerBounds.push(marker.getLatLng())
}

const createChart = (chartValuesRecord: ChartValuesRecord, layerVisualizationSettings: IMapWidgetVisualizationType, element: HTMLElement, variables: IVariable[], widgetModel: IWidget) => {
    const data = transformChartValuesData(chartValuesRecord) as { category: string; value: number | string }[]
    if (!data || !data.length) return { chartDomains: [], chartColors: [] }

    const numericData = data.map((item) => ({ category: item.category, value: Number(item.value) }))
    const { chartData, chartColors, chartDomains } = formatChartColorsAndData(numericData, layerVisualizationSettings, variables, widgetModel)
    const { filteredChartData, filteredChartColors, filteredChartDomains } = getFilteredChartColorsAndData(chartData, layerVisualizationSettings, chartColors, chartDomains)

    const finalData = (filteredChartData ?? chartData).map((item) => item.value)
    const finalLabels = (filteredChartData ?? chartData).map((item) => item.category)
    const finalColors = filteredChartColors ?? chartColors
    const finalDomains = filteredChartDomains ?? chartDomains

    let canvas = element.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) {
        canvas = document.createElement('canvas')
        canvas.width = 30
        canvas.height = 30
        element.innerHTML = ''
        element.appendChild(canvas)
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return { chartDomains: finalDomains, chartColors: finalColors }

    const type = layerVisualizationSettings.pieConf?.type === 'pie' ? 'pie' : 'bar'

    const existingChart = (canvas as any)._chartInstance as ChartJS | undefined
    if (existingChart) {
        existingChart.destroy()
    }

    const chart = new ChartJS(ctx, {
        type: type as any,
        data: {
            labels: finalLabels,
            datasets: [
                {
                    data: finalData,
                    backgroundColor: finalColors,
                    borderWidth: 0
                }
            ]
        },
        options: {
            responsive: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            scales:
                type === 'bar'
                    ? {
                          x: {
                              display: false
                          },
                          y: {
                              display: false
                          }
                      }
                    : {}
        }
    })
    ;(canvas as any)._chartInstance = chart

    return { chartDomains: finalDomains, chartColors: finalColors }
}

const formatChartColorsAndData = (data: { category: string; value: number | string }[], layerVisualizationSettings: IMapWidgetVisualizationType, variables: IVariable[], widgetModel: IWidget) => {
    const defaultColors = ['red', 'blue', 'green']
    const chartData = data.map((item: { category: string; value: number | string }) => ({ category: item.category, value: item.value })) as { category: string; value: number }[]
    const chartColors = (layerVisualizationSettings.pieConf?.colors ?? defaultColors).slice(0, chartData.length).concat(Array.from({ length: Math.max(0, chartData.length - defaultColors.length) }, (_, i) => defaultColors[i % defaultColors.length]))
    const chartDomains = chartData.map((item: { category: string; value: number | string }) => item.category)

    chartData?.forEach((data: { category: string; value: number }, index: number) => {
        const conditionalStyle = getChartConditionalStyle(widgetModel, layerVisualizationSettings.target, data.category, data.value, variables)
        if (!conditionalStyle) return
        if (chartColors[index]) chartColors[index] = conditionalStyle['background-color']
    })

    return { chartData, chartColors, chartDomains }
}

const getFilteredChartColorsAndData = (chartData: { category: string; value: number }[], layerVisualizationSettings: IMapWidgetVisualizationType, chartColor: string[], chartDomains: string[]) => {
    let filteredChartData = null as { category: string; value: number | string }[] | null
    let filteredChartColors = null as string[] | null
    let filteredChartDomains = null as string[] | null

    const filter = layerVisualizationSettings.filter
    if (!filter || !filter.enabled) return { filteredChartData, filteredChartColors, filteredChartDomains }

    const filteredData = chartData
        .map((item, index) => ({ ...item, color: chartColor[index], domain: chartDomains[index] }))
        .filter((item: { category: string; value: number; color: string; domain: string }) => {
            if (item.category !== filter.column) return true
            return isConditionMet(filter, '' + item.value)
        })

    filteredChartData = filteredData.map(({ category, value }) => ({ category, value }))
    filteredChartColors = filteredData.map(({ color }) => color)
    filteredChartDomains = filteredData.map(({ domain }) => domain)

    return { filteredChartData, filteredChartColors, filteredChartDomains }
}

const transformChartValuesData = (chartValuesRecord: ChartValuesRecord) => {
    const result = [] as { category: string; value: number | string }[]

    for (const key in chartValuesRecord) {
        const { value, measureName } = chartValuesRecord[key]
        if (!value) return

        result.push({ category: measureName, value })
    }

    return result
}
