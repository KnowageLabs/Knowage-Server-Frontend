<template>
    <q-card>
        <q-card-section class="q-pa-md">
            <knMonaco v-if="kpi?.definition" ref="editor" v-model="kpi.definition.formulaDecoded" language="kpiLang" style="height: 100px" :options="{ readOnly: true, fontSize: 18 }" text-to-insert=""></knMonaco>
        </q-card-section>
    </q-card>

    <q-card v-if="!loading && kpi.cardinality" class="q-mt-md">
        <q-table :rows="attributesList" :columns="tableColumns" row-key="name" flat class="cardinalityTable" :rows-per-page-options="[0]" hide-pagination>
            <template v-slot:body="props">
                <q-tr :props="props">
                    <q-td key="attribute" :props="props">
                        {{ props.row }}
                    </q-td>
                    <q-td v-for="measure in kpi.cardinality.measureList || []" :key="measure.measureName" :props="props">
                        <div v-if="measureHaveAttribute(props.row, measure)" class="measureCell" @click="toggleCell(props.row, measure)">
                            <q-icon v-if="!isEnabled(props.row, measure)" name="fa fa-ban" class="invalidCell" />
                            <q-icon v-if="measure.attributes[props.row]" name="fa fa-check" class="selectedCell" />
                            <q-icon v-if="measure.attributes[props.row] && !canDisable(props.row, measure)" name="fa fa-lock" class="selectedCell" />
                            <q-icon v-if="!measure.attributes[props.row] && isEnabled(props.row, measure)" name="fa fa-check" class="selectableCell" />
                        </div>
                    </q-td>
                </q-tr>
            </template>
        </q-table>
    </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import tabViewDescriptor from '../KpiDefinitionDetailDescriptor.json'
import { AxiosResponse } from 'axios'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

export default defineComponent({
    components: { knMonaco },
    props: {
        selectedKpi: {
            type: Object as any
        },
        updateMeasureList: Boolean,
        loading: Boolean
    },
    emits: ['touched', 'measureListUpdated'],
    data() {
        return {
            tabViewDescriptor,
            kpi: this.selectedKpi || ({} as any),
            attributesList: [] as any,
            currentCell: {} as any,
            formulaChanged: false,
            indexOfMeasure: -1,
            oldFormula: ''
        }
    },
    computed: {
        tableColumns() {
            const columns: Array<{
                name: string
                label: string
                field: string
                align: 'left' | 'center' | 'right'
                style?: string
            }> = [{ name: 'attribute', label: '', field: 'attribute', align: 'left' as const }]

            if (this.kpi?.cardinality?.measureList) {
                this.kpi.cardinality.measureList.forEach((measure: any) => {
                    columns.push({ name: measure.measureName, label: measure.measureName, field: measure.measureName, align: 'center' as const })
                })
            }

            return columns
        }
    },
    created() {
        if (this.selectedKpi) {
            this.kpi = this.selectedKpi
            if (this.kpi?.definition?.formulaSimple) this.oldFormula = this.kpi.definition.formulaSimple
        }

        if (this.updateMeasureList === true) {
            this.createFormulaToShow()
            this.getAllMeasure()
        }
    },
    watch: {
        selectedKpi() {
            this.kpi = this.selectedKpi as any
            this.oldFormula = this.kpi.definition.formulaSimple
        },
        updateMeasureList() {
            if (this.updateMeasureList === true) {
                this.createFormulaToShow()
                this.getAllMeasure()
            }
        }
    },
    methods: {
        createFormulaToShow() {
            if (this.kpi && this.kpi.definition && this.kpi.definition.formulaSimple) {
                if (this.oldFormula != this.kpi.definition.formulaSimple) {
                    this.formulaChanged = true
                    this.oldFormula = this.kpi.definition.formulaSimple
                }

                const string = this.kpi.definition.formulaSimple.split(' ')
                let count = 0
                let formuloaHTML = ''
                for (let i = 0; i < string.length; i++) {
                    let span = ''
                    if (string[i].trim() == '+' || string[i].trim() == '-' || string[i].trim() == '/' || string[i].trim() == '*' || string[i].trim() == '(' || string[i].trim() == ')' || string[i].trim() == '' || !isNaN(string[i])) {
                        span = "<span class='showFormula'>" + ' ' + string[i] + ' ' + '</span>'
                    } else {
                        span = "<span ng-class='{classBold:currentCell.row==" + i + "}' class='showFormula " + this.kpi.definition.functions[count] + "' id=M" + count + '>' + ' ' + string[i] + ' ' + '</span>'
                        count++
                    }
                    formuloaHTML += span
                }
                const formulas = document.getElementsByClassName('formula')
                if (formulas.length > 0) {
                    const arrFormulas = [...formulas]
                    arrFormulas.forEach((element) => (element.innerHTML = formuloaHTML))
                }
            }
        },

        getAllMeasure() {
            this.attributesList = []
            if (this.kpi.cardinality != undefined && this.kpi.cardinality != null) {
                if (typeof this.kpi.cardinality !== 'object') {
                    this.kpi.cardinality = JSON.parse(this.kpi.cardinality)
                }

                if (this.kpi.cardinality.measureList && Array.isArray(this.kpi.cardinality.measureList)) {
                    for (let i = 0; i < this.kpi.cardinality.measureList.length; i++) {
                        for (const tmpAttr in this.kpi.cardinality.measureList[i].attributes) {
                            if (this.attributesList.indexOf(tmpAttr) == -1) {
                                this.attributesList.push(tmpAttr)
                            }
                        }
                    }
                    this.retryNewAttributes()
                }
            }
        },

        async retryNewAttributes() {
            if (!this.kpi?.definition?.measures) return

            const definition = {}
            for (let i = 0; i < this.kpi.definition.measures.length; i++) {
                const meas = this.kpi.definition.measures[i]
                definition[i] = meas
            }

            await this.$http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/kpi/buildCardinalityMatrix', definition).then((response: AxiosResponse<any>) => {
                if (this.formulaChanged) {
                    this.kpi.cardinality.measureList = [...response.data]
                    this.formulaChanged = false
                    this.attributesList = []
                    for (let i = 0; i < response.data.length; i++) {
                        for (const key of Object.keys(response.data[i]['attributes'])) {
                            if (this.attributesList.indexOf(key) == -1) {
                                this.attributesList.push(key)
                            }
                        }
                    }
                }
                this.$emit('measureListUpdated')
            })
        },

        isEnabled(attr, measure) {
            const checkMs = this.checkMeasure(measure)
            return checkMs.status || this.isContainedByUpperSet(attr, measure, checkMs.itemNumber)
        },

        canDisable(attr, measure) {
            return !this.isContainedByUnderSet(attr, measure)
        },

        measureHaveAttribute(attr, measure) {
            // eslint-disable-next-line no-prototype-builtins
            return measure.attributes.hasOwnProperty(attr)
        },

        checkMeasure(measure) {
            let tot = 0
            for (const attr in measure.attributes) {
                if (measure.attributes[attr]) {
                    tot++
                }
            }
            const resp = {
                status: Object.keys(this.kpi.cardinality.checkedAttribute.attributeUnion).length == tot,
                itemNumber: tot
            }
            return resp
        },

        isContainedByUpperSet(attr, measure, measureItemNumber) {
            let upperSetAttributeNumber = 99999999
            let upperSet
            for (let i = 0; i < this.kpi.cardinality.measureList.length; i++) {
                const tmpMeas = this.kpi.cardinality.measureList[i]
                if (tmpMeas == measure) {
                    continue
                }
                let tmpTot = 0
                for (const tmpAttr in tmpMeas.attributes) {
                    if (tmpMeas.attributes[tmpAttr]) {
                        tmpTot++
                    }
                }
                if (tmpTot - 1 == measureItemNumber) {
                    upperSet = tmpMeas
                    break
                }
                if (tmpTot < upperSetAttributeNumber && tmpTot > measureItemNumber) {
                    upperSetAttributeNumber = tmpTot
                    upperSet = tmpMeas
                }
            }
            if (upperSet == undefined || upperSet.attributes[attr]) {
                return true
            } else {
                return false
            }
        },

        isContainedByUnderSet(attr, measure) {
            let measureItemNumber = 0
            for (const tmpattr in measure.attributes) {
                if (measure.attributes[tmpattr]) {
                    measureItemNumber++
                }
            }

            let underSetAttributeNumber = 0
            let underSet
            for (let i = 0; i < this.kpi.cardinality.measureList.length; i++) {
                const tmpMeas = this.kpi.cardinality.measureList[i]
                if (tmpMeas == measure) {
                    continue
                }
                let tmpTot = 0
                for (const tmpAttr in tmpMeas.attributes) {
                    if (tmpMeas.attributes[tmpAttr]) {
                        tmpTot++
                    }
                }
                if (tmpTot + 1 == measureItemNumber) {
                    underSet = tmpMeas
                    break
                }
                if (tmpTot > underSetAttributeNumber && tmpTot < measureItemNumber) {
                    underSetAttributeNumber = tmpTot
                    underSet = tmpMeas
                }
            }

            if (underSet == undefined || !underSet.attributes[attr]) {
                return false
            } else {
                return true
            }
        },

        getMaxAttributeNumber(data) {
            let max = 0
            for (const key in data) {
                if (data[key] >= max) {
                    max = data[key]
                }
            }
            return max
        },

        blinkMeasure(event, attr, index) {
            //blink measure in formula
            this.currentCell.row = attr
            this.currentCell.column = index
            this.indexOfMeasure = index
            const string = 'M' + this.indexOfMeasure
            const test = document.getElementById(string) as any
            test.css('background', '#eceff1')
        },

        removeblinkMeasure() {
            const string = 'M' + this.indexOfMeasure
            const test = document.getElementById(string) as any
            test.css('background', 'transparent')
        },

        toggleCell(attr, measure) {
            if (!measure.attributes[attr] && !this.isEnabled(attr, measure)) {
                return
            }
            if (measure.attributes[attr] && !this.canDisable(attr, measure)) {
                return
            }

            //toggle the value
            measure.attributes[attr] = !measure.attributes[attr]

            if (measure.attributes[attr]) {
                //update union
                if (this.kpi.cardinality.checkedAttribute.attributeUnion[attr]) {
                    this.kpi.cardinality.checkedAttribute.attributeUnion[attr]++
                } else {
                    this.kpi.cardinality.checkedAttribute.attributeUnion[attr] = 1
                }
            } else {
                if (this.kpi.cardinality.checkedAttribute.attributeUnion[attr] == 1) {
                    delete this.kpi.cardinality.checkedAttribute.attributeUnion[attr]
                } else {
                    this.kpi.cardinality.checkedAttribute.attributeUnion[attr]--
                }
            }
            //update intersection
            this.kpi.cardinality.checkedAttribute.attributeIntersection = {}
            const maxAttrNum = this.getMaxAttributeNumber(this.kpi.cardinality.checkedAttribute.attributeUnion)
            for (const key in this.kpi.cardinality.checkedAttribute.attributeUnion) {
                if (this.kpi.cardinality.checkedAttribute.attributeUnion[key] == maxAttrNum) {
                    this.kpi.cardinality.checkedAttribute.attributeIntersection[key] = true
                }
            }
        }
    }
})
</script>
<style lang="scss" scoped>
.cardinalityTable {
    width: 100%;
}

.cardinalityTable .measureCell {
    text-align: center;
    height: 30px;
    cursor: pointer;
}

.invalidCell {
    color: lightgray;
}

.selectedCell {
    color: green;
}

.selectableCell {
    color: lightgray;
}

.disabledCell {
    background-color: gray;
}
</style>
