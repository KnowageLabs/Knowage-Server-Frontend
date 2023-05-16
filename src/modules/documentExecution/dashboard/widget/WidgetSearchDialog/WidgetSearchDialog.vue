<template>
    <Dialog class="kn-dialog--toolbar--primary" :visible="visible" :header="$t('dashboard.widgetEditor.searchInTableWidget')" :style="descriptor.dialogStyle" :closable="false" modal>
        <div v-if="widget" class="p-formgrid p-grid p-p-3">
            <Message class="p-text-center p-col-12 p-p-1" severity="info" :closable="false">{{ $t('dashboard.widgetEditor.searchInTableWidgetHint') }}</Message>

            <div class="p-float-label p-col-12 p-fluid p-p-4">
                <InputText v-model="searchText" class="kn-material-input kn-width-full" />
                <label class="kn-material-input-label">{{ $t('common.search') }}</label>
            </div>

            <div class="p-field p-float-label p-col-12 p-fluid p-p-4">
                <MultiSelect v-model="searchColumns" :options="columnOptions" option-label="columnName" option-value="columnName"> </MultiSelect>
                <label for="attributes" class="kn-material-input-label"> {{ $t('common.columns') }} </label>
            </div>
        </div>

        <template #footer>
            <div class="p-d-flex p-flex-row p-jc-end">
                <Button class="kn-button kn-button--primary" @click="closeDialog"> {{ $t('common.close') }}</Button>
                <Button class="kn-button kn-button--primary" :disabled="searchButtonDisabled" @click="search"> {{ $t('common.search') }}</Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '../../Dashboard'
import Dialog from 'primevue/dialog'
import descriptor from './WidgetSearchDialogDescriptor.json'
import Message from 'primevue/message'
import MultiSelect from 'primevue/multiselect'

export default defineComponent({
    name: 'widget-search-dialog',
    components: { Dialog, Message, MultiSelect },
    props: { visible: { required: true, type: Boolean }, widget: { type: Object as PropType<IWidget>, required: true }, propSearch: { type: Object as PropType<{ searchText: string; searchColumns: string[] }>, required: true } },
    emits: ['close', 'search'],
    data() {
        return {
            descriptor,
            searchText: '',
            searchColumns: [] as string[]
        }
    },
    computed: {
        columnOptions() {
            if (!this.widget || !this.widget.columns) return []
            return this.widget.columns.filter((column: IWidgetColumn) => column.fieldType === 'ATTRIBUTE' && column.type.includes('String'))
        },
        searchButtonDisabled() {
            return this.searchColumns.length === 0
        }
    },
    watch: {
        visible() {
            this.loadSearchValues()
        },
        propSearch() {
            this.loadSearchValues()
        }
    },
    created() {
        this.loadSearchValues()
    },
    methods: {
        loadSearchValues() {
            if (!this.propSearch) return
            this.searchText = this.propSearch.searchText
            this.searchColumns = [...this.propSearch.searchColumns]
        },
        closeDialog() {
            this.$emit('close')
        },
        search() {
            this.$emit('search', { searchText: this.searchText, searchColumns: [...this.searchColumns] })
        }
    }
})
</script>
