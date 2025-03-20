<template>
    <Card class="p-m-2">
        <template #header>
            <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                <q-toolbar-title>{{ $t('managers.cacheManagement.runtimeInformationTitle') }}</q-toolbar-title>

                <q-btn flat round dense icon="refresh" data-test="refresh-button" @click="refresh">
                    <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.refresh') }}</q-tooltip>
                </q-btn>
            </q-toolbar>
        </template>
        <template #content>
            <div class="p-d-flex p-flex-column">
                <q-table dense flat hide-pagination hide-header :rows="rows" :columns="columns" row-key="label">
                    <template #body-cell-value="props">
                        <q-td v-if="typeof props.row.value === 'boolean'">
                            <q-icon :name="props.value ? 'thumb_up' : 'remove_circle'">
                                <q-tooltip>{{ $t(props.value ? 'common.enabled' : 'common.disabled') }}</q-tooltip>
                            </q-icon>
                        </q-td>
                        <q-td v-else>{{ props.value }}</q-td>
                    </template>
                </q-table>
                <div class="kn-flex p-d-flex p-flex-row p-justify-center">
                    <div style="position: relative; height: 20rem; width: 20rem">
                        <Chart type="pie" :data="cacheData" data-test="chart" />
                    </div>
                </div>
            </div>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iCache } from '../../CacheManagement'
import Card from 'primevue/card'
import Chart from 'primevue/chart'

export default defineComponent({
    name: 'runtime-information-card',
    components: {
        Card,
        Chart
    },
    props: {
        item: {
            type: Object,
            required: true
        },
        chartData: {
            type: Object,
            required: true
        }
    },
    emits: ['refresh'],
    data() {
        return {
            cache: {} as iCache,
            cacheData: this.loadChart(),
            columns: [
                { name: 'label', label: 'label', field: 'label', align: 'left' },
                { name: 'value', label: 'value', field: 'value', align: 'left' }
            ] as any,
            rows: [] as any
        }
    },
    computed: {
        totalMemory(): string {
            return (this.cache.totalMemory / 1048576).toFixed(2) + ' MB'
        },
        availableMemory(): string {
            return (this.cache.availableMemory / 1048576).toFixed(2) + ' MB'
        }
    },
    watch: {
        item() {
            this.loadCache()
        },
        chartData() {
            this.loadChart()
        }
    },
    created() {
        this.loadCache()
    },
    methods: {
        loadCache() {
            this.cache = { ...this.item } as iCache
            this.updateRows()
        },
        loadChart() {
            this.cacheData = {
                labels: [this.$t('managers.cacheManagement.availableMemory'), this.$t('managers.cacheManagement.usedMemory')],
                datasets: [
                    {
                        backgroundColor: ['#43749e', '#bbd6ed'],
                        data: this.chartData
                    }
                ]
            }
        },
        updateRows() {
            this.rows = [
                { label: this.$t('managers.cacheManagement.cacheEnabled'), value: this.cache.cleaningEnabled },
                { label: this.$t('managers.cacheManagement.totalMemory'), value: this.totalMemory },
                { label: this.$t('managers.cacheManagement.availableMemory'), value: this.availableMemory },
                { label: this.$t('managers.cacheManagement.numberOfCachedObjects'), value: this.cache.cachedObjectsCount },
                { label: this.$t('managers.cacheManagement.availableMemoryPercentage'), value: this.cache.availableMemoryPercentage }
            ]
        },
        refresh() {
            this.$emit('refresh')
            this.updateRows()
        }
    }
})
</script>
