<template>
    <q-table flat dense :columns="columns" :rows="rows" row-key="name" class="input-columns-table p-m-2" hide-bottom>
        <template v-slot:body-cell-name="props">
            <q-td :props="props">
                <span>{{ props.row.name }}</span>
            </q-td>
        </template>
        <template v-slot:body-cell-type="props">
            <q-td :props="props">
                <i class="p-mr-2" :class="getIconClass(props.row.type)"></i>
                <span>{{ props.row.type }}</span>
            </q-td>
        </template>
        <template v-slot:body-cell-dsColumn="props">
            <q-td :props="props">
                <q-select size="xs" dense filled v-model="props.row.dsColumn" emit-value outlined :options="datasetColumns" map-options @update:model-value="(val) => updateField(val, 'dsColumn', props.row)" />
            </q-td>
        </template>
    </q-table>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iInputColumn } from '../../../../FunctionsCatalog'

export default defineComponent({
    name: 'function-catalog-dateset-form-columns-table',
    components: {},
    props: { propRows: { type: Array as PropType<any[]> }, datasetColumns: { type: Array } },

    data() {
        return {
            rows: [] as iInputColumn[],
            columns: [
                { name: 'name', label: this.$t('managers.functionsCatalog.inputColumnName'), align: 'left', field: 'name', sortable: true },
                { name: 'type', label: this.$t('common.type'), align: 'left', field: 'type', sortable: true },
                { name: 'dsColumn', label: this.$t('managers.functionsCatalog.datasetColumn'), align: 'left', field: 'dsColumn', sortable: true, style: 'width: 400px' }
            ] as { name: string; label: string; align: 'left' | 'right' | 'center' | undefined; field: string; sortable: boolean; style?: string }[]
        }
    },
    watch: {
        propRows() {
            this.loadInputColumns()
        }
    },
    created() {
        this.loadInputColumns()
    },
    methods: {
        loadInputColumns() {
            this.rows = this.propRows as any[]
        },
        getIconClass(type: string) {
            switch (type) {
                case 'NUMBER':
                    return 'fa fa-hashtag'
                case 'STRING':
                    return 'fa fa-quote-right'
                case 'DATE':
                    return 'fa fa-calendar'
                default:
                    return ''
            }
        },
        updateField(value: string, field: string, row: iInputColumn) {
            row[field] = value
        }
    }
})
</script>

<style lang="scss">
.input-columns-table {
    .q-field--auto-height.q-field--dense .q-field__control,
    .q-field--auto-height.q-field--dense .q-field__native {
        min-height: 30px;
        height: 30px;
    }
    .q-field--dense .q-field__control,
    .q-field--dense .q-field__marginal {
        min-height: 30px;
        height: 30px;
    }
}
</style>
