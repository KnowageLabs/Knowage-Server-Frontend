<template>
    <Dialog class="kn-dialog--toolbar--primary" :visible="visible" :header="$t('dashboard.widgetEditor.map.qMenu.moveWidget')" :style="descriptor.dialogStyle" :closable="false" modal>
        <div class="p-field p-col-12">
            <span class="p-float-label">
                <Dropdown v-model="selectedSheet" class="kn-material-input kn-width-full" :options="sheets" />
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
import { defineComponent } from 'vue'
import Dialog from 'primevue/dialog'
import descriptor from './SheetPickerDialogDescriptor.json'
import Dropdown from 'primevue/dropdown'

export default defineComponent({
    name: 'sheet-picker-dialog',
    components: { Dialog, Dropdown },
    props: { visible: { required: true, type: Boolean } },
    emits: ['close', 'sheetSelected'],
    data() {
        return {
            descriptor,
            sheets: [] as string[],
            selectedSheet: null as string | null
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
            if (!this.propSearch) return
            this.searchText = this.propSearch.searchText
            this.searchColumns = [...this.propSearch.searchColumns]
        },
        closeDialog() {
            this.$emit('close')
        },
        save() {
            this.$emit('sheetSelected', this.selectedSheet)
        }
    }
})
</script>
