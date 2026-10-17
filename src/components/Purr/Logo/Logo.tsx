import { Link } from 'react-router-dom'

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`flex flex-col items-center text-center ${className}`}>
        <h1 className="text-[clamp(5.5rem,18vw,10rem)] leading-none tracking-normal sm:tracking-wide drop-shadow-[2px_2px_3px_rgba(255,255,255,0.4)] mb-5 md:mb-8">
            <Link to="/">$purr</Link>
        </h1>
        <h2 className="text-lg md:text-2xl drop-shadow-[2px_2px_3px_rgba(255,255,255,0.4)]">
            by{' '}
            <a
                href="https://kitty.international"
                target="_blank"
                rel="noreferrer"
                className="hover:text-purr-pink transition-colors"
            >
                kitty.international
            </a>
        </h2>
    </div>
)

export default Logo