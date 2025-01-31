import { NavLink } from 'react-router-dom'

const Menu: React.FC<{ links: string[] }> = ({ links }) => {
    return (
        <ul>
            {links.map((link: string, i: number) =>
                <li key={i}><NavLink to={`/${link}`} style={({ isActive }) => ({
                    textDecoration: isActive ? 'underline' : 'none',
                    fontWeight: isActive ? 'bold' : 'normal'
                  })}>{link}</NavLink></li>
            )}
        </ul>
    )
}

export default Menu