export const fitTreemapDataLabels = (series: any) => {
    if (series.type !== 'treemap') return

    const seriesLabels = Array.isArray(series.options.dataLabels) ? series.options.dataLabels[0] : series.options.dataLabels
    series.points?.forEach((point: any) => {
        const options = point.dlOptions
        if (!options || !point.shapeArgs) return

        const style = { ...seriesLabels?.style, ...options.style }
        const isHeader = !point.node?.isLeaf && (options.headers ?? seriesLabels?.headers)
        const padding = options.padding ?? seriesLabels?.padding ?? 5
        const paddingValues = Array.isArray(padding) ? padding : [padding]
        const top = paddingValues[0] ?? 0
        const right = paddingValues[1] ?? top
        const bottom = paddingValues[2] ?? top
        const left = paddingValues[3] ?? right
        const width = Math.max(0, point.shapeArgs.width - left - right)
        const height = Math.max(0, point.shapeArgs.height - top - bottom)
        const lineHeight = series.chart.renderer.fontMetrics(Number.parseFloat(style.fontSize) || 13).h
        const lines = Math.min(isHeader ? 1 : 2, Math.floor(height / lineHeight))

        options.style = {
            ...style,
            width: `${width}px`,
            whiteSpace: isHeader ? 'nowrap' : 'normal',
            textOverflow: 'ellipsis',
            lineClamp: Math.max(1, lines)
        }
        // Highcharts rebuilds dlOptions on redraw, so labels return when tiles grow.
        if (width < 36 || lines < 1) options.enabled = false
    })
}
