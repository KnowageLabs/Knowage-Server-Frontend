import { localeDate } from '@/helpers/commons/localeHelper'
import { normalizeCalculatedFieldForAPI } from '@/helpers/commons/buildQbeCalculatedField'
import { getInvalidQbeAggregationNamesFromFormula } from '@/components/UI/KnBlockly/validation/qbeFunctionSemantics'
import { iFilter } from './QBE'
import moment from 'moment'
import deepcopy from 'deepcopy'

export const getFormattedQBECatalogueForAPI = (qbeCatalogue: any, filters: iFilter[] | undefined) => {
    const tempCatalogue = deepcopy(qbeCatalogue)
    normalizeCalculatedFields(tempCatalogue)
    if (!filters) return tempCatalogue

    const filtersCopy = filters.map((filter) => ({ ...filter }))

    filtersCopy.forEach((filter: iFilter) => {
        const isDateOrTimestamp = ['DATE', 'TIMESTAMP'].includes(filter.leftOperandValue?.type)
        const isCaluclatedField = filter.leftOperandType === 'inline.calculated.field'
        if (isDateOrTimestamp && isCaluclatedField) formatManualDate(filter, tempCatalogue)
    })

    return tempCatalogue
}

export const getInvalidCalculatedFieldAggregation = (qbeCatalogue: any[] | undefined) => {
    if (!Array.isArray(qbeCatalogue)) return null

    for (const catalogue of qbeCatalogue) {
        if (!Array.isArray(catalogue?.fields)) continue

        for (const field of catalogue.fields) {
            if (field?.type !== 'inline.calculated.field') continue

            const sourceExpression = field.formulaEditor ?? field.id?.expressionSimple ?? field.expression ?? field.formula ?? field.id?.expression
            const invalidAggregations = getInvalidQbeAggregationNamesFromFormula(sourceExpression)

            if (invalidAggregations.length > 0) {
                return {
                    fieldAlias: field.alias,
                    functionName: invalidAggregations[0]
                }
            }
        }
    }

    return null
}

const normalizeCalculatedFields = (qbeCatalogue: any[]) => {
    if (!Array.isArray(qbeCatalogue)) return

    qbeCatalogue.forEach((catalogue) => {
        if (!Array.isArray(catalogue?.fields)) return
        catalogue.fields.forEach((field) => normalizeCalculatedFieldForAPI(field, catalogue.fields))
    })
}

const formatManualDate = (filter: iFilter, qbeCatalogue: any) => {
    const serverFormat = 'DD/MM/YYYY hh:mm'
    const format = localeDate().replace(/yyyy/g, 'YYYY').replace(/dd/g, 'DD').replace(/d/g, 'D').replace(/MM/g, 'MM').replace(/M/g, 'M').replace(/hh/g, 'HH').replace(/mm/g, 'mm').replace(/ss/g, 'ss').replace(/SSS/g, 'SSS')
    const momentDate = moment(filter.rightOperandDescription, format, true)

    if (momentDate.isValid()) {
        const formattedDate = momentDate.format(serverFormat)
        const properDateForAPI = truncateDateTimeForAPI(formattedDate)
        filter.rightOperandValue = [properDateForAPI]
        filter.rightOperandDescription = properDateForAPI
    } else {
        filter.rightOperandValue = []
        filter.rightOperandDescription = ''
    }

    updateFilterRightOperandValue(qbeCatalogue, filter)
}

const updateFilterRightOperandValue = (qbeCatalogue: any[], qbeFilter: iFilter) => {
    if (!Array.isArray(qbeCatalogue)) return

    qbeCatalogue.forEach((catalogue) => {
        if (!catalogue?.filters || !catalogue?.expression) return

        const filterToUpdate = catalogue.filters.find((filter: iFilter) => filter.filterId === qbeFilter.filterId)

        if (filterToUpdate) {
            filterToUpdate.rightOperandValue = qbeFilter.rightOperandValue
            filterToUpdate.rightOperandDescription = qbeFilter.rightOperandDescription

            const updateExpressionTree = (node: any): void => {
                if (!node) return

                if (node.value.includes(qbeFilter.filterId)) node.details.rightOperandValue = qbeFilter.rightOperandValue

                if (node.childNodes && Array.isArray(node.childNodes)) {
                    node.childNodes.forEach(updateExpressionTree)
                }
            }

            updateExpressionTree(catalogue.expression)
        }
    })
}

function truncateDateTimeForAPI(dateTime: string | null | undefined) {
    if (!dateTime || dateTime.trim() === '') {
        return ''
    }
    return dateTime.split(' ')[0]
}
