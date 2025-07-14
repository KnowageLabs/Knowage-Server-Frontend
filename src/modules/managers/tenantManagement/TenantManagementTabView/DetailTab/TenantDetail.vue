<template>
    <q-card>
        <q-card-section class="row q-col-gutter-sm">
            <q-input filled class="col-12" v-model="tenant.TENANT_NAME" :label="$t('managers.tenantManagement.detail.name')" :disable="disableField" reactive-rules ref="tenantName" :rules="[(val) => val.match(/^[a-zA-Z0-9_]+$/) || $t('common.validation.regex'), (val) => !!val || $t('common.validation.required', { fieldName: $t('managers.tenantManagement.detail.name') })]" @update:model-value="(value) => onFieldChange('TENANT_NAME', value)" />
            <div class="col-12">
                <label class="kn-material-input-label">{{ $t('managers.tenantManagement.detail.logo') }}</label>
                <div>
                    <small>{{ $t('managers.tenantManagement.detail.logoHint') }}</small>
                </div>

                <div class="imageContainer p-d-flex p-jc-center p-ai-center">
                    <div class="row q-gutter-xs buttonsBar q-ml-xs">
                        <q-file ref="avatarPicker" v-model="tenant.TENANT_IMAGE" label="Standard" class="hidden" @update:model-value="(value) => uploadFile(value, 'TENANT_IMAGE')" />
                        <q-btn round outline color="primary" icon="file_upload" @click="triggerUpload('avatarPicker')">
                            <q-tooltip :delay="500">{{ $t('common.upload') }}</q-tooltip>
                        </q-btn>
                        <q-btn v-if="tenant.TENANT_IMAGE" round outline color="primary" icon="delete" @click="clear('TENANT_IMAGE')">
                            <q-tooltip :delay="500">{{ $t('common.clear') }}</q-tooltip>
                        </q-btn>
                    </div>

                    <i v-if="!tenant.TENANT_IMAGE" class="far fa-image fa-5x icon" />
                    <img v-if="tenant.TENANT_IMAGE" :src="tenant.TENANT_IMAGE" class="kn-no-select" />
                </div>
            </div>
            <div class="col-12">
                <label class="kn-material-input-label">{{ $t('managers.tenantManagement.detail.logoWide') }}</label>
                <div>
                    <small>{{ $t('managers.tenantManagement.detail.logoWideHint') }}</small>
                </div>

                <div class="imageContainerExtended p-d-flex p-jc-center p-ai-center">
                    <div class="row q-gutter-xs buttonsBar q-ml-xs">
                        <q-file ref="widePicker" v-model="tenant.TENANT_IMAGE_WIDE" label="Standard" class="hidden" @update:model-value="(value) => uploadFile(value, 'TENANT_IMAGE_WIDE')" />
                        <q-btn round outline color="primary" icon="file_upload" @click="triggerUpload('widePicker')">
                            <q-tooltip :delay="500">{{ $t('common.upload') }}</q-tooltip>
                        </q-btn>
                        <q-btn v-if="tenant.TENANT_IMAGE_WIDE" round outline color="primary" icon="delete" @click="clear('TENANT_IMAGE_WIDE')">
                            <q-tooltip :delay="500">{{ $t('common.clear') }}</q-tooltip>
                        </q-btn>
                    </div>
                    <i v-if="!tenant.TENANT_IMAGE_WIDE" class="far fa-image fa-5x icon" />
                    <img v-if="tenant.TENANT_IMAGE_WIDE" :src="tenant.TENANT_IMAGE_WIDE" class="kn-no-select" />
                </div>
            </div>
            <q-toggle v-model="tenant.TENANT_MFA" color="primary" icon="lock" :label="$t('managers.tenantManagement.multifactor')">
                <q-tooltip :delay="500">{{ $t('managers.tenantManagement.multifactorHint') }}</q-tooltip>
            </q-toggle>
        </q-card-section>
    </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import tabViewDescriptor from '../TenantManagementTabViewDescriptor.json'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import { iTenant } from '../../TenantManagement'
import { AxiosResponse } from 'axios'
import mainStore from '../../../../../App.store'
import { mapActions } from 'pinia'

export default defineComponent({
    name: 'detail-tab',
    components: {
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
            if (!this.tenant.TENANT_MFA) this.tenant.TENANT_MFA = false
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
        if (!this.tenant.TENANT_MFA) this.tenant.TENANT_MFA = false
        if (this.listOfThemes) this.themes = [...this.listOfThemes] as any
        this.$refs.tenantName?.resetValidation()
    },
    methods: {
        ...mapActions(mainStore, ['setError']),
        clear(type) {
            this.tenant[type] = ''
        },
        onFieldChange(fieldName: string, value: any) {
            this.$emit('fieldChanged', { fieldName, value })
        },
        uploadFile(file, imgType): void {
            const reader = new FileReader()
            reader.addEventListener(
                'load',
                () => {
                    this.tenant[imgType] = reader.result || ''
                    this.onFieldChange(imgType, this.tenant[imgType])
                },
                false
            )
            if (file && file.size < import.meta.env.VITE_MAX_UPLOAD_IMAGE_SIZE) {
                reader.readAsDataURL(file)
            } else this.setError({ title: this.$t('common.error.uploading'), msg: this.$t('common.error.exceededSize', { size: '(200KB)' }) })
        },
        triggerUpload(imgRef: string): void {
            this.$refs[imgRef].pickFiles()
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
    width: 90px;
    position: relative;
    margin: 16px 0;
    border: 1px solid #aaa;
    padding: 2px;
    .icon {
        color: var(--kn-color-secondary);
    }
    img {
        height: auto;
        max-height: 98%;
        max-width: 98%;
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

.buttonsBar {
    position: absolute;
    top: 0;
    left: 100%;
}
</style>
