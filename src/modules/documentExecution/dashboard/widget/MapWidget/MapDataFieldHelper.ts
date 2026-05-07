const getMapDataFieldIdentifier = (column: any): string => {
    if (typeof column === 'string') return column
    return column?.name ?? column?.header ?? column?.dataIndex ?? column?.property ?? ''
}

const getMapMetadataField = (column: any, data: any) => {
    const identifier = getMapDataFieldIdentifier(column)
    if (!identifier) return null

    return (
        data?.metaData?.fields?.find((field: any) => {
            return field?.header === identifier || field?.name === identifier || field?.dataIndex === identifier
        }) ?? null
    )
}

export const getMapDataFieldName = (column: any, data: any): string => {
    const metadataField = getMapMetadataField(column, data)
    return metadataField?.name ?? metadataField?.dataIndex ?? ''
}

export const getMapDataFieldDataIndex = (column: any, data: any): string => {
    const metadataField = getMapMetadataField(column, data)
    return metadataField?.dataIndex ?? metadataField?.name ?? ''
}
