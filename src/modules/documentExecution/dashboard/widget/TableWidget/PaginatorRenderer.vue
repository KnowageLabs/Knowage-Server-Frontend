<template>
    <Paginator
        v-if="propWidgetPagination && propWidgetPagination.properties"
        v-model:first="pagination.properties.offset"
        class="kn-table-widget-paginator"
        :style="paginatorCss"
        :rows="propWidgetPagination.properties.itemsNumber"
        :total-records="propWidgetPagination.properties.totalItems"
        template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        style="color: red !important"
        @page="onPage($event)"
    />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Paginator from 'primevue/paginator'
import { ITableWidgetPagination } from '../../Dashboard'

export default defineComponent({
    components: {
        Paginator
    },
    props: {
        propWidget: { type: Object as any, required: true },
        propWidgetPagination: { type: Object as PropType<ITableWidgetPagination>, required: true }
    },
    emits: ['pageChanged'],
    data() {
        return {
            pagination: {} as any
        }
    },
    computed: {
        paginatorCss() {
            if (this.propWidget.settings.style.paginator)
                return {
                    '--color': this.propWidget.settings.style.paginator.color,
                    '--background-color': this.propWidget.settings.style.paginator['background-color'],
                    '--justify-content': this.propWidget.settings.style.paginator['justify-content']
                }
            else
                return {
                    '--color': 'gray',
                    '--background-color': 'white',
                    '--justify-content': 'flex-end'
                }
        }
    },
    watch: {
        propWidgetPagination() {
            this.pagination = this.propWidgetPagination
        }
    },
    created() {
        this.pagination = this.propWidgetPagination
    },
    methods: {
        onPage(event: any) {
            this.$emit('pageChanged', { paginationStart: event.first, paginationLimit: event.rows, paginationEnd: event.first + event.rows })
        }
    }
})
</script>
<style lang="scss" scoped>
.kn-table-widget-paginator {
    background-color: var(--background-color);
    justify-content: var(--justify-content);
    .p-paginator-element,
    .p-paginator-current {
        color: var(--color);
    }
    &:deep(.p-paginator-element) {
        color: var(--color);
    }
    &:deep(.p-paginator-current) {
        color: var(--color);
    }
}
</style>
