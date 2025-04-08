import { IDataset, IDashboardDataset } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../DashboardHelpers'

const dataSetIntervals = {}

export const setDatasetIntervals = (modelDatasets: IDashboardDataset[], datasets: IDataset[]) => {
    if (!modelDatasets || !datasets) return

    for (let i = 0; i < modelDatasets.length; i++) {
        if (modelDatasets[i].frequency && modelDatasets[i].frequency != 0) setDatasetInterval(modelDatasets[i].id, modelDatasets[i].frequency)
    }
    removeUnusedDatasetIntervals(modelDatasets)
}

export const setDatasetInterval = (modelDatasetId: number, interval: number) => {
    if (dataSetIntervals[modelDatasetId]) clearInterval(dataSetIntervals[modelDatasetId])
    dataSetIntervals[modelDatasetId] = setInterval(() => emittDatasetRefresh(modelDatasetId), Number(interval) * 1000)
}

const removeUnusedDatasetIntervals = (modelDatasets: IDashboardDataset[]) => {
    const keysToRemove = [] as string[]
    Object.keys(dataSetIntervals).forEach((key: string) => {
        const index = modelDatasets.findIndex((dataset: IDashboardDataset) => '' + dataset.id === key)
        if (index === -1) keysToRemove.push(key)
    })
    keysToRemove.forEach((key: string) => clearDatasetInterval(+key))
}

const emittDatasetRefresh = (modelDatasetId: number) => {
    emitter.emit('datasetRefreshed', modelDatasetId)
}

export const clearDatasetInterval = (modelDatasetId: number) => {
    clearInterval(dataSetIntervals[modelDatasetId])
    delete dataSetIntervals[modelDatasetId]
}

export const clearAllDatasetIntervals = () => {
    Object.keys(dataSetIntervals).forEach((key: string) => clearDatasetInterval(+key))
}
