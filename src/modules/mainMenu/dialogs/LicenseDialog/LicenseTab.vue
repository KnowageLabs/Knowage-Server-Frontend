<template>
    <q-card flat bordered class="kn-license-host q-mb-md" data-test="host-info">
        <q-card-section class="row items-center q-col-gutter-md">
            <div class="col-12 col-md row items-center no-wrap">
                <q-avatar icon="dns" size="44px" font-size="24px" rounded class="kn-license-host__avatar q-mr-md" />
                <div class="col" style="min-width: 0">
                    <div class="text-caption text-grey-7">{{ $t('licenseDialog.hostName') }}</div>
                    <div class="text-h6 ellipsis">{{ host.hostName }}</div>
                </div>
            </div>
            <div class="col-12 col-md-auto row no-wrap kn-license-host__stats">
                <div class="kn-license-host__stat">
                    <div class="text-subtitle1 text-weight-medium">{{ cpunumber }}</div>
                    <div class="text-caption text-grey-7">{{ $t('licenseDialog.numberOfCpu') }}</div>
                </div>
                <div class="kn-license-host__stat">
                    <div class="text-subtitle1 text-weight-medium">{{ adminUsersCreated }} / {{ maxAdminUsers }}</div>
                    <div class="text-caption text-grey-7">{{ $t('licenseDialog.adminsCreated') }}</div>
                </div>
                <div class="kn-license-host__stat">
                    <div class="text-subtitle1 text-weight-medium">{{ endUsersCreated }} / {{ maxEndUsers }}</div>
                    <div class="text-caption text-grey-7">{{ $t('licenseDialog.usersCreated') }}</div>
                </div>
            </div>
        </q-card-section>

        <q-separator />

        <!-- The full hardware ID, wrapped when it does not fit. -->
        <div class="kn-license-host__hardware row items-baseline no-wrap q-px-md q-py-sm" data-test="hardware-id">
            <span class="text-caption text-grey-7 q-mr-md">{{ $t('licenseDialog.hardwareId') }}</span>
            <code class="col">{{ host.hardwareId }}</code>
        </div>
    </q-card>

    <q-card flat bordered class="kn-license-support q-mb-md" :class="{ 'kn-license-support--copied': copied }">
        <q-item clickable v-ripple data-test="copy-support-info" @click="copySupportInfo">
            <q-item-section avatar>
                <q-icon :name="copied ? 'check_circle' : 'support_agent'" :color="copied ? 'positive' : 'primary'" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ $t('licenseDialog.copyForSupport') }}</q-item-label>
                <q-item-label caption>{{ $t('licenseDialog.dataRequired') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
                <div class="row items-center no-wrap text-weight-medium" :class="copied ? 'text-positive' : 'text-primary'">
                    <q-icon :name="copied ? 'check' : 'content_copy'" size="18px" class="q-mr-xs" />
                    {{ copied ? $t('licenseDialog.copied') : $t('licenseDialog.copy') }}
                </div>
            </q-item-section>
        </q-item>
    </q-card>

    <q-card flat bordered>
        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
            <q-toolbar-title>{{ $t('licenseDialog.licenses') }}</q-toolbar-title>
            <q-btn flat round dense icon="add" data-test="new-button" @click="startUpload('')">
                <q-tooltip>{{ $t('licenseDialog.addLicense') }}</q-tooltip>
            </q-btn>
        </q-toolbar>
        <q-list separator>
            <q-item v-for="license in licenses" :key="license.product" data-test="license-row">
                <q-item-section avatar>
                    <q-avatar square size="40px">
                        <img :src="`${publicPath}/images/licenseImages/${license.product}.png`" :alt="license.product" />
                    </q-avatar>
                </q-item-section>
                <q-item-section>
                    <q-item-label>{{ license.product }}</q-item-label>
                    <q-item-label caption>{{ $t('licenseDialog.licenseId') }}: {{ license.licenseId }}</q-item-label>
                    <q-item-label v-if="license.expiration_date" caption>{{ $t('licenseDialog.expires', { date: license.expiration_date }) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                    <div class="row items-center no-wrap" :class="isValid(license) ? 'text-positive' : 'text-negative'">
                        <q-icon :name="isValid(license) ? 'check_circle' : 'error'" size="18px" class="q-mr-xs" />
                        <span class="text-body2">{{ isValid(license) ? $t('licenseDialog.validLicense') : $t('licenseDialog.invalidLicense') }}</span>
                        <q-tooltip v-if="license.other_info || license.status_ext">{{ isValid(license) ? license.other_info : license.status_ext }}</q-tooltip>
                    </div>
                </q-item-section>
                <q-item-section side>
                    <div class="row no-wrap">
                        <q-btn flat round dense icon="upload" data-test="update-button" @click="startUpload(license.product)">
                            <q-tooltip>{{ $t('licenseDialog.updateLicense') }}</q-tooltip>
                        </q-btn>
                        <q-btn flat round dense icon="delete" data-test="delete-button" @click="confirmDelete(license.product)">
                            <q-tooltip>{{ $t('licenseDialog.deleteLicense') }}</q-tooltip>
                        </q-btn>
                    </div>
                </q-item-section>
            </q-item>
            <q-item v-if="licenses.length === 0">
                <q-item-section class="text-grey-7">{{ $t('licenseDialog.noLicenses') }}</q-item-section>
            </q-item>
        </q-list>
    </q-card>

    <input ref="fileInput" type="file" accept=".lic" class="hidden" @change="onFileSelected" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { mapActions } from 'pinia'
import { AxiosResponse } from 'axios'
import { copyToClipboard } from 'quasar'
import auth from '@/helpers/commons/authHelper'
import mainStore from '@/App.store'
import type { iHost, iLicense } from './License'

export default defineComponent({
    name: 'license-tab',
    props: {
        cpunumber: { type: Number, default: 0 },
        maxAdminUsers: { type: Number, default: 0 },
        maxEndUsers: { type: Number, default: 0 },
        adminUsersCreated: { type: Number, default: 0 },
        endUsersCreated: { type: Number, default: 0 },
        licenses: { type: Array as PropType<iLicense[]>, required: true },
        host: { type: Object as PropType<iHost>, required: true }
    },
    data() {
        return {
            // The product of the license to update. Empty when the user adds a new license.
            productToUpdate: '',
            publicPath: import.meta.env.VITE_PUBLIC_PATH,
            copied: false,
            copiedTimeout: undefined as ReturnType<typeof setTimeout> | undefined
        }
    },
    computed: {
        // The text the user pastes in the license request. It always has the full host name.
        supportInfo(): string {
            return [`Knowage version: ${import.meta.env.PACKAGE_VERSION}`, `Host name: ${this.host.hostName}`, `Hardware id: ${this.host.hardwareId}`, `Cores: ${this.cpunumber}`].join('\n')
        }
    },
    beforeUnmount() {
        clearTimeout(this.copiedTimeout)
    },
    methods: {
        ...mapActions(mainStore, ['setError', 'setInfo', 'updateLicense']),
        isValid(license: iLicense): boolean {
            return license.status === 'LICENSE_VALID'
        },
        async copySupportInfo() {
            try {
                await copyToClipboard(this.supportInfo)
                this.copied = true
                clearTimeout(this.copiedTimeout)
                this.copiedTimeout = setTimeout(() => (this.copied = false), 2500)
            } catch {
                // The browser blocked the clipboard. The hardware ID is plain text, so the user can still select and copy it.
            }
        },
        startUpload(product: string) {
            this.productToUpdate = product
            ;(this.$refs.fileInput as HTMLInputElement).click()
        },
        onFileSelected(event: Event) {
            const input = event.target as HTMLInputElement
            const file = input.files?.[0]
            input.value = ''
            if (!file) return
            if (this.productToUpdate && !file.name.includes(this.productToUpdate)) {
                this.setError({ title: this.$t('licenseDialog.updateLicense'), msg: this.$t('licenseDialog.wrongType') })
                return
            }
            this.uploadLicense(file)
        },
        async uploadLicense(file: File) {
            const formData = new FormData()
            formData.append('file', file)
            const isForUpdate = !!this.productToUpdate
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/license/upload/${this.host.hostName}?isForUpdate=${isForUpdate}`, formData)
                .then((response: AxiosResponse<any>) => {
                    this.setInfo({ title: this.$t('common.uploading'), msg: this.$t('importExport.import.successfullyCompleted') })
                    this.updateLicense({ hostName: this.host.hostName, license: response.data })
                })
                .catch((error) => {
                    const msg = error.message == 'error.message.license.exists' ? this.$t('licenseDialog.errorExists') : error.message
                    this.setError({ title: this.$t('common.uploading'), msg })
                })
        },
        confirmDelete(product: string) {
            this.$q
                .dialog({
                    title: this.$t('licenseDialog.deleteLicense'),
                    message: this.$t('licenseDialog.warningBeforeDelete', [product]),
                    cancel: true,
                    persistent: true
                })
                .onOk(() => this.deleteLicense(product))
        },
        async deleteLicense(product: string) {
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/license/delete/${this.host.hostName}/${product}`, {
                    headers: {
                        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
                    }
                })
                .then((response: AxiosResponse<any>) => {
                    if (response.data.errors) {
                        this.setError({ title: this.$t('licenseDialog.errorLicense'), msg: this.$t('licenseDialog.errorMessage') })
                    } else {
                        this.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: this.$t('common.toast.deleteSuccess') })
                    }
                })
                // The server needs a new login after a license is deleted.
                .finally(() => auth.logout())
        }
    }
})
</script>

<style lang="scss" scoped>
.kn-license-host__avatar {
    background: rgba(0, 0, 0, 0.06);
    color: rgba(0, 0, 0, 0.6);
}
.kn-license-host__stat {
    padding: 0 16px;
    text-align: center;
    white-space: nowrap;
    & + & {
        border-left: 1px solid rgba(0, 0, 0, 0.12);
    }
    &:last-child {
        padding-right: 0;
    }
}
/* Below the md breakpoint the counts move under the host name and share the full width. */
@media (max-width: 1023px) {
    .kn-license-host__stat {
        flex: 1 1 0;
        padding: 0 8px;
    }
}
.kn-license-host__hardware {
    background: rgba(0, 0, 0, 0.04);
    code {
        font-size: 12px;
        line-height: 1.5;
        word-break: break-all;
    }
}
.kn-license-support {
    transition:
        border-color 0.15s,
        background-color 0.15s;
    &:hover {
        border-color: var(--q-primary);
    }
}
.kn-license-support--copied,
.kn-license-support--copied:hover {
    border-color: var(--q-positive);
    background: rgba(33, 186, 69, 0.06);
}
</style>
