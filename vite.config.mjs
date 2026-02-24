import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import forwardToTrailingSlashPlugin from './forward-to-trailing-slash-plugin.js'
import { VitePWA } from 'vite-plugin-pwa'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import loadVersion from 'vite-plugin-package-version'
import { nodeResolve } from '@rollup/plugin-node-resolve'

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
            nodeResolve(),
            loadVersion(),
            vue({
                template: { transformAssetUrls }
            }),
            forwardToTrailingSlashPlugin(Object.keys(build.rollupOptions.input)),
            VitePWA({
                registerType: 'prompt',
                devOptions: {
                    enabled: true
                },
                workbox: {
                    skipWaiting: false,
                    clientsClaim: true,
                    globPatterns: ['**/*.{js,css,woff2,ttf}'],
                    globIgnores: ['**/ts.worker*.js', '**/kpiLang*.js', '**/manifest.webmanifest'],
                    maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
                    navigateFallback: null,
                    runtimeCaching: [
                        {
                            urlPattern: ({ request }) => request.destination === 'document',
                            handler: 'NetworkFirst',
                            options: {
                                cacheName: 'html-cache',
                                expiration: {
                                    maxAgeSeconds: 60 * 60 * 24 // 1 day
                                },
                                networkTimeoutSeconds: 3
                            }
                        },
                        {
                            urlPattern: /^.+\.(ttf|woff2)/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'fonts',
                                expiration: {
                                    maxEntries: 10,
                                    maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                                },
                                cacheableResponse: {
                                    statuses: [0, 200]
                                }
                            }
                        },
                        {
                            urlPattern: /^.+\.css/i,
                            handler: 'StaleWhileRevalidate',
                            options: {
                                cacheName: 'styles',
                                expiration: {
                                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                                },
                                cacheableResponse: {
                                    statuses: [0, 200]
                                }
                            }
                        },
                        {
                            urlPattern: /^.+\.js/i,
                            handler: 'StaleWhileRevalidate',
                            options: {
                                cacheName: 'scripts',
                                expiration: {
                                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                                },
                                cacheableResponse: {
                                    statuses: [0, 200]
                                }
                            }
                        },
                        {
                            urlPattern: /^.+\.(svg|png|jpg)/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'images',
                                expiration: {
                                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                                },
                                cacheableResponse: {
                                    statuses: [0, 200]
                                }
                            }
                        }
                    ]
                },
                manifestFilename: 'manifest.webmanifest',
                injectManifest: {
                    globPatterns: ['**/*.{js,css,woff2,ttf}'],
                    globIgnores: ['**/manifest.webmanifest']
                },
                manifest: {
                    name: 'Knowage',
                    short_name: 'Knowage',
                    start_url: '.',
                    display: 'standalone',
                    scope: env.VITE_PUBLIC_PATH,
                    orientation: 'landscape',
                    background_color: '#3b678c',
                    theme_color: '#3b678c',
                    description: 'The business intelligence open-source solution',
                    icons: [
                        {
                            src: 'icons/48.png',
                            sizes: '48x48',
                            type: 'image/png'
                        },
                        {
                            src: 'icons/72.png',
                            sizes: '72x72',
                            type: 'image/png'
                        },
                        {
                            src: 'icons/96.png',
                            sizes: '96x96',
                            type: 'image/png'
                        },
                        {
                            src: 'icons/144.png',
                            sizes: '144x144',
                            type: 'image/png'
                        },
                        {
                            src: 'icons/168.png',
                            sizes: '168x168',
                            type: 'image/png'
                        },
                        {
                            src: 'icons/192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        }
                    ]
                }
            }),
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
                    additionalData: '@use "sass:color"; @import "@/assets/scss/utils/_variables.scss"; @import "@/assets/scss/utils/_extends.scss";',
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
            },
            optimizeDeps: {
                include: ['vue', 'vue-router']
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
        },
        test: {
            environment: 'jsdom',
            globals: true,
            include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
            exclude: ['node_modules', 'target', 'dist'],
            setupFiles: ['src/__tests__/setup.ts'],
            coverage: {
                provider: 'v8',
                reporter: ['text', 'lcov', 'html'],
                include: ['src/modules/documentExecution/dashboard/**'],
                exclude: ['src/modules/documentExecution/dashboard/**/__tests__/**', 'src/modules/documentExecution/dashboard/**/*.spec.ts']
            },
            alias: {
                '@': new URL('./src', import.meta.url).pathname
            }
        }
    }
})
