<template>
    <div v-if="customDashboardHeaderConfiguration" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm">
            <div class="col-6">
                <q-input v-model="customDashboardHeaderConfiguration.height" outlined dense :label="$t('common.height')" hide-bottom-space />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { ICustomDashboardHeaderConfiguration } from '@/modules/documentExecution/dashboard/interfaces/DashboardHTMLWidget'

export default defineComponent({
    name: 'custom-dashboard-header-configuration',
    components: {},
    props: {
        widgetModel: { type: Object as PropType<IWidget | null>, required: true }
    },
    emits: ['styleChanged'],
    data() {
        return {
            customDashboardHeaderConfiguration: null as ICustomDashboardHeaderConfiguration | null
        }
    },
    computed: {},
    mounted() {
        this.loadCustomHeaderConfiguration()
    },
    unmounted() {},
    methods: {
        loadCustomHeaderConfiguration() {
            if (this.widgetModel?.settings?.configuration?.customDashboardHeaderConfiguration) this.customDashboardHeaderConfiguration = this.widgetModel.settings.configuration.customDashboardHeaderConfiguration
        },
        titleStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        }
    }
})
</script>
