export interface iHost {
    hostName: string,
    hardwareId: string
}

export interface iLicense {
    licenseId: number,
    product: string,
    status: string,
    status_ext?: string,
    expiration_date: string,
    expiration_date_format: string,
    other_info_type?: string,
    other_info?: string
}
