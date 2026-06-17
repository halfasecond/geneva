import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../Logo'

const Home = () => {
    const [kittyId, setKittyId] = useState('')
    const navigate = useNavigate()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const id = parseInt(kittyId, 10)
        if (id > 0) navigate(`/kitty/${id}`)
    }

    return (
        <div className="flex flex-col items-center gap-8 text-center">
            <Logo />

            <p className="max-w-xl text-lg text-kf-warm leading-relaxed">
                Ever wondered how your kitty came to be? Place a kitty id in the box to find out…
            </p>

            <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
                <input
                    type="number"
                    min={1}
                    placeholder="Kitty ID"
                    value={kittyId}
                    onChange={(e) => setKittyId(e.target.value)}
                    className="kf-input flex-1"
                />
                <button type="submit" className="kf-btn shrink-0" disabled={!kittyId}>
                    Explore
                </button>
            </form>

            <div className="kf-card max-w-2xl w-full text-left">
                <p className="text-kf-pink font-medium mb-2">🙀 Update!</p>
                <p className="text-kf-warm">
                    Kitty.family now has a chat room — you just need to own at least one kitty to participate.
                    The Geneva port is underway while the CK indexer catches up.
                </p>
            </div>

            <section className="w-full max-w-4xl text-left">
                <h2 className="mb-4 text-center">Featured kitties</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="kf-card flex flex-col items-center gap-2 text-center opacity-60">
                            <div className="h-32 w-full rounded-xl bg-kf-sand animate-pulse" />
                            <p className="text-sm text-kf-warm">Coming soon — CK API + indexer</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

export default Home