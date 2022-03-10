<template>
    <Dialog id="qbe-having-dialog" class="p-fluid kn-dialog--toolbar--primary" :style="QBEHavingDialogDescriptor.dialog.style" :visible="visible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-2 p-col-12">
                <template #start>
                    {{ $t('qbe.having.title') }}
                </template>

                <template #end>
                    <KnFabButton icon="fas fa-plus" @click="addNewHaving"></KnFabButton>
                </template>
            </Toolbar>
        </template>

        <Message class="p-mx-4" severity="info" :closable="false" :style="QBEHavingDialogDescriptor.styles.message">
            {{ $t('qbe.having.infoMessage') }}
        </Message>

        <Message v-if="havings.length === 0" class="p-mx-4 p-my-2" severity="info" :closable="false" :style="QBEHavingDialogDescriptor.styles.message">
            {{ $t('qbe.having.noHavings') }}
        </Message>
        <div>
            <QBEHavingCard v-for="having in havings" :key="having.filterId" :propHaving="having" :entities="entities" @removeHaving="removeHaving"></QBEHavingCard>
        </div>

        <template #footer>
            <Button class="kn-button kn-button--primary" @click="closeDialog"> {{ $t('common.cancel') }}</Button>
            <Button class="kn-button kn-button--primary" @click="save"> {{ $t('common.save') }}</Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iField, iQuery, iFilter } from '../../QBE'
import Dialog from 'primevue/dialog'
import KnFabButton from '@/components/UI/KnFabButton.vue'
import Message from 'primevue/message'
import QBEHavingDialogDescriptor from './QBEHavingDialogDescriptor.json'
import QBEHavingCard from './QBEHavingCard.vue'

const crypto = require('crypto')

export default defineComponent({
    name: 'qbe-having-dialog',
    components: { Dialog, KnFabButton, Message, QBEHavingCard },
    props: { visible: { type: Boolean }, havingDialogData: { type: Object as PropType<{ field: iField; query: iQuery }> }, entities: { type: Array } },
    emits: ['save', 'close'],
    data() {
        return {
            QBEHavingDialogDescriptor,
            havings: [] as any[],
            nextHavingIndex: -1
        }
    },
    watch: {
        havingDialogData() {
            this.loadData()
        }
    },
    created() {
        this.loadData()
    },
    methods: {
        loadData() {
            if (!this.havingDialogData || !this.havingDialogData.field || !this.havingDialogData.query) return

            this.havings = this.havingDialogData.query.havings ? [...this.havingDialogData.query.havings] : []
            this.nextHavingIndex = crypto.randomBytes(16).toString('hex')
        },
        addNewHaving() {
            const field = this.havingDialogData?.field
            if (field) {
                this.havings.push({
                    filterId: 'having' + this.nextHavingIndex,
                    filterDescripion: 'having' + this.nextHavingIndex,
                    filterInd: this.nextHavingIndex,
                    promptable: false,
                    leftOperandAggregator: field.funct,
                    leftOperandValue: field.id,
                    leftOperandDescription: field.entity + ': ' + field.funct + ' (' + field.alias + ')',
                    leftOperandLongDescription: field.entity + ': ' + field.funct + ' (' + field.alias + ')',
                    leftOperandType: 'Field Content',
                    leftOperandDefaultValue: null,
                    leftOperandLastValue: null,
                    operator: 'EQUALS TO',
                    rightOperandAggregator: '',
                    rightOperandValue: [],
                    rightOperandDescription: '',
                    rightOperandLongDescription: '',
                    rightOperandType: 'Static Content',
                    rightType: '',
                    rightOperandDefaultValue: [''],
                    rightOperandLastValue: [''],
                    booleanConnector: 'AND',
                    deleteButton: false,
                    color: '',
                    entity: field.entity
                })
                this.nextHavingIndex = crypto.randomBytes(16).toString('hex')
            }
        },
        removeHaving(having: iFilter) {
            const index = this.havings.findIndex((el: iFilter) => el.filterId === having.filterId)
            if (index !== -1) this.havings.splice(index, 1)
        },
        closeDialog() {
            this.$emit('close')
        },
        save() {
            this.$emit('save', this.havings, this.havingDialogData?.field)
        }
    }
})
</script>

<style lang="scss">
#qbe-having-dialog .p-dialog-header,
#qbe-having-dialog .p-dialog-content {
    padding: 0;
}
#qbe-having-dialog .p-dialog-content {
    display: flex;
    flex-direction: column;
    flex: 1;
}
</style>