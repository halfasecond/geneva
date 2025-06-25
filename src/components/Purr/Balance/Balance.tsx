import * as Styled from './Balance.style'
import { fromWei } from 'web3-utils'

const Balance: React.FC<{ 
    balance: string | undefined
}> = ({ balance }) => {
    return (
        <Styled.Div>
            {`$PURR: ${balance === undefined ? '0' : parseInt(fromWei(balance, 'ether')).toFixed(2)}`}
        </Styled.Div>
    )
}

export default Balance