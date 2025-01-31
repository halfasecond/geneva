import * as Styled from './ClaimBalance.style'
import { fromWei } from 'web3-utils'

const ClaimBalance: React.FC<{ 
    balance: string | undefined
}> = ({ balance }) => {

    const format = (_balance: string) => {
        const _b = parseInt(fromWei(_balance, 'ether')).toFixed(2).split('.')
        return `${parseInt(_b[0]).toLocaleString()}.${_b[1]}`
        
    }
 
    return balance !== undefined && (
        <Styled.Div>
            Available $PURR: {format(balance)}
        </Styled.Div>
    )
}

export default ClaimBalance