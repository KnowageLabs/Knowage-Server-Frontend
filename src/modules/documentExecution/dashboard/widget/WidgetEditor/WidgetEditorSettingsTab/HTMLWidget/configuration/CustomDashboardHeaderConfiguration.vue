<template>
    <div v-if="customDashboardHeaderConfiguration" class="p-ai-center kn-flex p-p-4">
        <form class="p-fluid p-formgrid p-grid">
            <div class="p-field p-col-12 p-lg-12">
                <span class="p-float-label">
                    <InputText v-model="customDashboardHeaderConfiguration.height" class="kn-material-input p-inputtext-sm kn-flex" />
                    <label class="kn-material-input-label p-mr-2">{{ $t('common.height') }}</label>
                </span>
            </div>
        </form>
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
