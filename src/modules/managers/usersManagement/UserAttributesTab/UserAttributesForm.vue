<template>
    <q-card>
        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
            <q-toolbar-title>{{ $t('managers.usersManagement.attributes') }}</q-toolbar-title>
        </q-toolbar>
        <q-card-section class="row q-gutter-sm" v-if="attributes && userAttributesForm">
            <q-list class="col-12">
                <q-item v-for="attribute in attributes" :key="attribute.attributeId">
                    <q-item-section v-if="userAttributesForm[attribute.attributeId]">
                        <div class="row q-gutter-sm">
                            <q-banner v-if="attribute.required && !userAttributesForm[attribute.attributeId][attribute.attributeName]" rounded dense class="bg-warning text-center">
                                <template v-slot:avatar>
                                    <q-icon name="warning" />
                                </template>
                                {{ $t('managers.usersManagement.requiredAttributeInfo', { attributeName: attribute.attributeName }) }}
                            </q-banner>
                            <q-input dense filled class="col" v-model="userAttributesForm[attribute.attributeId][attribute.attributeName]" :label="attribute.attributeName + (attribute.required ? ' *' : '')" :maxLength="attribute.maxLength" @update:model-value="onInputChange(attribute, $event)">
                                <template v-slot:before>
                                    <q-icon name="label" />
                                </template>
                            </q-input>
                            <q-btn round flat v-if="attribute.lovId" icon="edit" @click="openLovValuesDialog(attribute)">
                                <q-tooltip>{{ $t('common.edit') }}</q-tooltip>
                            </q-btn>
                            <q-btn round flat icon="backspace" @click="eraseAttribute(attribute)">
                                <q-tooltip>{{ $t('common.clear') }}</q-tooltip>
                            </q-btn>
                        </div>
                    </q-item-section>
                </q-item>
            </q-list>
        </q-card-section>
    </q-card>
    <UserAttributesLovValueDialog :attribute="selectedAttribute" :selection="initialSelection" :dialog-visible="lovDialogVisible" @saveLovValues="onSaveLovValues" @closeDialog=";(lovDialogVisible = false), (selectedAttribute = null)"> </UserAttributesLovValueDialog>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iAttribute } from '../UsersManagement'
import UserAttributesLovValueDialog from './UserAttributesLovValueDialog.vue'

export default defineComponent({
    components: { UserAttributesLovValueDialog },
    props: {
        attributes: {
            type: Object as PropType<iAttribute[]>,
            required: true
        },
        modelValue: {
            type: Object as any,
            required: true
        }
    },
    data() {
        return {
            selectedAttribute: null as iAttribute | null,
            lovDialogVisible: false,
            userAttributesForm: {},
            initialSelection: null as any
        }
    },
    mounted() {
        this.userAttributesForm = { ...this.modelValue }
    },
    updated() {
        this.userAttributesForm = { ...this.modelValue }
    },
    methods: {
        onInputChange(attribute: iAttribute, value) {
            const newValue = this.modelValue ? { ...this.modelValue } : {}
            newValue[attribute.attributeId][attribute.attributeName] = value
            this.$emit('update:modelValue', newValue)
            this.$emit('formDirty')
        },
        eraseAttribute(attr: iAttribute) {
            this.onInputChange(attr, '')
        },
        openLovValuesDialog(attribute: iAttribute) {
            // const path_matcher = /\{;\{[A-Za-z0-9;_]*\}*/g
            this.selectedAttribute = attribute
            let value: any = null
            value = this.userAttributesForm[attribute.attributeId][attribute.attributeName] as string

            this.initialSelection = []
            if (value) {
                if (this.selectedAttribute.multivalue) {
                    if (this.selectedAttribute.syntax) {
                        const match = /(?<=\{;\{)[A-Za-z0-9;_]*(?!\}\})/
                        if (match.test(value)) {
                            const ind = value.indexOf('{;{')
                            const indEnd = value.indexOf('}}')
                            this.initialSelection = value.substring(ind + 3, indEnd).split(';')
                        }
                    } else {
                        this.initialSelection = value.split(',')?.map((val) => val.substring(1, val.length - 1))
                    }
                } else {
                    this.initialSelection = [{ value: value, id: 0 }]
                }
            }

            this.lovDialogVisible = true
        },
        onSaveLovValues(selectedLovValues, selectionMode) {
            debugger
            let newValue = ''
            if (this.selectedAttribute && selectionMode === 'multiple') {
                if (this.selectedAttribute.syntax) {
                    newValue = selectedLovValues.reduce((prev, curr, ind) => {
                        prev += ind > 0 ? ';' : ''
                        prev += curr.value
                        return prev
                    }, '')
                    newValue = `{;{${newValue}}}`
                } else {
                    newValue = selectedLovValues.reduce((prev, curr, ind) => {
                        prev += ind > 0 ? ',' : ''
                        prev += `'${curr.value}'`
                        return prev
                    }, '')
                }
            } else {
                newValue = selectedLovValues[0].value || ''
            }
            if (this.selectedAttribute) {
                this.onInputChange(this.selectedAttribute, newValue)
            }
            this.lovDialogVisible = false
            this.selectedAttribute = null
        }
    }
})
</script>
