<template>
    <Dialog class="kn-dialog--toolbar--primary" :visible="visible" :header="$t('dashboard.widgetEditor.map.qMenu.moveWidget')" :style="descriptor.dialogStyle" :closable="false" modal>
        <div class="p-field p-col-12 p-mt-4">
            <span class="p-float-label">
                <Dropdown v-model="selectedSheet" class="kn-material-input kn-width-full" :options="sheets" option-label="label" />
                <label for="type" class="kn-material-input-label">{{ $t('dashboard.sheet') }}</label>
            </span>
        </div>

        <template #footer>
            <div class="p-d-flex p-flex-row p-jc-end">
                <Button class="kn-button kn-button--primary" @click="closeDialog"> {{ $t('common.close') }}</Button>
                <Button class="kn-button kn-button--primary" :disabled="!selectedSheet" @click="save"> {{ $t('common.save') }}</Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { IDashboardSheet } from '../../Dashboard'
import Dialog from 'primevue/dialog'
import descriptor from './SheetPickerDialogDescriptor.json'
import Dropdown from 'primevue/dropdown'
import deepcopy from 'deepcopy'

export default defineComponent({
    name: 'sheet-picker-dialog',
    components: { Dialog, Dropdown },
    props: { visible: { required: true, type: Boolean }, propSheets: { type: Array as PropType<IDashboardSheet[]>, required: true }, activeSheet: { type: Object as PropType<IDashboardSheet>, required: true } },
    emits: ['close', 'sheetSelected'],
    data() {
        return {
            descriptor,
            sheets: [] as IDashboardSheet[],
            selectedSheet: null as IDashboardSheet | null
        }
    },
    computed: {},
    watch: {
        visible() {
            this.loadSheets()
        }
    },
    created() {
        this.loadSheets()
    },
    methods: {
        loadSheets() {
            this.sheets = deepcopy(this.propSheets)
            if (this.activeSheet) this.removeActiveSheetFromOptions()
        },
        removeActiveSheetFromOptions() {
            const index = this.sheets.findIndex((sheet: IDashboardSheet) => sheet.label === this.activeSheet.label)
            if (index !== -1) this.sheets.splice(index, 1)
        },
        closeDialog() {
            this.$emit('close')
            this.selectedSheet = null
        },
        save() {
            this.$emit('sheetSelected', this.selectedSheet)
        }
    }
})
</script>
