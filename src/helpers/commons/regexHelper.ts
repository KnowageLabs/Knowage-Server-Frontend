// eslint-disable-next-line no-useless-escape
export const extendedAlphanumeric = /^([\p{L}\w\s\-_;\(\)\[\]:!\\\/\?,\.'"\x2F\x5F%]){0,256}$/u

// eslint-disable-next-line no-useless-escape
export const extendedAlphanumeric81 = /^([\pL\w\s\-\_\(\)\[\]\;\:\!\?\,\.\'\"\x2F\x5F%]){0,256}$/

export const fullnameRegex = /^[\p{L}\w]{1,256}([\p{L}\w\s\-,.'\x2F\\@]){0,256}$/u

export const alphanumericNoSpaces = /^([a-zA-Z0-9\-_]){0,256}$/

export const alphanumeric = /^([a-zA-Z0-9\s\-_]){0,256}$/
