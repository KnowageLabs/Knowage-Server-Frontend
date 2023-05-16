<template>
    <KnMonaco v-model="widgetModel" :options="{ theme: 'vs-dark' }" language="json">{{ widgetModel }}</KnMonaco>
</template>

<script lang="ts">
import { mapActions } from 'pinia'
import { IDashboardDataset, ISelection, IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { defineComponent, PropType } from 'vue'
import mainStore from '@/App.store'
import KnMonaco from '@/components/UI/KnMonaco/knMonaco.vue'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

export default defineComponent({
    name: 'map-widget',
    components: { KnMonaco },
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        editorMode: { type: Boolean, required: false },
        datasets: { type: Array as PropType<IDashboardDataset[]>, required: true },
        dataToShow: { type: Object as any, required: true },
        propActiveSelections: { type: Array as PropType<ISelection[]>, required: true },
        dashboardId: { type: String, required: true },
        propVariables: { type: Array as PropType<IVariable[]>, required: true }
    },
    emits: ['launchSelection'],
    data() {
        return {
            widgetModel: {} as string,
            activeSelections: [] as ISelection[]
        }
    },
    watch: {
        propWidget: {
            handler() {
                this.loadWidgetModel()
            },
            deep: true
        },
        propActiveSelections() {
            this.loadActiveSelections()
        }
    },
    created() {
        this.loadWidgetModel()
        this.loadActiveSelections()
    },
    unmounted() {},
    methods: {
        ...mapActions(mainStore, ['setSelections']),
        ...mapActions(dashboardStore, ['getDashboardDrivers']),
        loadWidgetModel() {
            this.widgetModel = JSON.stringify(this.propWidget)
        },
        loadActiveSelections() {
            this.activeSelections = this.propActiveSelections
        }
    }
})
</script>
<style lang="scss"></style>
