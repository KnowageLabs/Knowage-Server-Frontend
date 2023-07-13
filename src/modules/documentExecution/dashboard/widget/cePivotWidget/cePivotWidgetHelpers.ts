import { IDataset, ISelection, IWidget, IWidgetCrossNavigation, IWidgetInteractionParameter } from "../../Dashboard"

interface ISelectionValue { columnName: string, value: string }

export const getFormattedClickedValueForCrossNavigation = (selectionValues: string[], dataFields: any, crossNavigationOptions: IWidgetCrossNavigation) => {
    const formattedSelectionValues = getFormattedSelectionValuesFromStringArray(selectionValues)
    const formattedOutputParameters = getFormattedOutputParameters(formattedSelectionValues, crossNavigationOptions.parameters)
    return formattedOutputParameters
}

const getFormattedOutputParameters = (selectionValues: ISelectionValue[], outputParameters: IWidgetInteractionParameter[]) => {
    const formattedOutputParameters = [] as IWidgetInteractionParameter[]
    outputParameters.forEach((outputParameter: IWidgetInteractionParameter) => {
        if (outputParameter.type === 'dynamic') {
            const formattedOutputParameter = getFormattedDynamicOutputParameter(selectionValues, outputParameter)
            if (formattedOutputParameter.value) formattedOutputParameters.push(formattedOutputParameter)
        } else {
            formattedOutputParameters.push(outputParameter)
        }
    })
    return formattedOutputParameters
}

const getFormattedDynamicOutputParameter = (selectionValues: ISelectionValue[], outputParameter: IWidgetInteractionParameter) => {
    const index = selectionValues.findIndex((selectionValue: ISelectionValue) => selectionValue.columnName === outputParameter.column)
    outputParameter.value = index !== -1 ? selectionValues[index].value : ''
    return outputParameter
}

export const createPivotTableSelection = (selectionValues: string[], widgetModel: IWidget, datasets: IDataset[]) => {
    const formattedSelectionValues = getFormattedSelectionValuesFromStringArray(selectionValues)
    const selections = createSelectionsFromSelectedValues(formattedSelectionValues, widgetModel, datasets)

    return selections
}

const getFormattedSelectionValuesFromStringArray = (selectionValues: string[]) => {
    const formattedSelectionValues = [] as ISelectionValue[]
    for (let i = 0; i < selectionValues.length; i += 2) {
        if (selectionValues[i + 1]) {
            const columnName = selectionValues[i].startsWith('_S_') ? selectionValues[i].slice(3) : selectionValues[i]
            const value = selectionValues[i + 1].startsWith('_S_') ? selectionValues[i + 1].slice(3) : selectionValues[i + 1]
            if (columnName.includes('_S_')) {
                const columnNamesArray = columnName.split('_S_')
                const valuesArray = value.split('_S_')
                columnNamesArray.forEach((columnName: string, index: number) => {
                    if (valuesArray[index]) formattedSelectionValues.push({ columnName: columnName, value: valuesArray[index] })
                })
            } else {
                formattedSelectionValues.push({ columnName: columnName, value: value })
            }
        }
    }
    return formattedSelectionValues
}

const createSelectionsFromSelectedValues = (selectionValues: ISelectionValue[], widgetModel: IWidget, datasets: IDataset[]) => {
    const selections = [] as ISelection[]
    selectionValues.forEach((selectionValue: ISelectionValue) => selections.push(createSelection([selectionValue.value], selectionValue.columnName, widgetModel, datasets)))
    return selections
}

const createSelection = (value: (string | number)[], columnName: string, widget: IWidget, datasets: IDataset[]) => {
    return { datasetId: widget.dataset as number, datasetLabel: getDatasetLabel(widget.dataset as number, datasets) as string, columnName: columnName, value: value, aggregated: false, timestamp: new Date().getTime() }
}

const getDatasetLabel = (datasetId: number, datasets: IDataset[]) => {
    const index = datasets.findIndex((dataset: IDataset) => dataset.id.dsId == datasetId)
    return index !== -1 ? datasets[index].label : ''
}