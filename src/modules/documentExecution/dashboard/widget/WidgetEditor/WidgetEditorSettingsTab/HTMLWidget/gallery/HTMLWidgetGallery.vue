<template>
    <div class="dashboard-card-shadow kn-height-full p-ml-1 p-d-flex p-flex-column">
        <div class="p-d-flex p-flex-row p-ai-center p-flex-wrap">
            <InputText v-model="searchWord" class="kn-material-input p-m-3 model-search" type="text" :placeholder="$t('common.search')" data-test="search-input" @input="searchItems" />
        </div>
        <div class="p-grid p-m-2 kn-flex kn-overflow dashboard-scrollbar">
            <Message v-if="galleryItems.length == 0" class="kn-flex p-m-2" severity="info" :closable="false">
                {{ $t('common.info.noDataFound') }}
            </Message>
            <template v-else>
                <GalleryCard v-for="(galleryItem, index) of filteredGallery" :key="index" :widget-model="widgetModel" :html-gallery-item-prop="galleryItem" @click="checkForTemplateContent(galleryItem)" />
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IGalleryItem } from '@/modules/documentExecution/Dashboard/Dashboard'
import Message from 'primevue/message'
import GalleryCard from './HTMLWidgetGalleryCard.vue'

export default defineComponent({
    name: 'html-widget-gallery',
    components: { Message, GalleryCard },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        dashboardId: { type: String, required: true },
        propGalleryItems: { type: Array as PropType<IGalleryItem[]>, required: true }
    },
    emits: ['galleryItemSelected'],
    data() {
        return {
            templateEditor: {} as any,
            searchWord: '',
            galleryItems: [] as IGalleryItem[],
            filteredGallery: [] as IGalleryItem[]
        }
    },
    watch: {},
    created() {
        this.loadWidgetEditors()
        this.loadGallery()
    },
    methods: {
        async loadGallery() {
            this.galleryItems = this.propGalleryItems
            this.filteredGallery = [...this.galleryItems] as IGalleryItem[]
        },
        loadWidgetEditors() {
            if (!this.widgetModel) return
            this.templateEditor = this.widgetModel.settings.editor
        },
        searchItems() {
            setTimeout(() => {
                if (!this.searchWord.trim().length) {
                    this.filteredGallery = [...this.galleryItems] as IGalleryItem[]
                } else {
                    this.filteredGallery = this.galleryItems.filter((el: IGalleryItem) => {
                        return el.label?.toLowerCase().includes(this.searchWord.toLowerCase()) || el.name?.toLowerCase().includes(this.searchWord.toLowerCase()) || this.galleryHasTag(el)
                    })
                }
            }, 250)
        },
        galleryHasTag(galleryItem: IGalleryItem) {
            let tagFound = false
            for (let i = 0; i < galleryItem.tags.length; i++) {
                const tempTag = galleryItem.tags[i]
                if (tempTag.toLowerCase().includes(this.searchWord.toLowerCase())) {
                    tagFound = true
                    break
                }
            }
            return tagFound
        },
        checkForTemplateContent(galleryItem: IGalleryItem) {
            if ((this.widgetModel.type === 'html' && (this.widgetModel.settings.editor.html.length > 0 || this.widgetModel.settings.editor.css.length > 0)) || (this.widgetModel.type === 'python' && this.widgetModel.settings.editor.script.length > 0)) {
                this.$confirm.require({
                    message: this.$t('dashboard.widgetEditor.galleryWarning'),
                    header: this.$t('common.toast.warning'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => this.loadGalleryItem(galleryItem)
                })
            } else this.loadGalleryItem(galleryItem)
        },
        loadGalleryItem(galleryItem: IGalleryItem) {
            if (this.widgetModel.type === 'html') {
                this.templateEditor.html = galleryItem.code.html
                this.templateEditor.css = galleryItem.code.css
            } else if (this.widgetModel.type === 'python') {
                this.templateEditor.script = galleryItem.code.python
            }
            this.$emit('galleryItemSelected')
        }
    }
})
</script>
