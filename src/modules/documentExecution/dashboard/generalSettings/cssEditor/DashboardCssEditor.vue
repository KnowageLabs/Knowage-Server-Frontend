<template>
    <div class="p-d-flex p-flex-column kn-flex p-mr-3 p-my-3 dashboard-card-shadow kn-overflow dashboard-scrollbar">
        <label class="kn-material-input-label p-m-3"> {{ $t('dashboard.generalSettings.css') }}</label>
        <KnMonaco v-model="dashboardConfig.cssToRender" :options="{ theme: 'vs-light' }" :language="'css'" />
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
            dashboardConfig: null as any
        }
    },
    watch: {},
    created() {
        this.dashboardConfig = this.dashboardModelProp.configuration
    },
    methods: {}
})
</script>
