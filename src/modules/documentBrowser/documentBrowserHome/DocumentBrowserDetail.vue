<template>
    <div class="column no-wrap full-height">
        <DocumentBrowserTable :prop-documents="documents" :search-mode="searchMode" @selected="setSelectedDocument" @itemSelected="$emit('itemSelected', $event)" />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import DocumentBrowserTable from './tables/DocumentBrowserTable.vue'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'document-browser-detail',
    components: { DocumentBrowserTable },
    props: { propDocuments: { type: Array }, breadcrumbs: { type: Array }, searchMode: { type: Boolean } },
    emits: ['breadcrumbClicked', 'itemSelected', 'documentSelected'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            documents: [] as any[]
        }
    },
    watch: {
        propDocuments() {
            this.loadDocuments()
            this.$emit('documentSelected', null)
        }
    },
    created() {
        this.loadDocuments()
    },
    methods: {
        loadDocuments() {
            this.documents = this.propDocuments as any[]
        },
        setSelectedDocument(document: any) {
            this.$emit('documentSelected', document)
        }
    }
})
</script>

<style lang="scss" scoped>
.full-height {
    height: 100%;
}
</style>
