<template>
    <div>
        <img style="" :src="image" alt="" />
        <input type="file" @change="handleImage" />
        <img :src="remoteUrl" alt="" />
    </div>
</template>

<script>
export default {
    name: 'image-to-base64-icon',
    emits: ['selectedImageBase64', 'wrongInput'],
    data() {
        return {
            image: '',
            remoteUrl: ''
        }
    },
    methods: {
        handleImage(e) {
            const file = e.target.files[0]
            if (this.isFileImage(file)) {
                const selectedImage = file
                this.createBase64Image(selectedImage)
            } else {
                this.$toast.add({ severity: 'error', summary: this.$t('common.error.incompatibleType'), detail: this.$t('common.error.allowedFileTypes') + ' .ico, .svg, .png', life: 5000 })
                this.$emit('wrongInput', true)
            }
        },
        createBase64Image(fileObject) {
            const reader = new FileReader()
            reader.onload = (e) => {
                this.image = e.target.result
                this.sendImageToParent()
            }
            reader.readAsDataURL(fileObject)
        },
        sendImageToParent() {
            const { image } = this
            this.$emit('wrongInput', false)
            this.$emit('selectedImageBase64', image)
        },
        isFileImage(file) {
            const acceptedImageTypes = ['image/svg', 'image/ico', 'image/png', 'image/x-icon']
            return file && acceptedImageTypes.includes(file['type'])
        }
    }
}
</script>
