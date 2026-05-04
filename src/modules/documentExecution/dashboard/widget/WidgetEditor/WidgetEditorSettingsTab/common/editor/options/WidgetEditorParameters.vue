<template>
    <q-select v-model="selectedDriver" outlined dense :options="drivers" option-value="urlName" option-label="name" emit-value map-options :label="$t('common.parameter')" @update:model-value="onDriverValueChanged" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IDashboardDriver } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapActions } from 'pinia'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

export default defineComponent({
    name: 'widget-editor-parameters',
    components: {},
    props: {
        dashboardId: { type: String, required: true }
    },
    emits: ['insertChanged'],
    data() {
        return {
            selectedDriver: '',
            drivers: [] as IDashboardDriver[]
        }
    },
    created() {
        this.loadDrivers()
    },
    methods: {
        ...mapActions(dashboardStore, ['getDashboardDrivers']),
        loadDrivers() {
            this.drivers = this.getDashboardDrivers(this.dashboardId)
        },
        onDriverValueChanged() {
            const forInsert = `[kn-parameter='${this.selectedDriver}']`
            this.$emit('insertChanged', forInsert)
        }
    }
})
</script>
