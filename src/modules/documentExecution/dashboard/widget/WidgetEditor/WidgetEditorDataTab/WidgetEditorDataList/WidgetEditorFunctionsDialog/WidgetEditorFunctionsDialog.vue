<template>
    <Dialog class="p-fluid kn-dialog--toolbar--primary" :content-style="descriptor.dialog.style" :visible="visible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-0 p-col-12">
                <template #start>
                    {{ $t('dashboard.widgetEditor.catalogFunction') }}
                </template>
            </Toolbar>
        </template>

        <template #footer>
            <Button class="kn-button kn-button--primary" @click="closeDialog"> {{ $t('common.cancel') }}</Button>
            <Button class="kn-button kn-button--primary" data-test="save-button" @click="save"> {{ $t('common.save') }}</Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import Dialog from 'primevue/dialog'
import descriptor from './WidgetEditorFunctionsDialogDescriptor.json'
import FunctionsCatalogConfiguratorTab from './tabs/FunctionsCatalogConfiguratorTab/FunctionsCatalogConfiguratorTab.vue'
import FunctionsCatalogPreviewTable from './tabs/FunctionsCatalogPreviewTab/FunctionsCatalogPreviewTable.vue'
import FunctionsCatalogPreviewWarningDialog from './FunctionsCatalogPreviewWarningDialog.vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'

export default defineComponent({
    name: 'widget-editor-functions-dialog',
    components: { Dialog, FunctionsCatalogConfiguratorTab, FunctionsCatalogPreviewTable, FunctionsCatalogPreviewWarningDialog, TabView, TabPanel },
    props: { propFunction: { type: Object, required: true } },
    data() {
        return {
            descriptor,
            function: null as any
        }
    },
    computed: {},
    created() {},
    methods: {
        loadFunction() {},
        closeDialog() {
            this.$emit('close')
        },
        save() {
            console.log('----- SAVE CLICKED! ')
        }
    }
})
</script>
