export function sanitizeWhatsappNumber(raw, defaultCountry = process.env.NEXT_PUBLIC_DEFAULT_WA_COUNTRY || process.env.DEFAULT_WA_COUNTRY || '1') {
    if (!raw) return ''
    let digits = String(raw).replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('00')) digits = digits.slice(2)
    if (digits.length < 8) return digits
    if (digits.length <= 10) {
        digits = `${defaultCountry.replace(/\D/g, '')}${digits}`
    }
    return digits
}

export function buildWaLink(whatsapp, message = '') {
    const num = sanitizeWhatsappNumber(whatsapp)
    if (!num) return '#'
    const text = message ? `?text=${encodeURIComponent(message)}` : ''
    return `https://wa.me/${num}${text}`
}
