<template>
    <div class="layers-management-filters">
        <div v-if="layer" class="p-grid">
            <div class="p-col">
                <Toolbar class="kn-toolbar kn-toolbar--secondary">
                    <template #start>
                        {{ $t('managers.layersManagement.layerFilter') }}
                    </template>
                </Toolbar>
                <Listbox class="kn-list layers-management-property-container" :options="filters" :filter="true" :filter-placeholder="$t('common.search')" option-label="property" filter-match-mode="contains" :filter-fields="layersManagementFilterTabDescriptor.filterFields" :empty-filter-message="$t('common.info.noDataFound')" data-test="available-properties-list">
                    <template #empty>{{ $t('common.info.noDataFound') }}</template>
                    <template #option="slotProps">
                        <div class="kn-list-item" @click="addProperty(slotProps.option)">
                            <div class="kn-list-item-text">
                                <span :data-test="'available-property-' + slotProps.option.property">{{ slotProps.option.property }}</span>
                            </div>
                        </div>
                    </template>
                </Listbox>
            </div>
            <div class="p-col">
                <Toolbar class="kn-toolbar kn-toolbar--secondary">
                    <template #start>
                        {{ $t('managers.layersManagement.layerFilterAdded') }}
                    </template>
                </Toolbar>
                <Listbox class="kn-list layers-management-property-container" :options="layer.properties" :filter="true" :filter-placeholder="$t('common.search')" option-label="property" filter-match-mode="contains" :filter-fields="layersManagementFilterTabDescriptor.filterFields" :empty-filter-message="$t('common.info.noDataFound')" data-test="selected-properties-list">
                    <template #empty>{{ $t('managers.layersManagement.noFilterSelected') }}</template>
                    <template #option="slotProps">
                        <div class="kn-list-item" @click="removeProperty(slotProps.option)">
                            <div class="kn-list-item-text">
                                <span>{{ slotProps.option.property }}</span>
                            </div>
                        </div>
                    </template>
                </Listbox>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iFilter, iLayer } from '../../LayersManagement'
import layersManagementFilterTabDescriptor from './LayersManagementFilterTabDescriptor.json'
import Listbox from 'primevue/listbox'
import { mapActions } from 'pinia'
import mainStore from '@/App.store'
import { AxiosResponse } from 'axios'

export default defineComponent({
    name: 'layers-management-filter-tab',
    components: { Listbox },
    props: { selectedLayer: { type: Object as PropType<iLayer>, required: true }, propFilters: { type: Array as PropType<iFilter[]> } },
    emits: ['touched'],
    data() {
        return {
            layersManagementFilterTabDescriptor,
            layer: null as iLayer | null,
            filters: [] as iFilter[]
        }
    },
    watch: {
        selectedLayer() {
            this.loadLayer()
            this.loadFilters()
        },
        propFilters() {
            this.loadFilters()
        }
    },
    mounted() {
        this.loadLayer()
        this.loadFilters()
    },
    methods: {
        ...mapActions(mainStore, ['setLoading']),
        loadLayer() {
            this.layer = this.selectedLayer
        },
        async loadFilters() {
            if (this.layer) {
                this.setLoading(true)
                this.filters = []
                await this.$http
                    .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/layers/getFilter?label=${this.layer.label}`)
                    .then((response: AxiosResponse<any>) => {
                        response.data?.forEach((filter: iFilter) => {
                            const index = this.layer?.properties.findIndex((property: iFilter) => property.property === filter.property)
                            if (index === -1) this.filters.push(filter)
                        })
                    })
                    .finally(() => this.setLoading(false))
            }
        },
        addProperty(filter: iFilter) {
            this.moveProperty(filter, this.filters, this.layer?.properties)
        },
        removeProperty(filter: iFilter) {
            this.moveProperty(filter, this.layer?.properties, this.filters)
        },
        moveProperty(filter: iFilter, sourceList, targetList) {
            const index = sourceList.findIndex((tempFilter: iFilter) => tempFilter.property === filter.property)
            if (index !== -1) {
                targetList.push(filter)
                sourceList.splice(index, 1)
                this.$emit('touched')
            }
        }
    }
})
</script>

<style lang="scss" scoped>
.layers-management-filters {
    :deep(.p-card-body) {
        padding: 0;
        .p-card-content {
            padding: 0;
        }
    }
    .layers-management-property-container {
        border: 1px solid var(--kn-color-borders);
        border-top: none;
    }
}
</style>
