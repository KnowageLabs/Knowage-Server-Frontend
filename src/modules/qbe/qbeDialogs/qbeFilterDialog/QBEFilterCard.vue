<template>
    <div v-if="filter">
        <div class="row q-gutter-sm q-ma-sm">
            <q-input filled v-model="filter.leftOperandDescription" class="col-3" :label="$t('common.field')" :disable="true" />

            <q-select class="col" v-model="filter.operator" :label="$t('qbe.filters.condition')" :options="filterOperatorOptions" :option-label="(option) => getFilterOperatorLabel(option.value)" option-value="value" map-options emit-value filled @update:model-value="onFilterOperatorChange" />

            <q-input v-if="filter.operator === 'SPATIAL_NN'" filled v-model="filter.operatorParameter" class="col-4" :label="$t('common.parameter')" />

            <q-select
                v-if="filter.operator !== 'IS NULL' && filter.operator !== 'NOT NULL'"
                class="col-3"
                v-model="filter.rightType"
                :label="$t('qbe.filters.targetType')"
                :options="['STARTS WITH', 'NOT STARTS WITH', 'ENDS WITH', 'NOT ENDS WITH', 'CONTAINS', 'NOT CONTAINS', 'BETWEEN', 'NOT BETWEEN'].includes(filter.operator) ? [targetValues[0]] : targetValues"
                option-value="value"
                option-label="label"
                map-options
                emit-value
                filled
                @update:model-value="onFilterTypeChange"
            />
            <template v-if="!['BETWEEN', 'NOT BETWEEN', 'IS NULL', 'NOT NULL', 'IN', 'NOT IN'].includes(filter.operator)">
                <q-input v-if="filter.rightType === 'manual' && field.dataType !== 'java.sql.Timestamp' && field.dataType !== 'java.sql.Date'" v-model="filter.rightOperandDescription" filled class="col" :label="$t('qbe.filters.target')" @update:model-value="onManualValueChange" />

                <q-input class="col" v-if="filter.rightType === 'anotherEntity'" readonly v-model="filter.rightOperandDescription" @update:model-value="onEntityTypeChanged" filled :label="$t('qbe.filters.target')">
                    <template v-slot:append>
                        <q-btn round flat icon="search">
                            <q-menu>
                                <q-list dense style="min-width: 100px">
                                    <q-item v-for="entity in entities" clickable :key="entity.id">
                                        <q-item-section>{{ entity.text }}</q-item-section>
                                        <q-item-section side>
                                            <q-icon name="keyboard_arrow_right" />
                                        </q-item-section>
                                        <q-menu anchor="top end" self="top start">
                                            <q-list>
                                                <q-item v-for="child in entity.children" :key="child.id" dense clickable v-close-popup @click="filter.rightOperandDescription = child.attributes.longDescription">
                                                    <q-item-section>{{ child.text }}</q-item-section>
                                                </q-item>
                                            </q-list>
                                        </q-menu>
                                    </q-item>
                                </q-list></q-menu
                            >
                        </q-btn>
                    </template>
                </q-input>
            </template>
            <template v-if="filter.rightType === 'manual' && ['BETWEEN', 'NOT BETWEEN'].includes(filter.operator) && field.dataType !== 'java.sql.Timestamp' && field.dataType !== 'java.sql.Date'">
                <q-input class="col-1" v-model="firstOperand" filled :label="$t('qbe.filters.lowLimit')" @update:model-value="onManualBetweenChange" />
                <q-input class="col-1" v-model="secondOperand" filled :label="$t('qbe.filters.highLimit')" @update:model-value="onManualBetweenChange" />
            </template>
            <div v-if="filter.rightType === 'manual' && ['IN', 'NOT IN'].includes(filter.operator) && field.dataType !== 'java.sql.Timestamp' && field.dataType !== 'java.sql.Date'" class="col">
                <label class="kn-material-input-label"> {{ $t('qbe.filters.enterValue') }} </label>
                <Chips v-model="multiManualValues" class="kn-material-input" :add-on-blur="true" @add="onManualMultivalueChanged" @remove="onManualMultivalueChanged" />
            </div>
            <div v-if="filter.rightType === 'valueOfField' && ['IN', 'NOT IN'].includes(filter.operator) && field.dataType !== 'java.sql.Timestamp'" class="col">
                <Chip v-for="(selectedValue, index) in selectedValues" :key="index" class="p-mr-1">{{ selectedValue }}</Chip>
            </div>
            <q-select v-if="filter.rightType === 'subquery' && !['IN', 'NOT IN'].includes(filter.operator)" filled v-model="filter.rightOperandDescription" class="col" :options="subqueries" option-value="name" option-label="name" @update:model-value="onSubqeryTargetChange" />

            <q-select v-if="filter.rightType === 'parameter' && !['IN', 'NOT IN'].includes(filter.operator)" filled v-model="filter.rightOperandDescription" class="col" :options="parameters" option-value="name" option-label="name" @update:model-value="onParameterTargetChange" />

            <template v-if="filter.rightType === 'manual' && (field.dataType === 'java.sql.Timestamp' || field.dataType === 'java.sql.Date') && filter.operator !== 'IS NULL' && filter.operator !== 'NOT NULL'">
                <q-input filled v-model="targetDate" class="col" @update:model-value="onManualTimestampChange">
                    <template v-slot:prepend>
                        <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-date v-model="targetDate" :mask="field.dataType === 'java.sql.Timestamp' ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY'" @update:model-value="onManualTimestampChange">
                                    <div class="row items-center justify-end">
                                        <q-btn v-close-popup label="Close" color="primary" flat />
                                    </div>
                                </q-date>
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                    <template v-slot:append v-if="field.dataType === 'java.sql.Timestamp'">
                        <q-icon name="access_time" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-time v-model="targetDate" mask="DD/MM/YYYY HH:mm" format24h @update:model-value="onManualTimestampChange">
                                    <div class="row items-center justify-end">
                                        <q-btn v-close-popup label="Close" color="primary" flat />
                                    </div>
                                </q-time>
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>

                <template v-if="['BETWEEN', 'NOT BETWEEN'].includes(filter.operator)" @update:model-value="onManualTimestampEndDateChange">
                    <q-input filled v-model="targetEndDate" class="col">
                        <template v-slot:prepend>
                            <q-icon name="event" class="cursor-pointer">
                                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                    <q-date v-model="targetEndDate" mask="DD/MM/YYYY HH:mm" @update:model-value="onManualTimestampEndDateChange">
                                        <div class="row items-center justify-end">
                                            <q-btn v-close-popup label="Close" color="primary" flat />
                                        </div>
                                    </q-date>
                                </q-popup-proxy>
                            </q-icon>
                        </template>

                        <template v-slot:append v-if="field.dataType === 'java.sql.Timestamp'">
                            <q-icon name="access_time" class="cursor-pointer">
                                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                    <q-time v-model="targetEndDate" mask="DD/MM/YYYY HH:mm" format24h>
                                        <div class="row items-center justify-end">
                                            <q-btn v-close-popup label="Close" color="primary" flat />
                                        </div>
                                    </q-time>
                                </q-popup-proxy>
                            </q-icon>
                        </template>
                    </q-input>
                </template>
            </template>
            <q-btn flat size="sm" icon="search" v-if="filter.rightType === 'valueOfField'" @click="loadFilterValues" />
            <q-btn flat size="sm" icon="backspace" @click="$emit('removeFilter', filter)" />
        </div>
        <QBEFilterValuesTable v-show="filter.rightType === 'valueOfField'" class="p-m-2" :filter-values-data="filterValuesData" :loaded-selected-values="selectedValues" :loading="loading" :filter-operator="filter.operator" @selected="setSelectedValues"></QBEFilterValuesTable>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { AxiosResponse } from 'axios'
import { iFilter } from '../../QBE'
import Calendar from 'primevue/calendar'
import CascadeSelect from 'primevue/cascadeselect'
import Chip from 'primevue/chip'
import Chips from 'primevue/chips'
import Dropdown from 'primevue/dropdown'
import QBEFilterDialogDescriptor from './QBEFilterDialogDescriptor.json'
import QBEFilterValuesTable from './QBEFilterValuesTable.vue'
import moment from 'moment'

export default defineComponent({
    name: 'qbe-filter-card',
    components: { Calendar, CascadeSelect, Chip, Chips, Dropdown, QBEFilterValuesTable },
    props: { propFilter: { type: Object as PropType<iFilter> }, id: { type: String }, propEntities: { type: Array }, subqueries: { type: Array, required: true }, field: { type: Object, required: true }, propParameters: { type: Array } },
    emits: ['removeFilter'],
    data() {
        return {
            QBEFilterDialogDescriptor,
            filter: null as iFilter | null,
            targetValues: [
                {
                    label: this.$t('qbe.filters.targets.manual'),
                    value: 'manual'
                },
                {
                    label: this.$t('qbe.filters.targets.value'),
                    value: 'valueOfField'
                },
                {
                    label: this.$t('qbe.filters.targets.entity'),
                    value: 'anotherEntity'
                }
            ],
            selectedValues: [] as string[],
            filterValuesData: null,
            anotherEntityValue: '',
            entities: [] as any[],
            firstOperand: '',
            secondOperand: '',
            multiManualValues: [] as string[],
            targetDate: null as Date | null,
            targetEndDate: null as Date | null,
            parameters: [] as any[],
            loading: false,
            filterOperatorOptions: [] as { label: string; value: string }[],
            chips: [] as string[]
        }
    },
    watch: {
        propFilter() {
            this.loadFilter()
        },
        propEntities() {
            this.loadEntities()
        },
        propParameters() {
            this.loadParameters()
        }
    },
    created() {
        this.loadEntities()
        this.loadFilter()
        this.loadParameters()
    },
    methods: {
        loadFilter() {
            this.filter = this.propFilter as iFilter

            let isEncrypted = false
            if (this.field.attributes) {
                isEncrypted = this.field.attributes.decrypt
            } else {
                isEncrypted = this.field.decrypt
            }

            if (this.subqueries?.length > 0) {
                this.targetValues.push({
                    label: this.$t('qbe.filters.targets.subquery'),
                    value: 'subquery'
                })
            }

            this.formatFilter()

            if (isEncrypted) {
                this.filterOperatorOptions = this.QBEFilterDialogDescriptor.operatorValues.filter((operator) => operator.allowedWithDecrypt)
            } else {
                this.filterOperatorOptions = this.QBEFilterDialogDescriptor.operatorValues
            }

            const tempEntity = this.getEntity() as any
            if (tempEntity?.iconCls === 'geographic_dimension') {
                this.filterOperatorOptions = this.filterOperatorOptions.concat(this.QBEFilterDialogDescriptor.spatialOperatorValues)
            }
        },
        getEntity() {
            let entity = null
            for (let i = 0; i < this.entities.length && !entity; i++) {
                for (let j = 0; j < this.entities[i].children.length; j++) {
                    if (this.entities[i].children[j].id === this.field.id) {
                        entity = this.entities[i]
                        break
                    }
                }
            }

            return entity
        },
        loadEntities() {
            this.entities = this.propEntities ? [...this.propEntities] : []
        },
        loadParameters() {
            this.parameters = this.propParameters as any[]
            if (this.parameters.length > 0) {
                this.targetValues.push({
                    label: this.$t('common.parameter'),
                    value: 'parameter'
                })
            }
        },
        async formatFilter() {
            switch (this.filter?.rightType) {
                case 'manual':
                    this.filter.rightOperandType = 'Static Content'

                    if (['java.sql.Timestamp'].includes(this.field.dataType)) {
                        this.targetDate = this.filter.rightOperandValue[0] ? moment(this.filter.rightOperandValue[0], 'DD/MM/YYYY HH:mm').toDate() : new Date()
                        this.onManualTimestampChange()
                        if (['BETWEEN', 'NOT BETWEEN'].includes(this.filter.operator)) {
                            this.targetEndDate = this.filter.rightOperandValue[1] ? moment(this.filter.rightOperandValue[1], 'DD/MM/YYYY HH:mm').toDate() : new Date()
                        }
                    } else if (['java.sql.Date'].includes(this.field.dataType)) {
                        this.targetDate = this.filter.rightOperandValue[0] ? moment(this.filter.rightOperandValue[0], 'DD/MM/YYYY').toDate() : new Date()
                        this.onManualTimestampChange()
                        if (['BETWEEN', 'NOT BETWEEN'].includes(this.filter.operator)) {
                            this.targetEndDate = this.filter.rightOperandValue[1] ? moment(this.filter.rightOperandValue[1], 'DD/MM/YYYY').toDate() : new Date()
                        }
                    } else {
                        if (['BETWEEN', 'NOT BETWEEN'].includes(this.filter.operator)) {
                            this.firstOperand = this.filter.rightOperandValue[0]
                            this.secondOperand = this.filter.rightOperandValue[1]
                        } else if (['IN', 'NOT IN'].includes(this.filter.operator)) {
                            this.multiManualValues = [...this.filter.rightOperandValue]
                        }
                    }

                    this.filter.hasParam = false
                    this.filter.paramName = ''
                    break
                case 'valueOfField':
                    this.filter.rightOperandType = 'Static Content'
                    this.selectedValues = this.filter.rightOperandValue.filter((el: any) => el !== '')

                    this.filter.hasParam = false
                    this.filter.paramName = ''
                    break
                case 'anotherEntity':
                    this.filter.rightOperandType = 'Field Content'
                    this.filter.hasParam = false
                    this.filter.paramName = ''
                    break
                case 'subquery':
                    this.filter.rightOperandType = 'Subquery'
                    this.filter.hasParam = false
                    this.filter.paramName = ''
                    break
                case 'parameter':
                    this.filter.rightOperandType = 'Static Content'
                    break
            }
        },
        onFilterOperatorChange() {
            if (!this.filter) return

            if (['STARTS WITH', 'NOT STARTS WITH', 'ENDS WITH', 'NOT ENDS WITH', 'CONTAINS', 'NOT CONTAINS', 'BETWEEN', 'NOT BETWEEN'].includes(this.filter.operator)) {
                this.filter.rightType = 'manual'
            }

            if (this.filter.rightType === 'manual') {
                this.filter.rightOperandDescription = ''
                this.multiManualValues = []
                this.firstOperand = ''
                this.secondOperand = ''
                this.targetDate = null
                this.targetEndDate = null
            } else if (this.filter.rightType === 'valueOfField') {
                this.selectedValues = []
            }

            if (this.filter.operator !== 'SPATIAL_NN') {
                delete this.filter.operatorParameter
            }
            this.resetFilterRightOperandValues()
        },
        onManualValueChange() {
            if (this.filter) {
                this.filter.rightOperandValue = [this.filter.rightOperandDescription]
            }
        },
        onManualBetweenChange() {
            if (this.filter) {
                this.filter.rightOperandValue = [this.firstOperand, this.secondOperand]
                this.filter.rightOperandDescription = this.firstOperand + ' ---- ' + this.secondOperand
            }
        },
        onManualMultivalueChanged() {
            if (this.filter) {
                this.filter.rightOperandValue = [...this.multiManualValues]
                this.filter.rightOperandDescription = this.multiManualValues.join(' ---- ')
            }
        },
        async onFilterTypeChange() {
            if (this.filter) {
                this.resetFilterRightOperandValues()
                this.selectedValues = []
                this.filterValuesData = null
                this.firstOperand = ''
                this.secondOperand = ''
                this.multiManualValues = []
                this.formatFilter()

                if (this.filter.rightType === 'valueOfField') {
                    await this.loadFilterValues()
                }
            }
        },
        resetFilterRightOperandValues() {
            if (this.filter) {
                this.filter.rightOperandDescription = ''
                this.filter.rightOperandLongDescription = ''
                this.filter.rightOperandValue = ['']
                this.filter.rightOperandAlias = ''
            }
        },
        async loadFilterValues() {
            this.loading = true
            let tempLeftOperand = this.filter?.leftOperandValue?.expression ? this.filter?.leftOperandValue?.expression : this.filter?.leftOperandValue
            await this.$http
                .post(`${import.meta.env.VITE_KNOWAGEQBE_CONTEXT}/servlet/AdapterHTTP?ACTION_NAME=GET_VALUES_FOR_QBE_FILTER_LOOKUP_ACTION&ENTITY_ID=${tempLeftOperand}&SBI_EXECUTION_ID=${this.id}`, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' }
                })
                .then((response: AxiosResponse<any>) => (this.filterValuesData = response.data))
            this.loading = false
        },
        setSelectedValues(selected: string[]) {
            this.selectedValues = selected
            if (this.filter) {
                this.filter.rightOperandValue = selected
                this.filter.rightOperandDescription = selected.join(' ---- ')
                this.filter.rightOperandLongDescription = selected.join(' ---- ')
            }
        },
        onEntityTypeChanged() {
            if (this.filter) {
                const selectedField = this.findSelectedField(this.filter.rightOperandDescription) as any

                this.filter.rightOperandValue = [selectedField?.id]
                this.filter.rightOperandLongDescription = this.filter.rightOperandDescription
                this.filter.rightOperandAlias = selectedField.text
            }
        },
        findSelectedField(fieldDescription: string) {
            let tempField = null

            for (let i = 0; i < this.entities.length && !tempField; i++) {
                for (let j = 0; j < this.entities[i].children.length; j++) {
                    if (this.entities[i].children[j].attributes.longDescription === fieldDescription) {
                        tempField = this.entities[i].children[j]
                        break
                    }
                }
            }

            return tempField
        },
        onSubqeryTargetChange() {
            if (!this.filter || !this.subqueries) return

            const index = this.subqueries.findIndex((subquery: any) => subquery.name === this.filter?.rightOperandDescription)
            if (index !== -1) {
                const subquery = this.subqueries[index] as any
                this.filter.rightOperandValue = [subquery.id]
                this.filter.rightOperandLongDescription = 'Subquery ' + subquery.name
            }
        },
        onManualTimestampChange() {
            const format = this.field.dataType === 'java.sql.Date' ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm'
            if (this.filter) {
                this.filter.rightOperandDescription = moment(this.targetDate, format).format(format)
                this.filter.rightOperandValue[0] = moment(this.targetDate, format).format(format)
            }
        },
        onManualTimestampEndDateChange() {
            const format = this.field.dataType === 'java.sql.Date' ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm'
            if (this.filter) {
                this.filter.rightOperandValue[1] = moment(this.targetEndDate, format).format(format)
            }
        },
        onParameterTargetChange() {
            if (this.filter) {
                this.filter.hasParam = true
                this.filter.paramName = this.filter.rightOperandDescription
                this.filter.rightOperandValue = ['$P{' + this.filter.rightOperandDescription + '}']
                this.filter.rightOperandLongDescription = 'Static Content ' + '$P{' + this.filter.rightOperandDescription + '}'
            }
        },
        getFilterOperatorLabel(value: string) {
            for (let i = 0; i < this.filterOperatorOptions.length; i++) {
                if (this.filterOperatorOptions[i].value === value) {
                    return this.$t(this.filterOperatorOptions[i].label)
                }
            }
            return ''
        }
    }
})
</script>

<style lang="scss">
.qbe-filter-option-value {
    text-transform: capitalize;
}

.qbe-filter-chip-container {
    border-bottom: 1px solid #c2c2c2;
    min-height: 2.775rem;
}

.qbe-filter-time-input {
    flex: 0.3;
}
</style>
