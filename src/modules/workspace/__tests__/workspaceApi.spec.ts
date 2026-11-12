import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadSnapshot } from '../workspaceApi'

vi.mock('axios')

describe('workspace snapshot downloads', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('accepts both the declared octet-stream type and the actual snapshot format', async () => {
        const response = { data: new Blob(['snapshot'], { type: 'application/pdf' }) }
        vi.mocked(axios.get).mockResolvedValueOnce(response)

        expect(await downloadSnapshot(12, 34)).toBe(response)
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/2.0/snapshotsContent?OBJECT_ID=12&SNAPSHOT_ID=34'), {
            responseType: 'blob',
            headers: { Accept: '*/*' }
        })
    })
})
