<template>
    <q-dialog v-model="dialogVisible">
        <q-card>
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ attribute.attributeName }}</q-toolbar-title>
                <q-btn flat round dense icon="save" data-test="submit-button" @click="handleSubmit">
                    <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.save') }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="cancel" data-test="close-button" @click="closeDialog">
                    <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.cancel') }}</q-tooltip>
                </q-btn>
            </q-toolbar>
            <q-card-section class="row">
                <q-input dense outlined square class="col-12" v-model="filter" :placeholder="$t('common.search')">
                    <template v-slot:append>
                        <q-icon name="search" />
                    </template>
                </q-input>
                <q-table dense class="col-12" flat :rows="lovValues" :pagination="{ rowsPerPage: 20 }" :columns="cols" :filter="filter" row-key="id" v-model:selected="selectedLovValues" :selection="selectionMode"></q-table>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { FilterOperator } from 'primevue/api'
import { filterDefault } from '@/helpers/commons/filterHelper'
import { iAttribute } from '../UsersManagement'
import userAttributesLovValueDialogDescriptor from './UserAttributesLovValueDialogDescriptor.json'
import { AxiosResponse } from 'axios'
import mainStore from '@/App.store'
import { mapActions } from 'pinia'

export default defineComponent({
    name: 'lovs-value-dialog',
    props: {
        attribute: {
            type: Object as PropType<iAttribute>,
            required: true
        },
        dialogVisible: Boolean,
        selection: Object as PropType<any>
    },
    emits: ['closeDialog', 'saveLovValues'],
    data() {
        return {
            selectedLovValues: [] as Array<any> | Object | undefined,
            lovValues: [],
            userAttributesLovValueDialogDescriptor: userAttributesLovValueDialogDescriptor,
            selectionMode: 'multiple',
            filter: '' as string,
            filters: {
                global: [filterDefault],
                value: {
                    operator: FilterOperator.AND,
                    constraints: [filterDefault]
                }
            } as Object,
            cols: [{ name: 'value', field: 'value', label: this.$t('common.value'), sortable: true, align: 'left' }] as any[]
        }
    },
    watch: {
        attribute(newVal) {
            if (newVal) {
                this.selectedLovValues = this.attribute.multivalue ? [] : {}
                this.loadAttributeValue()
            }
        }
    },
    async mounted() {
        await this.loadAttributeValue()
    },
    methods: {
        ...mapActions(mainStore, ['setLoading']),
        async loadAttributeValue() {
            if (this.attribute?.lovId) {
                this.lovValues = []
                this.selectionMode = this.attribute.multivalue ? 'multiple' : 'single'
                this.selectedLovValues = []
                this.setLoading(true)
                await this.$http
                    .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/lovs/${this.attribute.lovId}/preview`)
                    .then((response: AxiosResponse<any>) => {
                        this.lovValues = response.data.map((lovValue, index) => {
                            return { value: lovValue.value || lovValue, id: index }
                        })
                        this.loadSelectedValues()
                    })
                    .finally(() => this.setLoading(false))
            }
        },
        loadSelectedValues() {
            if (this.attribute.multivalue) {
                this.selectedLovValues = []
                if (Array.isArray(this.selection)) {
                    const values = [] as Array<any>
                    this.selection.forEach((selValue) => {
                        const ind = this.lovValues.findIndex((lovValue) => lovValue.value == selValue)
                        if (ind >= 0) {
                            values.push(this.lovValues[ind])
                        }
                    })
                    this.selectedLovValues = values
                }
            } else {
                this.selectedLovValues = []
                if (this.selection[0]) this.selectedLovValues = [this.lovValues.find((lovValue) => lovValue.value == this.selection[0]?.value)]
            }
        },
        closeDialog() {
            this.$emit('closeDialog')
        },
        handleSubmit() {
            this.$emit('saveLovValues', this.selectedLovValues, this.selectionMode)
        }
    }
})
</script>
