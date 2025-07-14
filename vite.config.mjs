import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import forwardToTrailingSlashPlugin from './forward-to-trailing-slash-plugin.js'
import { VitePWA } from 'vite-plugin-pwa'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import loadVersion from 'vite-plugin-package-version'

const build = {
    rollupOptions: {
        input: {
            'knowage-vue': new URL('./index.html', import.meta.url).href
        }
    }
}

export default defineConfig((command, mode) => {
    const env = loadEnv(mode, process.cwd())
    return {
        plugins: [
            loadVersion(),
            vue({
                template: { transformAssetUrls }
            }),
            forwardToTrailingSlashPlugin(Object.keys(build.rollupOptions.input)),

            quasar()
        ],
        resolve: {
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
            alias: {
                '@': path.resolve(__dirname, './src'),
                'devextreme/ui': 'devextreme/esm/ui'
            }
        },
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: '@use "sass:color"; @import "@/assets/scss/main.scss";',
                    api: 'modern',
                    silenceDeprecations: ['legacy-js-api']
                }
            }
        },
        base: env.VITE_PUBLIC_PATH,
        build: {
            outDir: `./target/knowage-vue`,
            sourcemap: true,
            rollupOptions: {
                output: {
                    chunkFileNames: 'assets/js/[name]-[hash].js',
                    entryFileNames: 'assets/js/[name]-[hash].js'
                },
                plugins: [
                    {
                        name: 'no-treeshake',
                        transform(_, id) {
                            if (id.includes('devextreme-vue/pivot-grid')) {
                                return { moduleSideEffects: 'no-treeshake' }
                            }
                        }
                    }
                ]
            }
        },
        server: {
            port: 3000,
            host: '127.0.0.1',
            https: env.VITE_HOST_HTTPS === 'true',
            cors: false,
            proxy: {
                '^/knowagedossierengine/api/': {
                    target: env.VITE_HOST_URL,
                    changeOrigin: true
                },
                '^/knowageqbeengine/': {
                    target: env.VITE_HOST_URL,
                    changeOrigin: true
                },
                '^/knowagemeta/restful-services/1.0/': {
                    target: env.VITE_HOST_URL,
                    changeOrigin: true
                },
                '^/knowage/restful-services/[0-9].0': {
                    target: env.VITE_HOST_URL,
                    changeOrigin: true
                },
                '^/knowage/restful-services/': {
                    target: env.VITE_HOST_URL,
                    changeOrigin: true
                },
                '^/knowage-api/api/': {
                    target: env.VITE_HOST_URL,
                    changeOrigin: true
                },
                '^/knowage/webSocket': {
                    target: env.VITE_HOST_URL,
                    changeOrigin: true,
                    ws: true
                },
                '^/knowage/servlet': {
                    target: env.VITE_HOST_URL,
                    changeOrigin: true
                },
                '^/knowagemeta': {
                    target: env.VITE_HOST_URL,
                    changeOrigin: true
                },
                '^/knowagecockpitengine/': {
                    target: env.VITE_HOST_URL,
                    changeOrigin: true
                },
                '^/knowagewhatifengine/': {
                    target: env.VITE_HOST_URL,
                    changeOrigin: true
                },
                '^/knowage-data-preparation/': {
                    target: env.VITE_HOST_URL,
                    changeOrigin: true,
                    ws: true
                },
                '^/knowagekpiengine/': {
                    target: env.VITE_HOST_URL,
                    changeOrigin: true
                }
            }
        },
        preview: {
            port: 3000
        }
    }
})
