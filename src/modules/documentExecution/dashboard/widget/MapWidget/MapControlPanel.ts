import { MapManager } from './MapManagerCreator'

export class ControlPanelItemMeasure {
    private alias: string
    private name: string

    constructor(alias: string, name: string) {
        this.alias = alias
        this.name = name
    }

    getAlias(): string {
        return this.alias
    }

    getName(): string {
        return this.name
    }
}

export class ControlPanelItem {
    private layerId: string
    private alias: string
    private measures: ControlPanelItemMeasure[]
    private selected: ControlPanelItemMeasure | null

    constructor(layerId: string, alias: string, measures: ControlPanelItemMeasure[]) {
        this.layerId = layerId
        this.alias = alias
        this.measures = measures
        this.selected = measures.length > 0 ? measures[0] : null
    }

    getLayerId(): string {
        return this.layerId
    }

    getAlias(): string {
        return this.alias
    }

    getSelected(): ControlPanelItemMeasure | null {
        return this.selected
    }

    getMeasures(): ControlPanelItemMeasure[] {
        return this.measures
    }
}

export class ControlPanel {
    private mapManager: MapManager
    private layers = [] as ControlPanelItem[]

    constructor(mapManager: MapManager) {
        this.mapManager = mapManager
    }

    public addLayer(item: ControlPanelItem) {
        this.layers.push(item)
    }

    public removeLayer(item: ControlPanelItem) {
        const elemIdx = this.layers.indexOf(item)

        if (elemIdx < 0) {
            throw new Error('Following element not found: ' + item)
        }

        this.layers.splice(elemIdx, 1)
    }

    public getLayers(): ControlPanelItem[] {
        return this.layers
    }

    public getLayer(layerId: string): ControlPanelItem | undefined {
        return this.layers.find((e) => e.getLayerId() == layerId)
    }
}
