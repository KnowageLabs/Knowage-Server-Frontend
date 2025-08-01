export function createNewField(editQueryObj, field) {
    var newField = {
        id: field.attributes.type === 'inLineCalculatedField' ? field.attributes.formState : field.id,
        alias: field.attributes.field,
        type: field.attributes.type === 'inLineCalculatedField' ? 'inline.calculated.field' : 'datamartField',
        fieldType: field.attributes.iconCls,
        entity: field.attributes.entity,
        field: field.attributes.field,
        decrypt: field.attributes.decrypt,
        personal: field.attributes.personal,
        subjectId: field.attributes.subjectId,
        funct: getFunct(field),
        color: field.color,
        group: field.isSpatial ? false : getGroup(field),
        order: 'NONE',
        include: true,
        // eslint-disable-next-line no-prototype-builtins
        inUse: field.hasOwnProperty('inUse') ? field.inUse : true,
        visible: true,
        iconCls: field.iconCls,
        dataType: field.dataType,
        format: field.format,
        longDescription: field.attributes.longDescription,
        distinct: editQueryObj.distinct,
        leaf: field.leaf,
        originalId: field.id,
        isSpatial: field.isSpatial,
        uniqueID: crypto.randomUUID()
    } as any

    // eslint-disable-next-line no-prototype-builtins
    if (!field.hasOwnProperty('id')) {
        newField.id = field.alias
        newField.alias = field.text
        newField.field = field.text
        newField.temporal = field.temporal
    }

    return newField
}

export function creatNewMetadataFromField(newField) {
    var newMetadata = {
        uniqueID: newField.uniqueID,
        column: newField.alias,
        fieldAlias: newField.field,
        Type: newField.dataType,
        fieldType: newField.iconCls.toUpperCase(),
        decrypt: newField.decrypt,
        personal: newField.personal,
        subjectId: newField.subjectId
    } as any

    return newMetadata
}

export function getFunct(field) {
    if (isColumnType(field, 'measure') && field.aggtype) {
        return field.aggtype
    } else if (isColumnType(field, 'measure')) {
        return 'SUM'
    }
    return 'NONE'
}
export function getGroup(field) {
    return isColumnType(field, 'attribute') && !isDataType(field, 'com.vividsolutions.jts.geom.Geometry')
}
export function isDataType(field, dataType) {
    return field.dataType == dataType
}
export function isColumnType(field, columnType) {
    return field.iconCls == columnType || isCalculatedFieldColumnType(field, columnType)
}
export function isCalculatedFieldColumnType(inLineCalculatedField, columnType) {
    return isInLineCalculatedField(inLineCalculatedField) && inLineCalculatedField.attributes.formState.nature === columnType
}
export function isInLineCalculatedField(field) {
    return field.attributes.type === 'inLineCalculatedField'
}

export const numberFormatRegex = '^(\\$#,##0|€#,##0|####|#.###|#,###){1}([,.]?)(#|0*)$' //eslint-disable-line no-useless-escape

export const formatNumber = (column: any) => {
    if (!column.format) return null

    const result = column.format.trim().match(numberFormatRegex)
    if (!result) return null

    const useGrouping = result[1].includes('.') || result[1].includes(',')
    const maxFractionDigits = result[3].length
    const currency = result[1].charAt(0) === '$' || result[1].charAt(0) === '€' ? result[1].charAt(0) : ''
    const configuration = { useGrouping: useGrouping, minFractionDigits: maxFractionDigits, maxFractionDigits: maxFractionDigits, currency: currency }

    return configuration
}
