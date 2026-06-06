import { fromWei } from 'web3-utils'
import moment from 'moment'

export const unPadAndFormatPrice = (price: string) => {
    const _price = price.replace(/^0+/, '')
    return _price === '' ? 'Ξ0' : `Ξ${formatPrice(_price)}`
}

const formatPrice = (price: string) => {
    const _price = fromWei(price, "ether")
    if (_price.includes('.')) {
        const __price = _price.split('.')
        return __price[1].length <= 3 ? `${__price[0]}.${__price[1]}` : `${__price[0]}.${roundToFourDigits(Number(__price[1]))}`
    } else {
        return _price
    }
}

export const formatDate = (seconds: number) => {
    const date = moment.utc(seconds).format('Do MMM YYYY h:mma (UTC)')
    return date
}

const roundToFourDigits = (price: number) => price.toString().slice(0, 4) // Ensure only 4 digits are returned