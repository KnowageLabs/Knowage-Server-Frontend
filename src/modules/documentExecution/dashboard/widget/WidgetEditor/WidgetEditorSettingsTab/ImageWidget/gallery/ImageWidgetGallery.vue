<template>
    <div v-if="model || mode === 'map'" class="imageGallery dashboard-card-shadow kn-height-full p-ml-1 p-d-flex p-flex-column p-grid">
        <Toolbar class="kn-toolbar kn-toolbar--default p-col-12">
            <template #end>
                <Button icon="fas fa-upload fa-1x" class="p-button-text p-button-plain p-ml-2" :label="$t('common.upload')" data-test="upload" @click="setImageUploadType" />
                <KnInputFile :change-function="setImageForUpload" accept=".png, .jpg, .jpeg" :trigger-input="triggerImageUpload" />
            </template>
        </Toolbar>
        <div v-if="sidebarVisible" id="image-widget-gallery-backdrop" class="kn-flex" @click="sidebarVisible = false"></div>
        <div class="p-grid p-col-12 p-m-2 kn-flex kn-overflow dashboard-scrollbar">
            <div id="image-widget-gallery-content" class="p-grid p-m-2 p-jc-center p-ai-center kn-flex kn-overflow dashboard-scrollbar">
                <Message v-if="images.length == 0" class="p-col-10 p-m-2" severity="info" :closable="false">
                    {{ $t('common.info.noImageFound') }}
                </Message>
                <ImageWidgetGalleryCard
                    v-for="(image, index) of images"
                    :key="index"
                    class="p-col-12 p-md-6 p-lg-4 p-p-0 kn-cursor-pointer"
                    :class="[selectedImage?.imgId === image.imgId ? 'selected-card-image-container' : '']"
                    :is-selected="selectedImage?.imgId === image.imgId"
                    :image-prop="image"
                    :mode="mode"
                    @open-sidebar="openSidebar(image)"
                    @image-selected="setSelectedImage(image)"
                    @delete="onImageDelete"
                />
            </div>
            <div v-if="sidebarVisible" id="image-widget-gallery-card-sidebar-container">
                <ImageWidgetGallerySidebar :selected-image="selectedImage" @close="sidebarVisible = false"></ImageWidgetGallerySidebar>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IImage } from '@/modules/documentExecution/dashboard/interfaces/DashboardImageWidget'
import { mapActions } from 'pinia'
import { AxiosResponse } from 'axios'
import appStore from '@/App.store'
import descriptor from './ImageWidgetGalleryDescriptor.json'
import ImageWidgetGalleryCard from './ImageWidgetGalleryCard.vue'
import KnInputFile from '@/components/UI/KnInputFile.vue'
import Message from 'primevue/message'
import ImageWidgetGallerySidebar from './ImageWidgetGallerySidebar.vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import deepcopy from 'deepcopy'

export default defineComponent({
    name: 'image-widget-gallery',
    components: { ImageWidgetGalleryCard, KnInputFile, Message, ImageWidgetGallerySidebar },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, imagesListProp: { type: Array as PropType<IImage[]>, required: true }, mode: { type: String } },
    emits: ['uploadedImage', 'selectedImage', 'imageDeleted'],
    data() {
        return {
            descriptor,
            model: null as IWidget | null,
            images: [] as IImage[],
            triggerImageUpload: false,
            selectedImage: null as IImage | null,
            sidebarVisible: false,
            selectedSidebarImage: null as IImage | null
        }
    },
    watch: {
        widgetModel() {
            this.loadModel()
        },
        imagesListProp() {
            this.loadImages()
        }
    },
    created() {
        this.loadModel()
        this.loadImages()
    },
    methods: {
        ...mapActions(appStore, ['setInfo', 'setError', 'setLoading']),
        loadModel() {
            this.model = this.widgetModel
        },
        loadImages() {
            this.images = this.imagesListProp
            this.loadSelectedImage()
        },
        loadSelectedImage() {
            if (this.model?.settings.configuration?.image) {
                const index = this.images.findIndex((image: IImage) => image.imgId === this.model?.settings.configuration.image.id)
                if (index !== -1) this.selectedImage = this.images[index]
            }
        },
        setImageUploadType() {
            this.triggerImageUpload = false
            setTimeout(() => (this.triggerImageUpload = true), 200)
        },
        async setImageForUpload(event: any) {
            this.setLoading(true)
            const imageToUpload = event.target.files[0]

            if (imageToUpload) {
                const formData = new FormData()
                formData.append('uploadedImage', imageToUpload)
                await this.$http
                    .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/images/addImage`, formData, { headers: { 'X-Disable-Errors': 'true' } })
                    .then((response: AxiosResponse<any>) => {
                        if (response.data.success) {
                            this.$emit('uploadedImage')
                            this.setInfo({ title: this.$t('common.toast.success'), msg: this.$t('common.toast.uploadSuccess') })
                        } else this.onImageUploadError(response.data.msg)
                    })
                    .catch(() => this.onImageUploadError(''))
            }
            this.setLoading(false)
        },
        onImageUploadError(errorMessageKey: string) {
            let message = this.$t('documentExecution.documentDetails.info.imageUploadError')
            switch (errorMessageKey) {
                case 'sbi.cockpit.widgets.image.imageWidgetDesigner.tooBigImage':
                    message = this.$t('dashboard.widgetEditor.imageWidget.imageUploadErrors.tooBigImage')
                    break
                case 'sbi.cockpit.widgets.image.imageWidgetDesigner.tooImageForTenant':
                    message = this.$t('dashboard.widgetEditor.imageWidget.imageUploadErrors.noMoreImages')
                    break
                case 'sbi.cockpit.widgets.image.imageWidgetDesigner.tooImageForUser':
                    message = this.$t('dashboard.widgetEditor.imageWidget.imageUploadErrors.tooManyUserImages')
                    break
                case 'sbi.cockpit.widgets.image.imageWidgetDesigner.fileIsNotAnImage':
                    message = this.$t('dashboard.widgetEditor.imageWidget.imageUploadErrors.fileIsNotAnImage')
                    break
                case 'sbi.cockpit.widgets.image.imageWidgetDesigner.fileTypeIsNotAllowed':
                    message = this.$t('dashboard.widgetEditor.imageWidget.imageUploadErrors.fileTypeIsNotAllowed')
            }
            this.setError({ title: this.$t('common.toast.errorTitle'), msg: message })
        },
        async onImageDelete(image: IImage) {
            await this.deleteImage(image)
        },
        async deleteImage(image: IImage) {
            this.setLoading(true)
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/images/deleteImage?imageId=${image.imgId}`)
                .then((response: AxiosResponse<any>) => {
                    if (response.data.success) this.onSuccessfullImageDelete(image)
                    else this.setError({ title: this.$t('common.toast.deleteTitle'), msg: response.data.msg })
                })
                .catch(() => {})
            this.setLoading(false)
        },
        onSuccessfullImageDelete(image: IImage) {
            const index = this.images.findIndex((tempImage: IImage) => tempImage.imgId === image.imgId)
            if (index !== -1) {
                this.$emit('imageDeleted', deepcopy(this.images[index]))
                this.images.splice(index, 1)
                this.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: this.$t('common.toast.deleteSuccess') })
                this.selectedSidebarImage = null
                this.sidebarVisible = false
            }
        },
        setSelectedImage(image: IImage) {
            this.selectedImage = image
            if (this.model) this.model.settings.configuration.image.id = image.imgId
            this.$emit('selectedImage', this.selectedImage)
        },
        openSidebar(image: IImage) {
            this.selectedSidebarImage = image
            this.sidebarVisible = true
        }
    }
})
</script>

<style lang="scss" scoped>
.gallery-card {
    height: 200px;
    width: 200px;
}
.gallery-card:hover {
    border-color: #43749e !important;
}
.imageGallery {
    .imageUploader {
        width: 100%;
    }
}
#image-widget-gallery-card-sidebar-container {
    position: absolute;
    max-width: 350px;
    height: 100%;
    right: 0;
    top: 0;
    z-index: 150;
}

#image-widget-gallery-backdrop {
    background-color: rgba(33, 33, 33, 1);
    opacity: 0.48;
    z-index: 50;
    position: absolute;
    width: 100%;
    min-height: 100%;
    top: 0;
    left: 0;
}

#image-widget-gallery-content {
    position: relative;
}

.selected-card-image-container {
    border: 3px solid var(--kn-color-primary);
}
</style>
