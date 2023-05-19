import moment from 'moment'
import { getCellConditionalStyles } from './TableWidgetHelper'
import { getLocale } from '@/helpers/commons/localeHelper'
import { ITableWidgetVisualizationTypes } from '../../Dashboard'
// import helpersDecriptor from '../WidgetEditor/helpers/tableWidget/TableWidgetHelpersDescriptor.json'

export default class CellRenderer {
    eGui!: HTMLSpanElement
    setStyle(style: any) {
        for (const property in style) {
            if (style[property]) this.eGui.style[property] = style[property]
        }
    }

    init(params) {
        this.eGui = document.createElement('span')
        this.eGui.classList.add('p-d-flex')
        this.eGui.classList.add('kn-height-full')

        let applyConditionalStyleToBar = false

        const getMultiselectStyle = () => {
            if (params.colDef.colId === 'indexColumn') return null
            const selection = params.propWidget.settings.interactions.selection
            const celectedCellValues = params.multiSelectedCells
            const selectedColumn = params.selectedColumnArray[0]

            if (selection.enabled && selection.multiselection.enabled) {
                if (selection.modalColumn && selection.modalColumn == params.colDef.colId && celectedCellValues.includes(params.value)) return selection.multiselection.properties
                else if (!selection.modalColumn && selectedColumn == params.colDef.field && celectedCellValues.includes(params.value)) return selection.multiselection.properties
            } else return null
        }

        const getConditionalStyle = () => {
            if (params.propWidget.settings.conditionalStyles.enabled) {
                const test = getCellConditionalStyles(params)
                return test
            } else return null
        }

        const getColumnStyle = () => {
            const columnStyles = params.propWidget.settings.style.columns

            if (columnStyles.enabled) {
                let columnStyle = null as any

                const allColumnStyle = columnStyles.styles.filter((style) => style.target === 'all')[0].properties
                if (allColumnStyle) columnStyle = allColumnStyle

                const cellColumnStyle = columnStyles.styles.filter((style) => Array.isArray(style.target) && style.target.includes(params.colId))[0]
                if (cellColumnStyle) columnStyle = cellColumnStyle.properties

                return columnStyle
            } else return null
        }

        const getRowspanRowStyle = () => {
            const rowStyles = params.propWidget.settings.style.rows
            if (rowStyles.alternatedRows && rowStyles.alternatedRows.enabled) {
                if (rowStyles.alternatedRows.oddBackgroundColor && params.node.rowIndex % 2 === 0) {
                    return { 'background-color': rowStyles.alternatedRows.oddBackgroundColor }
                }
                if (rowStyles.alternatedRows.evenBackgroundColor && params.node.rowIndex % 2 != 0) {
                    return { 'background-color': rowStyles.alternatedRows.evenBackgroundColor }
                }
            }
        }

        const getCellStyle = () => {
            const multiselectStyle = getMultiselectStyle()
            if (multiselectStyle) return multiselectStyle

            const conditionalStyle = getConditionalStyle()
            if (conditionalStyle) {
                applyConditionalStyleToBar = true
                return conditionalStyle
            }

            const columnStyle = getColumnStyle()
            if (columnStyle) return columnStyle

            const rowSpanStyle = getRowspanRowStyle()
            if (rowSpanStyle) return rowSpanStyle

            // else return helpersDecriptor.defaultColumnStyles.styles[0].properties
        }

        const styleObject = getCellStyle()
        this.setStyle(styleObject)

        let visType = {} as any
        const visualizationTypeConfiguration = params.propWidget.settings.visualization.visualizationTypes as ITableWidgetVisualizationTypes

        if (visualizationTypeConfiguration.enabled) {
            const visualizationTypes = visualizationTypeConfiguration.types
            //"all" target vis types
            const allVisualizationType = visualizationTypes.filter((visType) => visType.target === 'all')[0]
            if (allVisualizationType) visType = allVisualizationType

            const cellVisualizationType = visualizationTypes.filter((visType) => Array.isArray(visType.target) && visType.target.includes(params.colId))
            if (cellVisualizationType) {
                for (const type of cellVisualizationType) {
                    visType = { ...visType, ...type }
                }
            }
        }

        if (visType.type) {
            if (visType.type.toLowerCase() === 'text') this.eGui.innerHTML = `${visType.prefix}${setCellContent()}${visType.suffix}`
            if (visType.type.toLowerCase() === 'icon') this.eGui.innerHTML = `${visType.prefix}<i class="${styleObject.icon}" />${visType.suffix}`
            if (visType.type.toLowerCase() === 'text & icon') this.eGui.innerHTML = `${visType.prefix}${setCellContent()}<i class="${styleObject.icon} p-as-center" />${visType.suffix}`
            if (visType.type.toLowerCase() === 'bar') {
                const percentage = getBarFillPercentage()
                this.eGui.innerHTML = `<div class="barContainer" style="background-color:${applyConditionalStyleToBar ? styleObject['background-color'] : visType['background-color']};justify-content:${visType['alignment']}">
                                        <div class="innerBar" style="width:${percentage}%;background-color:${applyConditionalStyleToBar ? styleObject.color : visType.color}"></div>
                                      </div>`
            }
            if (visType.type.toLowerCase() === 'bar & text') {
                const percentage = getBarFillPercentage()
                this.eGui.innerHTML = `<div class="barContainer" style="background-color:${applyConditionalStyleToBar ? styleObject['background-color'] : visType['background-color']};justify-content:${visType['alignment']}">
                                        <div class="innerBar" style="color: black;width:${percentage}%;background-color:${applyConditionalStyleToBar ? styleObject.color : visType.color};text-align:${visType['alignment']}">${visType.prefix}${setCellContent()}${visType.suffix}</div>
                                      </div>`
            }
        } else this.eGui.innerHTML = setCellContent()

        function getBarFillPercentage() {
            const minValue = visType.min || 0
            const maxValue = visType.max || 100
            let percentage = Math.round(((params.value - minValue) / (maxValue - minValue)) * 100)
            if (percentage < 0) percentage = 0
            if (percentage > 100) percentage = 100

            return percentage
        }

        function setCellContent() {
            if (isColumnOfType('date')) return dateFormatter(params.value)
            else if (isColumnOfType('timestamp')) return dateTimeFormatter(params.value)
            else if (params.colId === 'iconColumn') return `ICON`
            else if (params.colId !== 'indexColumn' && params.node.rowPinned !== 'bottom') return params.value
            else return params.value
        }

        function isColumnOfType(columnType: string) {
            const widgetColumns = params.propWidget.columns
            const cellColumnId = params.colId
            const cellColumn = widgetColumns.find(({ id }) => id === cellColumnId)

            return cellColumn?.type.toLowerCase().includes(columnType)
        }

        function getColumnVisualizationType(colId) {
            const visTypes = params.propWidget.settings.visualization.visualizationTypes as ITableWidgetVisualizationTypes

            if (visTypes.enabled) {
                const colVisType = visTypes.types.find((visType) => visType.target.includes(colId))
                if (colVisType) return colVisType
                else return visTypes.types[0]
            } else return null
        }
        function dateFormatter(cellValue) {
            const visType = getColumnVisualizationType(params.colId)

            const isDateValid = moment(cellValue, 'DD/MM/YYYY').isValid()
            return isDateValid
                ? moment(cellValue, 'DD/MM/YYYY')
                      .locale(getLocale(true))
                      .format(visType?.dateFormat || 'LL')
                : cellValue
        }
        function dateTimeFormatter(cellValue) {
            const visType = getColumnVisualizationType(params.colId)

            const isDateValid = moment(cellValue, 'DD/MM/YYYY HH:mm:ss.SSS').isValid()
            return isDateValid
                ? moment(cellValue, 'DD/MM/YYYY HH:mm:ss.SSS')
                      .locale(getLocale(true))
                      .format(visType?.dateFormat || 'LLL')
                : cellValue
        }
    }

    getGui() {
        return this.eGui
    }
}
