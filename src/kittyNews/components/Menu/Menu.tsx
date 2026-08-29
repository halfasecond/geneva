import * as Styled from './Menu.style'
import { Link } from 'react-router-dom'

const Menu = () => {
    return (
        <Styled.Div>
            <Link to={'/cms'}>cms</Link>
        </Styled.Div>
    )
}

export default Menu