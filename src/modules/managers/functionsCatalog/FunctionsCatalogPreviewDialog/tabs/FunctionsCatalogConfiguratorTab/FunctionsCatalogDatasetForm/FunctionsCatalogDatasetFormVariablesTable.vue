<template>
    <q-table flat dense :columns="columns" :rows="inputVariables" row-key="name" class="input-columns-table p-m-2">
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
        <template v-slot:body-cell-value="props">
            <q-td :props="props">
                <div class="p-d-flex p-flex-row p-ai-center">
                    <q-input v-if="props.row.type !== 'DATE'" dense class="col" filled v-model="props.row['value']" :type="props.row.type === 'NUMBER' ? 'number' : 'text'" @update:model-value="(value) => updateField(value, 'value', props.row)" />
                    <Calendar v-else v-model="props.row['value']" class="kn-flex" @date-select="(value) => updateField(value, 'value', props.row)"></Calendar>
                </div>
            </q-td>
        </template>
    </q-table>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { formatDate } from '@/helpers/commons/localeHelper'
import { iInputVariable } from '../../../../FunctionsCatalog'
import Calendar from 'primevue/calendar'

export default defineComponent({
    name: 'function-catalog-dateset-form-variables-table',
    components: { Calendar },
    props: { variables: { type: Array } },
    data() {
        return {
            inputVariables: [] as iInputVariable[],
            columns: [
                { name: 'name', label: this.$t('managers.functionsCatalog.variableName'), align: 'left', field: 'name', sortable: true },
                { name: 'type', label: this.$t('common.type'), align: 'left', field: 'type', sortable: true },
                { name: 'value', label: this.$t('common.value'), align: 'left', field: 'value', sortable: true, style: 'width: 400px' }
            ] as { name: string; label: string; align: 'left' | 'right' | 'center' | undefined; field: string; sortable: boolean; style?: string }[]
        }
    },
    watch: {
        variables() {
            this.loadInputVariables()
        }
    },
    created() {
        this.loadInputVariables()
    },
    methods: {
        loadInputVariables() {
            this.inputVariables = this.variables as iInputVariable[]
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
        getFormatedDate(date: any) {
            return formatDate(date, 'MM/DD/YYYY')
        },
        onCellEditComplete(event: any) {
            this.inputVariables[event.index] = event.newData
        },
        updateField(value: string | number | Date | null, field: string, row: iInputVariable) {
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
