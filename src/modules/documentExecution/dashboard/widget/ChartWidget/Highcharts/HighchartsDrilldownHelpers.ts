type IBoundingBox = {
    x: number
    y: number
    width: number
    height: number
}

type IDataLabelLike = {
    options?: {
        inside?: boolean
    }
    getBBox?: () => IBoundingBox
}

type IGraphicLike = {
    getBBox?: () => IBoundingBox
}

type ISeriesLike = {
    color?: unknown
}

type IDrilldownPointLike = {
    color?: unknown
    contrastColor?: string
    dataLabel?: IDataLabelLike
    graphic?: IGraphicLike
    series?: ISeriesLike
}

type IConfiguredDataLabels = {
    backgroundColor?: string | null
}

type IGetDrilldownDataLabelColorOptions = {
    chartBackgroundColor: string
    configuredColor?: string
    configuredDataLabels?: IConfiguredDataLabels
    getContrast: (backgroundColor: string) => string
    point: IDrilldownPointLike
}

const getStringColor = (color: unknown) => (typeof color === 'string' && color.trim() ? color : undefined)

const getBBoxOverlapArea = (firstBox: IBoundingBox, secondBox: IBoundingBox) => {
    const overlapWidth = Math.min(firstBox.x + firstBox.width, secondBox.x + secondBox.width) - Math.max(firstBox.x, secondBox.x)
    const overlapHeight = Math.min(firstBox.y + firstBox.height, secondBox.y + secondBox.height) - Math.max(firstBox.y, secondBox.y)
    if (overlapWidth <= 0 || overlapHeight <= 0) return 0
    return overlapWidth * overlapHeight
}

export const isDataLabelInsideGraphic = (point: IDrilldownPointLike) => {
    if (typeof point?.dataLabel?.options?.inside === 'boolean') return point.dataLabel.options.inside

    const pointBox = point?.graphic?.getBBox?.()
    const labelBox = point?.dataLabel?.getBBox?.()
    if (!pointBox || !labelBox) return false

    const labelArea = labelBox.width * labelBox.height
    if (labelArea <= 0) return false

    return getBBoxOverlapArea(pointBox, labelBox) / labelArea >= 0.5
}

export const getDrilldownDataLabelColor = ({ chartBackgroundColor, configuredColor, configuredDataLabels, getContrast, point }: IGetDrilldownDataLabelColorOptions) => {
    const explicitConfiguredColor = getStringColor(configuredColor)
    if (explicitConfiguredColor && explicitConfiguredColor !== 'contrast') return explicitConfiguredColor

    const labelBackgroundColor = getStringColor(configuredDataLabels?.backgroundColor)
    if (labelBackgroundColor) return getContrast(labelBackgroundColor)

    if (isDataLabelInsideGraphic(point)) {
        const runtimeContrastColor = getStringColor(point.contrastColor)
        if (runtimeContrastColor) return runtimeContrastColor

        const pointColor = getStringColor(point.color ?? point.series?.color)
        if (pointColor) return getContrast(pointColor)
    }

    return getContrast(chartBackgroundColor)
}
