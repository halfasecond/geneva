import { Link } from 'react-router-dom'

const Logo = () => (
    <Link to="/" className="inline-flex flex-col items-center gap-3 group">
        <img
            src="/kittyFamily/logo.svg"
            alt=""
            className="h-16 w-16 text-kf-coral group-hover:scale-105 transition-transform"
        />
        <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-kf-ink">
            kitty<span className="text-kf-coral">.</span>family
        </span>
    </Link>
)

export default Logo