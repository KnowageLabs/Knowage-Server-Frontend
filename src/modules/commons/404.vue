<template>
    <div class="container-404 row fit justify-center items-center">
        <span class="text-accent q-mr-xl" style="font-size: 10rem">:(</span>
        <div class="column items-start">
            <div class="row items-center q-gutter-md q-mb-md">
                <span class="number text-h1 text-bold">404</span> <span>|</span> <span class="text-primary text-h4 text-uppercase">{{ t('common.pageNotFound') }}</span>
            </div>
            <q-btn size="lg" square color="primary" :label="t('common.home')" @click="navigateHome" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

function navigateHome() {
    router.push({ name: 'home' })
}
</script>

<style lang="scss">
@media all and (max-width: 552px) {
    .container-404 {
        height: unset !important;
        top: 50%;
        position: relative;
        transform: translateY(-50%);
        .column {
            align-items: center;
        }
    }
}
</style>
