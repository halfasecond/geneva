import * as Styled from './Balance.style'
import { fromWei } from 'web3-utils'

const Balance: React.FC<{ 
    balance: string | undefined
}> = ({ balance }) => {
    return balance && (
        <Styled.Div>
            $PURR: {parseInt(fromWei(balance, 'ether')).toFixed(2)}
        </Styled.Div>
    )
}

export default Balance