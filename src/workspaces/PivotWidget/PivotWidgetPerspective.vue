<template>
    <div class="pivot-widget-perspective-container kn-flex">
        <perspective-viewer ref="viewerRef" style="flex: 1; width: 100%; height: 100%" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, ISelection, IWidget, IDashboardView, IVariable } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { mapActions } from 'pinia'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import mainStore from '@/App.store'
import { updateAllStoreSelections } from '@/modules/documentExecution/dashboard/widget/interactionsHelpers/InteractionHelper'
import { getPerspectiveWorker } from './PerspectiveBootstrap'
import { remapRows, buildViewerConfig } from './PerspectiveDataHelper'
import '@perspective-dev/viewer'
import '@perspective-dev/viewer-datagrid'
import '@perspective-dev/viewer/dist/css/pro.css'

export default defineComponent({
    name: 'pivot-widget-perspective',
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        editorMode: { type: Boolean, required: false },
        datasets: { type: Array as PropType<IDataset[]>, required: true },
        dataToShow: { type: Object as any, required: true },
        propActiveSelections: { type: Array as PropType<ISelection[]>, required: true },
        dashboardId: { type: String, required: true },
        propVariables: { type: Array as PropType<IVariable[]>, required: true }
    },
    emits: ['pageChanged', 'sortingChanged', 'launchSelection'],
    setup() {
        const store = dashboardStore()
        const appStore = mainStore()
        return { store, appStore }
    },
    data() {
        return {
            perspectiveTable: null as any,
            activeSelections: [] as ISelection[]
        }
    },
    watch: {
        async dataToShow(newVal) {
            if (this.perspectiveTable && newVal?.rows) {
                await this.perspectiveTable.replace(remapRows(newVal))
            }
        },
        propActiveSelections() {
            this.activeSelections = this.propActiveSelections
        },
        async propWidget() {
            const viewer = this.$refs.viewerRef as any
            if (viewer?.restore) await viewer.restore(buildViewerConfig(this.propWidget, !!this.editorMode))
        }
    },
    async mounted() {
        this.activeSelections = this.propActiveSelections
        await this.initPerspective()
        this.setEventListeners()
    },
    async unmounted() {
        this.removeEventListeners()
        const viewer = this.$refs.viewerRef as any
        if (viewer?.delete) await viewer.delete()
        if (this.perspectiveTable) await this.perspectiveTable.delete()
        this.perspectiveTable = null
    },
    methods: {
        ...mapActions(dashboardStore, ['setSelections', 'getCurrentDashboardView']),

        async initPerspective() {
            const viewer = this.$refs.viewerRef as any
            if (!viewer) return

            const worker = await getPerspectiveWorker()
            const rows = remapRows(this.dataToShow)
            // Create table — if no data yet, create from empty array (Perspective needs schema or data)
            this.perspectiveTable = rows.length > 0 ? await worker.table(rows) : await worker.table([{}])

            await viewer.load(this.perspectiveTable)
            await viewer.restore(buildViewerConfig(this.propWidget, !!this.editorMode))

            viewer.addEventListener('perspective-click', this.onCellClicked)
        },

        setEventListeners() {
            emitter.on('widgetResized', this.onResize)
            emitter.on('savePivotStates', this.saveState)
            emitter.on('loadPivotStates', this.loadState)
        },
        removeEventListeners() {
            emitter.off('widgetResized', this.onResize)
            emitter.off('savePivotStates', this.saveState)
            emitter.off('loadPivotStates', this.loadState)
            const viewer = this.$refs.viewerRef as any
            if (viewer) viewer.removeEventListener('perspective-click', this.onCellClicked)
        },

        async onResize() {
            const viewer = this.$refs.viewerRef as any
            if (viewer?.notifyResize) await viewer.notifyResize()
        },

        onCellClicked(event: any) {
            if (this.editorMode) return
            const detail = event.detail
            if (!detail) return

            // Perspective click gives: { row: { alias: value, ... }, column_names: string[], config: { filter: [...] } }
            // Build ISelection-compatible objects — one per column in the clicked row that matches a row/column field
            const rowFields: string[] = ((this.propWidget as any).fields?.rows ?? []).map((f: any) => f.alias)
            const colFields: string[] = ((this.propWidget as any).fields?.columns ?? []).map((f: any) => f.alias)
            const allDimensionFields = [...rowFields, ...colFields]

            const selections: ISelection[] = []
            const row = detail.row ?? {}
            const dataset = this.datasets?.[0]
            if (!dataset) return

            allDimensionFields.forEach((alias: string) => {
                if (alias in row) {
                    selections.push({
                        datasetId: dataset.id as number,
                        datasetLabel: dataset.label as string,
                        columnName: alias,
                        value: [String(row[alias])],
                        aggregated: false,
                        timestamp: new Date().getTime()
                    } as any)
                }
            })

            if (selections.length && this.propWidget.settings?.interactions?.selection?.enabled) {
                updateAllStoreSelections(selections, this.activeSelections, this.dashboardId, this.setSelections, (this as any).$http)
            }
        },

        async saveState() {
            const viewer = this.$refs.viewerRef as any
            if (!viewer?.save) return
            const dashboardViews = this.store.getCurrentDashboardView(this.dashboardId) as IDashboardView
            const widgetId = this.propWidget.id as string
            dashboardViews.settings.states[widgetId] = await viewer.save()
        },
        async loadState(stateToLoad: any) {
            const viewer = this.$refs.viewerRef as any
            if (!viewer?.restore) return
            const widgetId = this.propWidget.id as string
            const savedState = stateToLoad?.settings?.states?.[widgetId]
            if (savedState) await viewer.restore(savedState)
        }
    }
})
</script>

<style lang="scss">
.pivot-widget-perspective-container {
    display: flex;
    overflow: hidden;

    perspective-viewer {
        flex: 1;
        width: 100%;
        height: 100%;
    }
}
</style>
