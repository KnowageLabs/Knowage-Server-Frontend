<template>
    <div class="kn-csv-preview">
        <div v-if="loading" class="kn-csv-loading row items-center justify-center q-pa-sm">
            <q-spinner-dots size="1.4rem" color="primary" />
        </div>
        <div v-else-if="error" class="text-caption text-negative q-pa-xs">{{ error }}</div>
        <template v-else-if="rows.length > 0">
            <div class="kn-csv-table-wrapper">
                <table class="kn-csv-table">
                    <thead>
                        <tr>
                            <th v-for="col in headers" :key="col" :title="col">{{ col }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, ri) in rows" :key="ri">
                            <td v-for="(cell, ci) in row" :key="ci" :title="cell">{{ cell }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="truncated" class="text-caption text-grey-5 q-mt-xs q-ml-xs">
                {{ $t('ai.sidePanel.csvTruncated', { n: MAX_ROWS }) }}
            </div>
        </template>
        <div v-else class="text-caption text-grey-5 q-pa-xs">{{ $t('ai.sidePanel.csvEmpty') }}</div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{ url: string }>()

const MAX_ROWS = 50

const loading = ref(false)
const error = ref('')
const headers = ref<string[]>([])
const rows = ref<string[][]>([])
const truncated = ref(false)

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (lines.length === 0) return { headers: [], rows: [] }

    function splitLine(line: string): string[] {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        for (let i = 0; i < line.length; i++) {
            const ch = line[i]
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
                else inQuotes = !inQuotes
            } else if (ch === ',' && !inQuotes) {
                result.push(current.trim())
                current = ''
            } else {
                current += ch
            }
        }
        result.push(current.trim())
        return result
    }

    const hdrs = splitLine(lines[0])
    const dataLines = lines.slice(1, MAX_ROWS + 1)
    const dataRows = dataLines.map(splitLine)
    return { headers: hdrs, rows: dataRows }
}

async function load() {
    if (!props.url) return
    loading.value = true
    error.value = ''
    headers.value = []
    rows.value = []
    truncated.value = false
    try {
        const res = await fetch(props.url)
        if (!res.ok) throw new Error(`${res.status}`)
        const text = await res.text()
        const parsed = parseCsv(text)
        headers.value = parsed.headers
        rows.value = parsed.rows
        // Check if original had more lines than MAX_ROWS
        const totalLines = text.split(/\r?\n/).filter(Boolean).length - 1 // minus header
        truncated.value = totalLines > MAX_ROWS
    } catch (e: any) {
        error.value = e?.message ?? 'Error loading CSV'
    } finally {
        loading.value = false
    }
}

onMounted(load)
watch(() => props.url, load)
</script>

<style scoped lang="scss">
.kn-csv-preview {
    width: 100%;
    overflow: hidden;
}

.kn-csv-table-wrapper {
    width: 100%;
    min-width: 0;
    overflow-x: auto;
    overflow-y: auto;
    max-height: 220px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
}

.kn-csv-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 0.7rem;
    white-space: normal;

    thead tr {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        position: sticky;
        top: 0;
        z-index: 1;

        th {
            color: white;
            padding: 5px 10px;
            text-align: left;
            font-weight: 600;
            max-width: 140px;
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: break-word;
            overflow-wrap: anywhere;
        }
    }

    tbody {
        tr {
            &:nth-child(even) {
                background: #f1f5f9;
            }

            &:hover {
                background: #e0e7ff;
            }

            td {
                padding: 4px 10px;
                color: #374151;
                border-bottom: 1px solid #f1f5f9;
                max-width: 140px;
                overflow: hidden;
                text-overflow: ellipsis;
                word-break: break-word;
                overflow-wrap: anywhere;
            }
        }
    }
}

.kn-csv-loading {
    min-height: 60px;
}
</style>
