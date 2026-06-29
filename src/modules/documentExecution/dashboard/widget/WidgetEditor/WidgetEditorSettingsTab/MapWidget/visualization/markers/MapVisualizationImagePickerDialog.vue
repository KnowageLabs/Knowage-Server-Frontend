<template>
    <q-dialog :model-value="visible" persistent @hide="$emit('close')">
        <q-card style="min-width: 560px; max-width: 720px; width: 90vw">
            <q-card-section class="row items-center q-pb-sm">
                <div class="text-h6">{{ $t('dashboard.widgetEditor.map.imagesGallery') }}</div>
                <q-space />
                <q-btn flat round dense icon="upload" @click="($refs.fileInput as HTMLInputElement).click()">
                    <q-tooltip>{{ $t('common.upload') }}</q-tooltip>
                </q-btn>
            </q-card-section>

            <q-separator />

            <div style="min-height: 200px; max-height: 480px; overflow-y: auto">
                <div v-if="!imagesList.length" class="flex flex-center q-pa-xl text-grey-5">
                    <div class="text-center">
                        <q-icon name="collections" size="3rem" class="q-mb-sm" />
                        <div>{{ $t('common.info.noDataFound') }}</div>
                    </div>
                </div>
                <div v-else class="row q-col-gutter-sm q-pa-sm">
                    <div v-for="image in imagesList" :key="image.imgId" class="col-4">
                        <q-card flat bordered class="image-card cursor-pointer" :class="{ 'image-card--selected': selectedImage?.imgId === image.imgId }" @click="selectedImage = image">
                            <q-img :src="getImageUrl(image)" height="100px" fit="cover">
                                <template #error>
                                    <div class="absolute-full flex flex-center bg-grey-2">
                                        <q-icon name="broken_image" size="2rem" color="grey-5" />
                                    </div>
                                </template>
                            </q-img>
                            <q-card-section class="q-pa-xs row items-center no-wrap">
                                <div class="col text-caption text-weight-medium ellipsis">{{ image.name }}</div>
                                <q-btn flat round dense size="xs" icon="delete" color="negative" @click.stop="deleteImage(image)" />
                            </q-card-section>
                        </q-card>
                    </div>
                </div>
            </div>

            <q-separator />

            <q-card-actions align="right">
                <q-btn flat :label="$t('common.cancel')" @click="$emit('close')" />
                <q-btn flat color="primary" :label="$t('common.set')" :disable="!selectedImage" @click="setImage" />
            </q-card-actions>
        </q-card>

        <input ref="fileInput" type="file" style="display: none" accept=".png,.jpg,.jpeg" @change="onFileChange" />
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useQuasar } from 'quasar'
import { IImage } from '@/modules/documentExecution/dashboard/interfaces/DashboardImageWidget'
import { mapActions } from 'pinia'
import { AxiosResponse } from 'axios'
import appStore from '@/App.store'

export default defineComponent({
    name: 'map-visualization-image-picker-dialog',
    components: {},
    props: { visible: { required: true, type: Boolean } },
    emits: ['close', 'setImage'],
    setup() {
        const quasar = useQuasar()
        return { quasar }
    },
    data() {
        return {
            imagesList: [] as IImage[],
            selectedImage: null as IImage | null
        }
    },
    watch: {
        visible(val: boolean) {
            if (val) this.loadImages(false)
        }
    },
    created() {
        this.loadImages(false)
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        async loadImages(reload: boolean) {
            if (this.imagesList.length > 0 && !reload) return
            this.setLoading(true)
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/images/listImages`)
                .then((response: AxiosResponse<any>) => (this.imagesList = response.data?.data ?? []))
                .catch(() => {})
            this.setLoading(false)
        },
        getImageUrl(image: IImage): string {
            return `${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/1.0/images/getImage?IMAGES_ID=${image.imgId}`
        },
        async onFileChange(event: Event) {
            const file = (event.target as HTMLInputElement).files?.[0]
            if (!file) return
            const formData = new FormData()
            formData.append('uploadedImage', file)
            this.setLoading(true)
            await this.$http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/images/addImage`, formData, { headers: { 'X-Disable-Errors': 'true' } }).catch(() => {})
            await this.loadImages(true)
            this.setLoading(false)
            ;(event.target as HTMLInputElement).value = ''
        },
        deleteImage(image: IImage) {
            this.quasar.dialog({ title: this.$t('common.toast.deleteConfirmTitle'), message: this.$t('common.toast.deleteMessage'), cancel: true, persistent: true }).onOk(async () => {
                this.setLoading(true)
                await this.$http.delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/images/deleteImage/${image.imgId}`).catch(() => {})
                if (this.selectedImage?.imgId === image.imgId) this.selectedImage = null
                await this.loadImages(true)
                this.setLoading(false)
            })
        },
        setImage() {
            if (this.selectedImage) this.$emit('setImage', this.selectedImage)
            this.$emit('close')
        }
    }
})
</script>

<style lang="scss" scoped>
.image-card {
    transition: border-color 0.15s;
}

.image-card.image-card--selected {
    border-color: var(--q-primary);
    background: rgba(25, 118, 210, 0.05);
}
</style>
