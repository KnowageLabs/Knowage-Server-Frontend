export interface iParameter {
    urlName: string
    metadata: {
        colsMap: any
        valueColumn: string
        descriptionColumn: string
    }
    typeCode?: string
    data: any
    visible: boolean
    valueSelection: string
    showOnPanel: string
    driverUseLabel: string
    label: string
    driverDefaultValue: { value: string | number; desc: string }[]
    parameterValue: { value: string | number | Date | null; description: string }[]
    type: string
    driverLabel: string
    mandatory: boolean
    allowInternalNodeSelection: boolean
    multivalue: boolean
    dependencies: {
        data: any[]
        visual: any[]
        lov: any[]
    }
    selectionType: string
    id: number
    parameterDescription: string[]
    dependentParameters?: iParameter[]
    dependsOnParameters?: iParameter[]
    dataDependentParameters?: iParameter[]
    dataDependsOnParameters?: iParameter[]
    lovDependsOnParameters?: iParameter[]
    lovDependentParameters?: iParameter[]
    driverMaxValue?: string | null
    driverMaxDateValue?: Date | null
    valueColumnNameMetadata?: string
    descriptionColumnNameMetadata: string
    initialValue?: string | number | Date | null
}

export interface iDocument {
    creationDate: string
    creationUser: string
    dataSetId: number | null
    dataSetLabel: number | null
    dataSourceLabel: number | null
    datasetsIds: null
    description: string
    docVersion: null
    drivers: any[]
    dsTypeCd?: string
    engine: string
    functionalities: string[]
    federation_id?: number
    id: number
    label: string
    lockedByUser: string
    metamodelDrivers: any
    name: string
    objMetaDataAndContents: any
    outputParameters: any[]
    parametersRegion: string
    previewFile: string
    profiledVisibility: string
    public: boolean
    refreshSeconds: number
    stateCode: string
    stateCodeStr: string
    tenant: string
    typeCode: string
    visible: boolean
    type?: string
}

export interface iAdmissibleValues {
    status: string
    error: string
    idParam: string
    result: {
        metadata: {
            colsMap: any
            descriptionColumn: string
            invisibleColumns: string[]
            valueColumn: string
            visibleColumns: string[]
        }
        data: { _col0: string; _col1: string }[]
    }
}

export interface iAdmissibleTreeValues {
    rows: { data: string; isEnabled: boolean; label: string; id: string; leaf: boolean }[]
    errors: any[]
}

export interface iNode {
    key: number | string
    id: number | string
    label: string
    children: iNode[]
    data: { value: string; description: string }
    style: any
    leaf: boolean
    selectable: boolean
    parent: iNode
    icon: string
}
