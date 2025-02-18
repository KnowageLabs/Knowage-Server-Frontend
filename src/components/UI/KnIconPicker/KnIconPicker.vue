<template>
    <Dialog id="widget-editor-icon-picker-dialog" class="p-fluid kn-dialog--toolbar--primary" :visible="true" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-2 p-col-12">
                <template #start> {{ $t('components.knIconPicker.chooseIcon') }} </template>
            </Toolbar>
        </template>

        <div class="widget-editor-icon-picker-content">
            <q-input v-model="searchWord" class="p-mx-3 p-mb-3" :label="$t('common.search')" data-test="search-input" @update:model-value="filterIcons">
                <template #prepend>
                    <q-icon name="search" />
                </template>
            </q-input>

            <label class="kn-material-input-label p-mx-5"> {{ $t('components.knIconPicker.upload') }}</label>
            <KnImageToBase64IconPicker v-if="enableBase64" class="p-mx-5 p-my-3" @selectedImageBase64="onBase64ImageSelection"></KnImageToBase64IconPicker>

            <template v-if="recentlyUsedIcons.length > 0">
                <label class="kn-material-input-label p-my-3 p-mx-5"> {{ $t('components.knIconPicker.recentlyUsed') }}</label>
                <div class="widget-editor-icon-picker-icons-container">
                    <div v-for="(icon, index) in recentlyUsedIcons" :key="index" :class="{ 'widget-editor-selected-icon-container': selectedIcon?.id === icon.id }" :title="icon.label" class="widget-editor-icon-container kn-cursor-pointer recently-used" @click.stop="setSelectedIcon(icon)">
                        <div v-if="icon.category === 'custom'" class="custom-image" :style="{ 'background-image': `url(${icon.image})` }"></div>
                        <i v-else :class="icon.className"></i>
                    </div>
                </div>
            </template>

            <div class="widget-editor-icon-picker-icons-container p-my-3">
                <div v-for="(icon, index) in filteredIcons" :key="index" :class="{ 'widget-editor-selected-icon-container': selectedIcon?.id === icon.id }" :title="icon.label" class="widget-editor-icon-container kn-cursor-pointer" @click.stop="setSelectedIcon(icon)">
                    <i :class="icon.className"></i>
                </div>
            </div>
        </div>

        <template #footer>
            <Button class="kn-button kn-button--primary" @click="closeDialog"> {{ $t('common.close') }}</Button>
            <Button class="kn-button kn-button--primary" @click="save"> {{ $t('common.save') }}</Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IIcon } from './KnIconPicker.d'
import Dialog from 'primevue/dialog'
import descriptor from './KnIconPickerDescriptor.json'
import KnImageToBase64IconPicker from '@/components/UI/KnImageToBase64IconPicker.vue'

export default defineComponent({
    name: 'kn-icon-picker',
    components: { Dialog, KnImageToBase64IconPicker },
    props: { currentIcon: { type: Object as PropType<IIcon | string | undefined>, default: undefined }, enableBase64: { type: Boolean, default: false } },
    emits: ['close', 'save'],
    data() {
        return {
            icons: [] as IIcon[],
            filteredIcons: [] as IIcon[],
            selectedIcon: null as IIcon | null,
            searchWord: '',
            recentlyUsedIcons: [] as IIcon[]
        }
    },
    created() {
        this.loadIcons()
        this.getSelectedIcon()
        this.loadRecentlyUsedIcons()
    },
    methods: {
        loadIcons() {
            this.icons = descriptor.icons
            this.filteredIcons = this.icons ? [...this.icons] : []
        },
        getSelectedIcon() {
            if (!this.currentIcon) return
            const index = this.icons.findIndex((icon: IIcon) => icon.className === this.currentIcon?.icon || icon.className === this.currentIcon || icon.id === this.currentIcon?.id)
            if (index !== -1) this.selectedIcon = { ...this.icons[index] }
        },
        loadRecentlyUsedIcons() {
            const temp = sessionStorage.getItem('iconPickerRecentlyUsedIcons')
            this.recentlyUsedIcons = temp ? JSON.parse(temp) : []
        },
        setSelectedIcon(icon: IIcon) {
            if (this.selectedIcon === icon) this.selectedIcon = null
            else this.selectedIcon = icon
        },
        closeDialog() {
            this.$emit('close')
            this.selectedIcon = null
        },
        onBase64ImageSelection(event) {
            const maxId = Math.max(...this.recentlyUsedIcons.map((i) => i.id))
            this.selectedIcon = {
                category: 'custom',
                id: maxId < 10000 ? 10000 : maxId + 1,
                label: 'Custom Image',
                image: event
            }
        },
        save() {
            this.$emit('save', { ...this.selectedIcon })
            this.updateSessionRecentlyUsedIcons()
            this.selectedIcon = null
        },
        updateSessionRecentlyUsedIcons() {
            if (!this.selectedIcon) return
            const index = this.recentlyUsedIcons.findIndex((icon: IIcon) => icon.id === this.selectedIcon?.id)
            if (index === -1) this.recentlyUsedIcons.push(this.selectedIcon)
            if (this.recentlyUsedIcons.length > 10) this.recentlyUsedIcons.splice(0, 1)
            sessionStorage.setItem('iconPickerRecentlyUsedIcons', JSON.stringify(this.recentlyUsedIcons))
        },
        filterIcons() {
            setTimeout(() => {
                if (!this.searchWord.trim().length) {
                    this.filteredIcons = [...this.icons] as IIcon[]
                } else {
                    this.filteredIcons = this.filteredIcons.filter((icon: IIcon) => {
                        return icon.label?.toLowerCase().includes(this.searchWord.toLowerCase())
                    })
                }
            }, 250)
        }
    }
})
</script>

<style lang="scss">
#widget-editor-icon-picker-dialog {
    min-width: 40%;
    max-width: 60%;
}
#widget-editor-icon-picker-dialog .p-dialog-header {
    padding: 0;
}
#widget-editor-icon-picker-dialog .p-dialog-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 0.5rem;
}

.widget-editor-icon-picker-content {
    margin: 1rem;
}

.widget-editor-icon-picker-icons-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
}

.widget-editor-icon-container {
    border: 1px solid #c2c2c2;
    padding: 0.5rem;
    border-radius: 5px;
    margin: 0.5rem;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 30px;
    &.recently-used {
        height: 45px;
        width: 45px;
        font-size: 1.5rem;
    }
}

.custom-image {
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center center;
    width: 100%;
    height: 100%;
}
.widget-editor-selected-icon-container {
    background-color: #c2c2c2;
}
</style>
