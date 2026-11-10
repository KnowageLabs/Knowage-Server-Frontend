<template>
    <div class="login-container" :class="{ 'login-preview': preview, 'bg-loading': !backgroundLoaded }">
        <img :key="backgroundUrl" :src="backgroundUrl || defaultLoginBranding.backgroundUrl" alt="" class="login-background" @error="useDefaultBackground" />
        <q-linear-progress v-if="!backgroundLoaded" indeterminate color="primary" class="bg-loading-progress" />
        <div class="login-scroll">
            <div class="login-inner">
                <q-card class="login-card" :inert="preview">
                    <q-card-section class="text-center q-pb-none">
                        <div class="logo-container">
                            <img :key="logoUrl" :src="logoUrl || defaultLoginBranding.logoUrl" alt="Knowage" class="logo" @error="useDefaultLogo" />
                        </div>
                    </q-card-section>
                    <slot />
                </q-card>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { defaultLoginBranding } from '@/helpers/commons/loginBranding'

withDefaults(defineProps<{ backgroundUrl?: string; logoUrl?: string; backgroundLoaded?: boolean; preview?: boolean }>(), {
    backgroundUrl: '',
    logoUrl: '',
    backgroundLoaded: true,
    preview: false
})

function useDefaultBackground(event: Event) {
    const image = event.target as HTMLImageElement
    image.onerror = null
    if (image.getAttribute('src') !== defaultLoginBranding.backgroundUrl) image.src = defaultLoginBranding.backgroundUrl
}

function useDefaultLogo(event: Event) {
    const image = event.target as HTMLImageElement
    image.onerror = null
    if (image.getAttribute('src') !== defaultLoginBranding.logoUrl) image.src = defaultLoginBranding.logoUrl
}
</script>

<style scoped lang="scss">
.login-container {
    height: 100vh;
    height: 100dvh;
    width: 100%;
    min-width: 0;
    position: relative;
    overflow: hidden;
    background: #f5f5f5;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-color: rgba(255, 255, 255, 0.1);
        z-index: 1;
    }

    &.bg-loading {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
}

.login-background {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.bg-loading-progress {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
}

.login-scroll {
    height: 100%;
    width: 100%;
    position: relative;
    overflow: auto;
    z-index: 2;
}

.login-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    box-sizing: border-box;
    padding: 20px;
}

.login-preview {
    height: clamp(400px, 65vh, 640px);
}

.login-card {
    width: 100%;
    min-width: 0;
    flex-shrink: 0;
    max-width: 450px;
    margin: auto 0;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    position: relative;
    padding-bottom: 8px;
}

.logo-container {
    display: flex;
    justify-content: center;
    padding: 10px 0;
}

.logo {
    max-width: min(250px, 100%);
    max-height: 180px;
    object-fit: contain;
}

:deep(.login-form) {
    display: grid;
    gap: 16px;
    min-width: 0;
}

:deep(.login-form > *) {
    min-width: 0;
    max-width: 100%;
    margin: 0;
}

:deep(.q-btn) {
    height: 48px;
    font-weight: 600;
    text-transform: none;
    font-size: 16px;
}
</style>
