import { IGalleryTemplate } from '@/modules/managers/galleryManagement/GalleryManagement'
import { ICatalogFunctionTemplate } from '@/modules/importExport/catalogFunction/ICatalogFunctionTemplate'
import { iUser } from '@/modules/managers/usersManagement/UsersManagement'

export interface ISelectedItems {
    gallery: IGalleryTemplate[]
    catalogFunction: ICatalogFunctionTemplate[]
    users: iUser[]
}
