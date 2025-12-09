import { IGalleryTemplate } from '@/modules/managers/galleryManagement/GalleryManagement'
import { ICatalogFunctionTemplate } from '@/modules/importExport/catalogFunction/ICatalogFunctionTemplate'
import { iUser } from '@/modules/managers/usersManagement/UsersManagement'
import { iMenuNode } from '../managers/menuManagement/MenuManagement'

export interface ISelectedItems {
    gallery: IGalleryTemplate[]
    catalogFunction: ICatalogFunctionTemplate[]
    users: iUser[]
    menu: iMenuNode[]
}
