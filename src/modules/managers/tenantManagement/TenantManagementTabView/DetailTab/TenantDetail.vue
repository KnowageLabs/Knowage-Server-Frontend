<template>
    <Card :style="tabViewDescriptor.card.style">
        <template #content>
            <form class="p-fluid q-ma-md">
                <q-input
                    filled
                    class="q-mb-md"
                    v-model="tenant.TENANT_NAME"
                    :label="$t('managers.tenantManagement.detail.name')"
                    :disable="disableField"
                    reactive-rules
                    ref="tenantName"
                    :rules="[(val) => val.match(/^[a-zA-Z0-9_]+$/) || $t('common.validation.regex'), (val) => !!val || $t('common.validation.required', { fieldName: $t('managers.tenantManagement.detail.name') })]"
                    @update:model-value="(value) => onFieldChange('TENANT_NAME', value)"
                />
                <div class="p-col-12 kn-height-full">
                    <label class="kn-material-input-label">{{ $t('managers.tenantManagement.detail.logo') }}</label>
                    <div>
                        <small>{{ $t('managers.tenantManagement.detail.logoHint') }}</small>
                    </div>

                    <div class="imageContainer p-d-flex p-jc-center p-ai-center">
                        <i v-if="!tenant.TENANT_IMAGE" class="far fa-image fa-5x icon" />
                        <img v-if="tenant.TENANT_IMAGE" :src="tenant.TENANT_IMAGE" class="kn-no-select" />
                        <input id="organizationImage" type="file" accept="image/png, image/jpeg" data-test="upload" @change="uploadFile" />
                        <label v-tooltip.bottom="$t('common.upload')" for="organizationImage">
                            <i class="pi pi-upload"></i>
                        </label>
                    </div>
                </div>
                <div class="p-col-12 kn-height-full">
                    <label class="kn-material-input-label">{{ $t('managers.tenantManagement.detail.logoWide') }}</label>
                    <div>
                        <small>{{ $t('managers.tenantManagement.detail.logoWideHint') }}</small>
                    </div>

                    <div class="imageContainerExtended p-d-flex p-jc-center p-ai-center">
                        <i v-if="!tenant.TENANT_IMAGE_WIDE" class="far fa-image fa-5x icon" />
                        <img v-if="tenant.TENANT_IMAGE_WIDE" :src="tenant.TENANT_IMAGE_WIDE" class="kn-no-select" />
                        <input id="organizationImageExtended" type="file" accept="image/png, image/jpeg" @change="uploadExtendedFile" />
                        <label v-tooltip.bottom="$t('common.upload')" for="organizationImageExtended">
                            <i class="pi pi-upload"></i>
                        </label>
                    </div>
                </div>
            </form>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import tabViewDescriptor from '../TenantManagementTabViewDescriptor.json'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import { iTenant } from '../../TenantManagement'
import { AxiosResponse } from 'axios'
import mainStore from '../../../../../App.store'
import { mapActions } from 'pinia'

export default defineComponent({
    name: 'detail-tab',
    components: {
        Button,
        Card,
        KnValidationMessages
    },
    props: {
        selectedTenant: {
            type: Object,
            required: false
        },
        listOfThemes: Array
    },
    emits: ['fieldChanged', 'roleTypeChanged'],
    data() {
        return {
            tabViewDescriptor,
            tenant: {} as iTenant,
            themes: [] as any
        }
    },
    computed: {
        disableField() {
            if (this.tenant.TENANT_ID) return true
            return false
        }
    },
    watch: {
        async selectedTenant() {
            this.tenant = { ...this.selectedTenant } as iTenant
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/multitenant/${this.tenant.TENANT_NAME}/logo`).then((response: AxiosResponse<any>) => {
                this.tenant.TENANT_IMAGE = response.data
            })
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/multitenant/${this.tenant.TENANT_NAME}/logo-wide`).then((response: AxiosResponse<any>) => {
                this.tenant.TENANT_IMAGE_WIDE = response.data
            })
        },
        listOfThemes() {
            this.themes = [...(this.listOfThemes as any[])]
        }
    },
    updated() {
        if (this.selectedTenant && Object.keys(this.selectedTenant).length > 0) {
            this.tenant = { ...this.selectedTenant } as iTenant
        } else {
            this.tenant = {} as iTenant
            this.tenant.TENANT_THEME = 'sbi_default'
        }
        if (this.listOfThemes) this.themes = [...this.listOfThemes] as any
        this.$refs.tenantName?.resetValidation()
    },
    methods: {
        ...mapActions(mainStore, ['setError']),
        onFieldChange(fieldName: string, value: any) {
            this.$emit('fieldChanged', { fieldName, value })
        },
        uploadFile(event): void {
            const reader = new FileReader()
            reader.addEventListener(
                'load',
                () => {
                    this.tenant.TENANT_IMAGE = reader.result || ''
                    this.onFieldChange('TENANT_IMAGE', this.tenant.TENANT_IMAGE)
                },
                false
            )
            if (event.srcElement.files[0] && event.srcElement.files[0].size < import.meta.env.VITE_MAX_UPLOAD_IMAGE_SIZE) {
                reader.readAsDataURL(event.srcElement.files[0])
            } else this.setError({ title: this.$t('common.error.uploading'), msg: this.$t('common.error.exceededSize', { size: '(200KB)' }) })
        },

        uploadExtendedFile(event): void {
            const reader = new FileReader()
            reader.addEventListener(
                'load',
                () => {
                    this.tenant.TENANT_IMAGE_WIDE = reader.result || ''
                    this.onFieldChange('TENANT_IMAGE', this.tenant.TENANT_IMAGE_WIDE)
                },
                false
            )
            if (event.srcElement.files[0] && event.srcElement.files[0].size < import.meta.env.VITE_MAX_UPLOAD_IMAGE_SIZE) {
                reader.readAsDataURL(event.srcElement.files[0])
            } else this.setError({ title: this.$t('common.error.uploading'), msg: this.$t('common.error.exceededSize', { size: '(200KB)' }) })
        }
    }
})
</script>

<style lang="scss" scoped>
#organizationImage,
#organizationImageExtended {
    display: none;
}
label[for='organizationImage'],
label[for='organizationImageExtended'] {
    position: absolute;
    top: 0;
    right: -36px;
    border-radius: 50%;
    border: 1px solid var(--kn-color-primary);
    color: var(--kn-color-primary);
    cursor: pointer;
    height: 36px;
    width: 36px;
    padding: 8px;
    &:hover {
        background-color: rgba(var(--kn-color-primary), 0.2);
    }
}
.imageUploader {
    .p-fileupload {
        display: inline-block;
        .p-button {
            background-color: transparent;
            color: black;
        }
    }
}
.imageContainer,
.imageContainerExtended {
    height: 90px;
    width: 300px;
    position: relative;
    margin: 16px 0;
    border: 1px solid #aaa;
    padding: 2px;
    .icon {
        color: var(--kn-color-secondary);
    }
    img {
        height: auto;
        max-height: 80px;
        max-width: 80px;
    }
}

.imageContainerExtended {
    height: 200px;
    width: 500px;
    img {
        height: auto;
        max-height: 98%;
        max-width: 98%;
    }
}
</style>
