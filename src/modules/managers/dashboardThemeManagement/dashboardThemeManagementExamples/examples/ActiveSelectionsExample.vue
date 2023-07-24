<template>
    <div class="p-d-flex p-flex-row p-flex-wrap active-selections-container">
        <div v-for="(activeSelection, index) of activeSelections" :key="index" class="active-selections-chip">
            <span>{{ activeSelection.datasetLabel }}</span>
            <span class="p-mx-2">{{ activeSelection.columnName }}</span>
            <span>{{ activeSelection.value.join() }}</span>
            <Button v-tooltip.left="$t('common.delete')" icon="fas fa-trash-alt" class="p-button-text p-button-rounded p-button-plain" :disabled="false" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ISelection } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'active-selections-example',
    components: {},
    emits: ['close'],
    data() {
        return {
            activeSelections: [
                { datasetId: 1, datasetLabel: 'TEST_02', columnName: 'QUARTER', value: ['Q2'], aggregated: false, timestamp: 1689937296670 },
                { datasetId: 1, datasetLabel: 'TEST_02', columnName: 'QUARTER', value: ['Q4'], aggregated: false, timestamp: 1689937296671 },
                { datasetId: 2, datasetLabel: 'TEST_04', columnName: 'PRODUCT_FAMILY', value: ['FOOD', 'CAR'], aggregated: false, timestamp: 16899372966702 }
            ] as ISelection[]
        }
    },
    created() {},
    methods: {}
})
</script>

<style lang="scss" scoped>
.active-selections-container {
    height: 40px;
}
.active-selections-chip {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
    padding: 2px 8px;
    background-color: #ccc;
    margin-right: 4px;
    margin-bottom: 4px;
    line-height: 30px;
    border-radius: 50px;
    outline: none;
    height: 25px;
}
</style>
