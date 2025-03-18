import L from 'leaflet'
import 'leaflet.heat'

export const createHeatmapVisualization = (map: any, data: any, target: any, markerBounds: any[], layerGroup: any) => {
    console.log('------- DATA: ', data)
    // const values = { data: [] } as any
    // for (const row of data[target.name].rows) {
    //     values.data.push({ lat: row.column_1.split(' ')[0], lon: row.column_1.split(' ')[1], value: row.column_2 })
    //     markerBounds.push({ lat: row.column_1.split(' ')[0], lng: row.column_1.split(' ')[1] })
    // }

    const heatmapData = [
        [51.505, 30.5, 100],
        [51.515, 32.6, 72]
    ]

    const heatLayer = L.heatLayer(heatmapData, {
        radius: 25,
        blur: 0,
        maxZoom: 1,
        max: 120
    }).addTo(map)

    console.log('-------- MAP: ', map)
    // const heatmapLayer = new HeatmapOverlay({
    //     radius: 0.05,
    //     maxOpacity: 0.5,
    //     scaleRadius: true,
    //     latField: 'lat',
    //     lngField: 'lon',
    //     value: 'count'
    // })
    // heatmapLayer.setData(values)
    // layerGroup.addLayer(heatmapLayer)
}
