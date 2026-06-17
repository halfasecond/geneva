import { Link } from 'react-router-dom'

const TreeLogo = () => (
    <Link to="/" className="inline-flex flex-col items-center gap-1">
        <img src="/kittyFamily/logo.svg" alt="" className="h-10 w-10 md:h-12 md:w-12" />
        <span className="text-sm font-bold text-[#333] md:text-base">Kitty.Family</span>
    </Link>
)

export default TreeLogo