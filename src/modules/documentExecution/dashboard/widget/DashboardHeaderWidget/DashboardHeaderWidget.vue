<template>
    <div id="dashboard-renderer-header" class="dashboard-renderer-header" :style="`height: ${customHeaderHeight}`">
        <ProgressSpinner v-if="loading" class="custom-header-spinner" />
        <WebComponentContainer v-if="propWidget.type == 'html' && !loading" :prop-widget="propWidget" :widget-data="widgetData" :prop-active-selections="activeSelections" :editor-mode="true" :dashboard-id="dashboardId" :variables="variables"></WebComponentContainer>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import WebComponentContainer from '../WebComponent/WebComponentContainer.vue'
import { getWidgetData } from '../../DashboardDataProxy'
import { ISelection, IVariable, IWidget } from '../../Dashboard'
import deepcopy from 'deepcopy'
import { mapState, mapActions } from 'pinia'
import mainStore from '@/App.store'
import store from '../../Dashboard.store'
import { emitter } from '../../DashboardHelpers'

export default defineComponent({
    name: 'python-widget-container',
    components: { WebComponentContainer },
    props: {
        dashboardId: { type: String, required: true },
        propWidget: { type: Object as PropType<IWidget>, required: true },
        datasets: { type: Array as PropType<any[]>, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true }
    },
    emits: [],
    data() {
        return {
            widgetData: {} as any,
            activeSelections: [] as ISelection[],
            loading: false
        }
    },
    computed: {
        ...mapState(mainStore, {
            isEnterprise: 'isEnterprise'
        }),
        ...mapState(store, ['dashboards']),
        customHeaderHeight() {
            const height = this.propWidget.settings.configuration.customDashboardHeaderConfiguration.height
            if (height) return height
            else return 0
        }
    },
    created() {
        this.getWidgetData()
        this.setEventListeners()
    },
    mounted() {},
    unmounted() {
        this.unsetEventListeners()
    },
    methods: {
        ...mapActions(store, ['getDashboard', 'getSelections']),
        setEventListeners() {
            emitter.on('refreshWidgetWithData', this.getWidgetData)
        },
        unsetEventListeners() {
            emitter.off('refreshWidgetWithData', this.getWidgetData)
        },
        async getWidgetData() {
            this.loading = true
            this.widgetData = await getWidgetData(this.dashboardId, this.propWidget, this.datasets, this.$http, true, this.activeSelections, { searchText: '', searchColumns: [] }, this.dashboards[this.dashboardId].configuration)
            this.activeSelections = deepcopy(this.getSelections(this.dashboardId))
            this.loading = false
        }
    }
})
</script>

<style lang="scss" scoped>
.custom-header-spinner {
    width: 100%;
    height: 100%;
    background-color: var(--kn-color-default);
    box-shadow: 0px 0px 10px var(--kn-color-default);
    opacity: 0.8 !important;
    display: flex;
    &:before {
        padding-top: 0% !important;
    }
    .p-progress-spinner-svg {
        width: 100px;
        height: 100px;
    }
}
</style>
