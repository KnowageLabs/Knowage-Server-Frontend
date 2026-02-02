import moment from 'moment'
import { getCellConditionalStyles } from './TableWidgetHelper'
import { formatNumberWithLocale, luxonFormatDate } from '@/helpers/commons/localeHelper'
import { ITableWidgetLink, ITableWidgetVisualizationTypes, IWidgetInteractions } from '../../Dashboard'
// import helpersDecriptor from '../WidgetEditor/helpers/tableWidget/TableWidgetHelpersDescriptor.json'

export default class CellRenderer {
    eGui!: HTMLSpanElement
    eButton!: any
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

        const createIconColumnIcons = () => {
            const interactions = params.propWidget.settings.interactions as IWidgetInteractions
            for (const interactionName in interactions) {
                const interaction = interactions[interactionName]

                if (interaction.enabled === true && interaction.type === 'icon' && interactionName !== 'link') {
                    const interactionButton = createInteractionIcons({ ...interaction, interactionType: interactionName }, null)
                    this.eGui.appendChild(interactionButton)
                } else if (interaction.enabled === true && interactionName === 'link' && interaction.links.length > 0) {
                    interaction.links.forEach((link, index) => {
                        const interactionButton = createInteractionIcons({ ...link, interactionType: 'link' }, index)
                        this.eGui.appendChild(interactionButton)
                    })
                }
            }

            function createInteractionIcons(interaction, index) {
                const interactionButton = document.createElement('icon')
                interactionButton.setAttribute('class', `${interaction.icon} p-mr-1`)
                interactionButton.setAttribute('style', 'cursor: pointer;')
                interactionButton.addEventListener('click', () => invokeParentMethod(interaction, params, index))
                return interactionButton
            }
        }

        const getMultiselectStyle = () => {
            if (params.colDef.colId === 'indexColumn' || params.colDef.colId === 'iconColumn') return null
            const selection = params.propWidget.settings.interactions.selection
            const celectedCellValues = params.multiSelectedCells
            const selectedColumn = params.selectedColumnArray[0]

            if (selection?.enabled && selection?.multiselection?.enabled) {
                if (selection.modalColumn && selection.modalColumn == params.colDef.colId && celectedCellValues.includes(params.value)) return selection.multiselection.properties
                else if (!selection.modalColumn && selectedColumn == params.colDef.field && celectedCellValues.includes(params.value)) return selection.multiselection.properties
            } else return null
        }
        const getLinkMultiselectStyle = () => {
            const linkSettings = params.propWidget.settings.interactions.link
            const selectedLinkRows = params.multiSelectedLinkRows

            if (linkSettings.enabled && linkSettings?.multiselection?.enabled) {
                const isRowSelected = selectedLinkRows?.some((row) => row.rowIndex === params.node.rowIndex)
                if (isRowSelected) return linkSettings.multiselection.properties
            }
            return null
        }

        const getPreviewMultiselectStyle = () => {
            const previewSettings = params.propWidget.settings.interactions.preview
            const selectedPreviewRows = params.multiSelectedPreviewRows

            if (previewSettings?.enabled && previewSettings?.multiselection?.enabled && selectedPreviewRows) {
                const isRowSelected = selectedPreviewRows?.some((row) => row.rowIndex === params.node.rowIndex)
                if (isRowSelected) return previewSettings.multiselection.properties
            }
            return null
        }

        const getCrossNavMultiselectStyle = () => {
            const crossNavSettings = params.propWidget.settings.interactions.crossNavigation
            const selectedCrossNavRows = params.multiSelectedCrossNavRows

            if (crossNavSettings?.enabled && crossNavSettings?.multiselection?.enabled && selectedCrossNavRows) {
                const isRowSelected = selectedCrossNavRows.some((row) => row.rowIndex === params.node.rowIndex)
                if (isRowSelected) return crossNavSettings.multiselection.properties
            }
            return null
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

            const linkMultiselectStyle = getLinkMultiselectStyle()
            if (linkMultiselectStyle) return linkMultiselectStyle

            const previewMultiselectStyle = getPreviewMultiselectStyle()
            if (previewMultiselectStyle) return previewMultiselectStyle

            const crossNavMultiselectStyle = getCrossNavMultiselectStyle()
            if (crossNavMultiselectStyle) return crossNavMultiselectStyle

            const conditionalStyle = getConditionalStyle()
            if (conditionalStyle) {
                applyConditionalStyleToBar = true
                return conditionalStyle
            }

            const columnStyle = getColumnStyle()
            if (columnStyle) return columnStyle

            const rowSpanStyle = getRowspanRowStyle()
            if (rowSpanStyle) return rowSpanStyle
        }

        const styleObject = getCellStyle()
        // HARDCODED ICON COLUMN STYLES, WE CAN ADD NEW OPTIONS IN EDITOR OR TWEAK THIS
        if (params.colId === 'iconColumn') this.setStyle({ 'align-items': 'center', 'justify-content': 'center' })
        else this.setStyle(styleObject)

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
            if (visType.type.toLowerCase() === 'text' || visType.type.toLowerCase() === 'multiline text') this.eGui.innerHTML = `${visType.prefix}${setCellContent()}${visType.suffix}`
            if (visType.type.toLowerCase() === 'icon') this.eGui.innerHTML = `${visType.prefix}<i class="${styleObject?.icon} p-as-center" />${visType.suffix}`
            if (visType.type.toLowerCase() === 'text & icon') this.eGui.innerHTML = `${visType.prefix}${setCellContent()}<i class="${styleObject?.icon} p-as-center" />${visType.suffix}`
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
        } else if (params.colId === 'iconColumn') createIconColumnIcons()
        else this.eGui.innerHTML = setCellContent()

        truncateCellContent(this.eGui)

        function invokeParentMethod(interaction, params, index) {
            const clickedInteraction = { type: interaction.interactionType, index: index, icon: interaction.icon, node: params }
            params.context.componentParent.activateInteractionFromClickedIcon(clickedInteraction)
        }

        function getBarFillPercentage() {
            const minValue = visType.min || 0
            const maxValue = visType.max || 100
            let percentage = Math.round(((params.value - minValue) / (maxValue - minValue)) * 100)
            if (percentage < 0) percentage = 0
            if (percentage > 100) percentage = 100

            return percentage
        }

        function setCellContent() {
            if (isColumnOfType('timestamp') || isColumnOfType('datetime')) return dateTimeFormatter(params.value)
            else if (isColumnOfType('date')) return dateFormatter(params.value)
            else if (params.colId === 'iconColumn') {
                return `<i class="${getActiveIconFromWidget()}"></i>`
            } else if (params.colId !== 'indexColumn' && params.node.rowPinned !== 'bottom') {
                if (typeof params.value === 'number') return numberFormatter(params.value)
                else return params.value
            } else return params.value
        }

        function getActiveIconFromWidget() {
            if (params.propWidget.settings.interactions.crossNavigation.enabled) return params.propWidget.settings.interactions.crossNavigation.icon
            else if (params.propWidget.settings.interactions.preview.enabled) return params.propWidget.settings.interactions.preview.icon
            else if (params.propWidget.settings.interactions.link.enabled) {
                const index = params.propWidget.settings.interactions.link.links.findIndex((link: ITableWidgetLink) => link.type === 'icon')
                return index !== -1 ? params.propWidget.settings.interactions.link.links[index].icon : ''
            } else if (params.propWidget.settings.interactions.iframe.enabled) return params.propWidget.settings.interactions.iframe.icon
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
            if (!cellValue) return ''
            const visType = getColumnVisualizationType(params.colId)
            return luxonFormatDate(cellValue, 'dd/MM/yyyy', visType?.dateFormat || 'D')
        }
        function dateTimeFormatter(cellValue) {
            if (!cellValue) return ''
            const visType = getColumnVisualizationType(params.colId)
            return luxonFormatDate(cellValue, 'dd/MM/yyyy HH:mm:ss.SSS', visType?.dateFormat || 'f')
        }
        function numberFormatter(cellValue) {
            const visType = getColumnVisualizationType(params.colId)

            if (visType?.precision) return formatNumberWithLocale(cellValue, visType.precision)
            else return formatNumberWithLocale(cellValue, 0)
        }
        function truncateCellContent(eGui) {
            const visType = getColumnVisualizationType(params.colId)
            const isDateColumn = isColumnOfType('timestamp') || isColumnOfType('datetime') || isColumnOfType('date')
            if (visType?.maximumCharacters && (visType.type === 'Text' || visType.type === 'Text & Icon') && eGui.innerHTML.length > visType?.maximumCharacters && !isDateColumn) {
                eGui.innerHTML = eGui.innerHTML.slice(0, visType?.maximumCharacters)

                const interactionButton = createTruncationIcon()
                eGui.appendChild(interactionButton)
            }

            function createTruncationIcon() {
                const interactionButton = document.createElement('icon')
                interactionButton.setAttribute('class', `fas fa-search p-mr-1 p-ml-auto`)
                interactionButton.setAttribute('style', 'cursor: pointer;')
                interactionButton.addEventListener('click', (event) => {
                    event.stopPropagation()
                    params.context.componentParent.toggleTruncatedDialog(params.value)
                })
                return interactionButton
            }
        }
    }

    getGui() {
        return this.eGui
    }
}
