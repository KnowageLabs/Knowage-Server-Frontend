<template>
    <Dialog id="olap-sorting-dialog" class="p-fluid kn-dialog--toolbar--primary" :style="olapSortingDialogDescriptor.dialog.style" :visible="visible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-2 p-col-12">
                <template #start>
                    {{ $t('documentExecution.olap.sidebar.sortingSettings') }}
                </template>
            </Toolbar>
        </template>

        <div v-if="olap" class="p-m-4">
            <div v-for="(mode, index) in olapSortingDialogDescriptor.sortingModes" :key="index" class="p-field-radiobutton">
                <RadioButton v-model="sortingMode" name="sorting" :value="mode" />
                <label>{{ mode }}</label>
            </div>

            <div v-if="sortingMode === 'count'" class="p-field">
                <span class="p-float-label">
                    <InputText id="sortingCount" v-model.trim="sortingCount" type="number" class="kn-material-input" :min="1" />
                </span>
            </div>
        </div>

        <template #footer>
            <Button class="kn-button kn-button--primary" data-test="save-button" @click="save"> {{ $t('common.save') }}</Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iOlap } from '../Olap'
import Dialog from 'primevue/dialog'
import olapSortingDialogDescriptor from './OlapSortingDialogDescriptor.json'
import RadioButton from 'primevue/radiobutton'

export default defineComponent({
    name: 'olap-custom-view-save-dialog',
    components: { Dialog, RadioButton },
    props: { sbiExecutionId: { type: String }, olap: { type: Object as PropType<iOlap> } },
    emits: ['save'],
    data() {
        return {
            olapSortingDialogDescriptor,
            sortingMode: 'no sorting',
            sortingCount: 10
        }
    },
    created() {},
    methods: {
        save() {
            if (this.sortingMode !== 'count' || this.sortingCount < 1) {
                this.sortingCount = 10
            }
            this.$emit('save', { sortingMode: this.sortingMode, sortingCount: this.sortingCount })
        }
    }
})
</script>

<style lang="scss">
#olap-sorting-dialog .p-dialog-header,
#olap-sorting-dialog .p-dialog-content {
    padding: 0;
}

#olap-sorting-dialog .p-dialog-content {
    display: flex;
    flex-direction: column;
    flex: 1;
}
</style>
