<template>
    <div v-if="customMessagesModel" class="q-px-md q-pb-md">
        <div class="col-12 q-mb-sm">
            <q-toggle v-model="customMessagesModel.hideNoRowsMessage" :label="$t('dashboard.widgetEditor.customMessages.hideNoRowsAvailable')" @update:model-value="customMessagesChanged" dense />
        </div>
        <div class="col-12">
            <q-input v-model="customMessagesModel.noRowsMessage" :label="$t('dashboard.widgetEditor.customMessages.customEmptyRowsMessage')" outlined dense :disable="customMessagesModel.hideNoRowsMessage" @change="customMessagesChanged" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, ITableWidgetCustomMessages } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import descriptor from '../TableWidgetSettingsDescriptor.json'

export default defineComponent({
    name: 'table-widget-custom-messages',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            customMessagesModel: null as ITableWidgetCustomMessages | null
        }
    },
    created() {
        this.loadCustomMessages()
    },
    methods: {
        loadCustomMessages() {
            if (this.widgetModel?.settings?.configuration) this.customMessagesModel = this.widgetModel.settings.configuration.customMessages
        },
        customMessagesChanged() {
            emitter.emit('customMessagesChanged', this.customMessagesModel)
            emitter.emit('refreshTable', this.widgetModel.id)
        }
    }
})
</script>
