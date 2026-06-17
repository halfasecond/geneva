import { Link } from 'react-router-dom'

type Props = {
    title: string
    description: string
    note?: string
}

const Placeholder = ({ title, description, note }: Props) => (
    <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 normal-case">{title}</h1>
        <p className="mb-6 text-lg text-kf-warm leading-relaxed">{description}</p>
        {note && (
            <div className="kf-card mb-6 border-kf-coral/20 bg-kf-coral/5 text-sm text-kf-warm">
                {note}
            </div>
        )}
        <Link to="/" className="kf-link">← Back home</Link>
    </div>
)

export default Placeholder