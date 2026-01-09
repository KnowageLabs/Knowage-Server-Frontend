<template>
    <div class="import-export-gallery">
        <q-card class="p-my-2 p-d-flex">
            <q-input class="p-col-4" v-model="searchFilter" dense :placeholder="$t('common.search')" type="text">
                <template #prepend>
                    <q-icon name="search" />
                </template>
            </q-input>
        </q-card>

        <q-card class="p-d-flex p-flex-column kn-flex kn-overflow">
            <q-table class="sticky-header-table" ref="galleryTable" v-model:selected="selectedGalleryItems" :rows="filteredTemplates" :columns="columns" row-key="id" selection="multiple" :visible-columns="visibleColumns" virtual-scroll :pagination.sync="pagination" :rows-per-page-options="[0]" flat dense>
                <template #no-data>
                    <div class="full-width row flex-center text-accent q-gutter-sm p-py-4" style="height: 85vh">
                        <q-icon size="2em" name="warning" />
                        <span>{{ $t('common.info.noDataFound') }}</span>
                    </div>
                </template>
                <template #body-cell-type="props">
                    <q-td :props="props">
                        <q-chip dense square class="type-chip" :style="iconStyle(props.row.type)" size="sm">{{ props.row.type?.toUpperCase() }}</q-chip>
                    </q-td>
                </template>
                <template #body-cell-tags="props">
                    <q-td :props="props">
                        <q-chip v-for="(tag, index) in props.row.tags" :key="index" dense size="sm" class="importExportTags q-mr-xs">{{ tag }}</q-chip>
                    </q-td>
                </template>
                <template #body-cell-image="props">
                    <q-td :props="props">
                        <q-btn v-if="props.row.image && props.row.image.length > 0" flat dense round icon="image" @click="togglePreview(props.row.id)" />
                    </q-td>
                </template>
            </q-table>
        </q-card>

        <q-dialog v-model="previewVisible">
            <q-card>
                <q-card-section>
                    <q-img :src="currentImage" contain style="min-width: 320px; min-height: 240px" />
                </q-card-section>
                <q-card-actions>
                    <q-btn flat color="primary" :label="$t('common.close')" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import importExportDescriptor from '../ImportExportDescriptor.json'
import { IGalleryTemplate } from '@/modules/managers/galleryManagement/GalleryManagement'
import type { ISelectedItems } from '../ImportExportTypes'

export default defineComponent({
    name: 'import-export-gallery',
    props: { selectedItems: { type: Object as () => ISelectedItems, required: true } },
    emits: ['onItemSelected', 'update:loading'],
    data() {
        return {
            currentImage: '',
            previewVisible: false,
            searchFilter: '',
            importExportDescriptor: importExportDescriptor,
            selectedGalleryItems: [],
            templates: [] as Array<IGalleryTemplate>,
            FUNCTIONALITY: 'gallery',
            visibleColumns: ['name', 'type', 'tags', 'image'],
            pagination: {
                rowsPerPage: 0
            }
        }
    },
    computed: {
        columns(): any[] {
            const columnConfig = this.importExportDescriptor.export.gallery.column
            const order = ['name', 'type', 'tags', 'image']

            return order.map((key) => {
                const conf = columnConfig[key]
                const align = conf?.style?.['text-align'] ? conf.style['text-align'].replace('center', 'center').replace('left', 'left') : 'left'
                return { name: key, field: conf?.field || key, label: this.$t(conf.header), align, sortable: key !== 'image' }
            })
        },
        filteredTemplates(): IGalleryTemplate[] {
            if (!this.searchFilter) return this.templates

            const searchLower = this.searchFilter.toLowerCase()
            return this.templates.filter((template) => {
                const nameMatch = template.name?.toLowerCase().includes(searchLower)
                const typeMatch = template.type?.toLowerCase().includes(searchLower)
                const tagsMatch = Array.isArray(template.tags) ? template.tags.some((tag) => tag.toLowerCase().includes(searchLower)) : false
                return nameMatch || typeMatch || tagsMatch
            })
        }
    },
    watch: {
        selectedGalleryItems(newVal, oldVal) {
            if (oldVal !== newVal) {
                this.$emit('onItemSelected', { items: this.selectedGalleryItems, functionality: this.FUNCTIONALITY })
            }
        },
        selectedItems: {
            handler(newVal) {
                const selected = newVal?.[this.FUNCTIONALITY] || []
                this.selectedGalleryItems = selected
            },
            deep: true
        }
    },
    created() {
        this.loadAllTemplates()
    },
    methods: {
        loadAllTemplates(): void {
            this.$emit('update:loading', true)
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + '/api/1.0/widgetgallery')
                .then((response: AxiosResponse<any>) => {
                    this.templates = response.data
                    if (this.selectedItems && this.selectedItems[this.FUNCTIONALITY]) {
                        this.selectedGalleryItems = this.selectedItems[this.FUNCTIONALITY].filter((element) => {
                            return this.templates.some((el) => el.id === element.id)
                        })
                    }
                })
                .catch((error) => console.error('[ImportExportGallery] loadAllTemplates error', error))
                .finally(() => {
                    this.$emit('update:loading', false)
                })
        },
        togglePreview(id: string): void {
            this.currentImage = ''
            this.previewVisible = true

            this.$http.get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + '/api/1.0/widgetgallery/image/' + id).then(
                (response: AxiosResponse<any>) => {
                    this.currentImage = response.data
                },
                (error) => console.error('[ImportExportGallery] togglePreview error', error)
            )
        },
        iconStyle(type: string) {
            return this.importExportDescriptor.iconTypesMap[type] ? this.importExportDescriptor.iconTypesMap[type].style : {}
        }
    }
})
</script>

<style lang="scss" scoped>
.import-export-gallery {
    display: flex;
    flex-direction: column;
    height: 95vh;
}

.sticky-header-table {
    height: 100%;
    :deep(thead tr th) {
        position: sticky;
        z-index: 1;
        background-color: #ffffff;
        top: 0;
    }

    :deep(tbody) {
        scroll-margin-top: 48px;
    }
}

.importExportTags {
    background-color: var(--kn-color-default);
}

.type-chip {
    color: #ffffff;
}
</style>
