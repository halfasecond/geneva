import { Link } from 'react-router-dom'
import * as Styled from './FamilyLogo.style'

interface FamilyLogoProps {
    larger?: boolean
}

const FamilyLogo = ({ larger = false }: FamilyLogoProps) => (
    <Styled.Div larger={larger}>
        <img src="/kittyFamily/logo.svg" alt="Kitty.Family" />
        <h1>
            <Link to="/">Kitty.Family</Link>
        </h1>
        <h2>
            by{' '}
            <Link to="https://kitty.international" target="_blank" rel="noreferrer">
                Kitty.International
            </Link>
        </h2>
    </Styled.Div>
)

export default FamilyLogo