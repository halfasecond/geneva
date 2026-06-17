import { Link } from 'react-router-dom'

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`flex flex-col items-center text-center ${className}`}>
        <h1 className="text-4xl md:text-6xl tracking-wide drop-shadow-[2px_2px_3px_rgba(255,255,255,0.4)] mb-6">
            <Link to="/" className="hover:text-purr-pink transition-colors">$purr</Link>
        </h1>
        <h2 className="text-base md:text-lg drop-shadow-[2px_2px_3px_rgba(255,255,255,0.4)]">
            by{' '}
            <a
                href="https://kitty.international"
                target="_blank"
                rel="noreferrer"
                className="purr-link"
            >
                kitty.international
            </a>
        </h2>
    </div>
)

export default Logo