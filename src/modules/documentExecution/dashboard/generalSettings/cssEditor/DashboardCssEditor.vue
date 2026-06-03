<template>
    <div class="q-px-md q-pb-xs">
        <div class="row q-col-gutter-sm">
            <div class="col-12" style="height: 600px">
                <KnMonaco v-model="dashboardConfig.cssToRender" :options="{ theme: 'vs-light' }" :language="'css'" style="height: 100%" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import descriptor from '../DashboardGeneralSettingsDescriptor.json'
import KnMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

export default defineComponent({
    name: 'dashboard-variables',
    components: { KnMonaco },
    props: {
        dashboardModelProp: {
            type: Object as any,
            default() {
                return {}
            }
        }
    },
    data() {
        return {
            descriptor,
            dashboard: {} as any,
            dashboardConfig: null as any
        }
    },
    watch: {},
    created() {
        this.loadProps()
    },
    methods: {
        loadProps() {
            this.dashboard = this.dashboardModelProp
            if (!this.dashboard.configuration?.cssToRender) this.dashboard.configuration.cssToRender = ''
            this.dashboardConfig = this.dashboard.configuration
        }
    }
})
</script>
