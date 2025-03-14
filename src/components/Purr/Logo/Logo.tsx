import { Link } from 'react-router-dom'
import * as Styled from './Logo.style'

const Logo: React.FC<{ color: string, zIndex: number }> = ({ color, zIndex }) => {

    return (
        <Styled.Div style={{ color, zIndex }}> 
            <h1><Link to={'/'}>$purr</Link></h1>
            <h2>by <a href={'https://kitty.international'} target={'_blank'}>kitty.international</a></h2>
        </Styled.Div>
    )
}

export default Logo 