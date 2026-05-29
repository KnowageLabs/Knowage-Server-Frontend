<template>
    <div v-if="limitModel" class="row q-col-gutter-sm q-mt-xs items-center">
        <div class="col-6">
            <q-input v-model.number="limitModel.itemsNumber" type="number" outlined dense :label="$t('dashboard.widgetEditor.highcharts.limit.itemsNumber')" :disable="limitSettingsDisabled" />
        </div>
        <div class="col-6 row items-center">
            <q-toggle v-model="limitModel.enabled" :label="$t('common.enable')" dense />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'highcharts-limit-settings',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            limitModel: null as any
        }
    },
    computed: {
        limitSettingsDisabled() {
            return this.limitModel && !this.limitModel.enabled
        }
    },
    created() {
        this.loadLimitModel()
    },
    methods: {
        loadLimitModel() {
            if (this.widgetModel.settings?.configuration?.limit) this.limitModel = this.widgetModel.settings.configuration.limit
            else this.limitModel = { enabled: false, itemsNumber: null }
        }
    }
})
</script>
