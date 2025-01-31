import Web3 from 'web3'
import BN from 'bn.js'
const web3 = new Web3(window.ethereum)
import { AbiItem } from 'web3'

export const getContract = (abi: AbiItem[], address: string) => new web3.eth.Contract(abi, address)

const numToUint8Array32 = (num: number | string | BN): Uint8Array => {
    const hexString = new BN(num).toString(16).padStart(64, '0')
    return new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
}

// Prepare transaction data as Uint8Array
const txData = (
    revert: number,
    to: string,
    amount: number | string | BN,
    dataBuff: Uint8Array
): Uint8Array => {
    const revertArray = new Uint8Array([revert])
    const addressArray = new Uint8Array(20)
    addressArray.set(web3.utils.hexToBytes(to.replace("0x", "").padStart(40, '0')))
    const amountArray = numToUint8Array32(amount)
    const dataLengthArray = numToUint8Array32(dataBuff.length)

    const data = new Uint8Array(1 + 20 + 32 + 32 + dataBuff.length)
    data.set(revertArray, 0)
    data.set(addressArray, 1)
    data.set(amountArray, 21)
    data.set(dataLengthArray, 53)
    data.set(dataBuff, 85)

    return data
}

export const getAuthVersion = async (contract: any) => {
    const authVersion = await contract.methods.authVersion().call()
    if (authVersion && (typeof authVersion === 'bigint' )) {
        return BigInt(authVersion)
    } else {
        console.log(typeof authVersion, authVersion)
        throw new Error('Invalid authVersion returned from contract')
    }
}

// Prepare invoke data with correctly formatted hex string
export const prepareInvokeData = async (
    contractAddress: string,
    functionCall: string,
    amount: string,
) => {
    try {
        const revertFlag = 1
        const functionDataBuff = new Uint8Array(web3.utils.hexToBytes(functionCall.replace("0x", "")))
        const dataBuffer = txData(revertFlag, contractAddress, amount, functionDataBuff)

        // Convert Uint8Array to a single hex string
        const data = "0x" + Array.from(dataBuffer).map(b => b.toString(16).padStart(2, '0')).join("")

        return { data }
    } catch (error) {
        console.error("Error encoding data:", error)
        throw error
    }
}

export const getCosignerForAuthorized = async (address: string, contract: any) => {
    const authVersion = await getAuthVersion(contract)
    const shiftedAuthVersion = shift(authVersion)
    const authorizedAddressBN = BigInt(address)
    const key = (shiftedAuthVersion << BigInt(160)) | authorizedAddressBN
    const rawAuthorizedValue = await contract.methods.authorizations(key.toString()).call()
    if (rawAuthorizedValue && (typeof rawAuthorizedValue === 'bigint')) {
        return `0x${(BigInt(rawAuthorizedValue) & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")).toString(16).padStart(40, '0')}`
    } else {
        console.log(typeof rawAuthorizedValue)
        throw new Error('Unable to receive cosigner details')
    }
}

export const shift = (toShift: any) => toShift >> BigInt(160)
