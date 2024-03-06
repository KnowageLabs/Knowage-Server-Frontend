<template>
    <Dialog id="olap-mdx-query-dialog" class="p-fluid kn-dialog--toolbar--primary" :style="olapMDXQueryDialogDescriptor.dialog.style" :visible="visible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-2 p-col-12">
                <template #start>
                    {{ $t('documentExecution.olap.showMdxQuery') }}
                </template>
            </Toolbar>
        </template>

        <knMonaco v-model="query" style="height: 400px" :options="{ wordWrap: 'on' }" language="mdx"></knMonaco>

        <template #footer>
            <Button class="kn-button kn-button--primary" @click="$emit('close')"> {{ $t('common.close') }}</Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Dialog from 'primevue/dialog'
import olapMDXQueryDialogDescriptor from './OlapMDXQueryDialogDescriptor.json'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

export default defineComponent({
    name: 'olap-custom-view-save-dialog',
    components: {
        Dialog,
        knMonaco
    },
    props: { mdxQuery: { type: String as PropType<string | null> } },
    emits: ['close'],
    data() {
        return {
            olapMDXQueryDialogDescriptor,
            query: null as string | null,
            codeMirror: {} as any,
            options: {
                mode: 'text/x-sql',
                lineWrapping: true,
                theme: 'eclipse',
                lineNumbers: true,
                readOnly: true
            },
            loading: false
        }
    },
    watch: {
        mdxQuery() {
            this.loadMdxQuery()
        }
    },
    created() {
        this.loadMdxQuery()
    },
    methods: {
        loadMdxQuery() {
            this.query = this.mdxQuery as string
        }
    }
})
</script>

<style lang="scss">
#olap-mdx-query-dialog .p-dialog-header,
#olap-mdx-query-dialog .p-dialog-content {
    padding: 0;
}
#olap-mdx-query-dialog .p-dialog-content {
    display: flex;
    flex-direction: column;
    flex: 1;
}
</style>
