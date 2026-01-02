import { BlockMath, InlineMath } from 'react-katex'
import Card from '../Card'
import React from 'react'

const getUrl = (link: string) => {
    if (link === 'boids') {
        return (
            <a href={'https://en.wikipedia.org/wiki/Boids'} target={'_blank'}>Boids</a>
        )
    }
    if (link === 'g2') {
        return (
            <a href={'https://substack.com/home/post/p-175559579'} target={'_blank'}>"On Gravity" (Pickett, 2025)</a>
        )
    }
} 

const Info: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <Card style={{ width: '100%', maxWidth: '720px' }} {...{ onClose }}>
            <h2>Welcome to tank.life</h2>
            <p>tank.life is a life simulator where "schools" follow gravitational dynamics from the paper {getUrl('g2')}. Unlike {getUrl('boids')}, which uses linear averaging for cohesion, this model applies an exponential gravity law:</p>
            <BlockMath math={String.raw`
                g_{\text{eff}}=\frac{GM}{r^{2}}\mathrm{e}^{\kappa r}
            `} />
            <p>κ scales with local density and velocity shear, mirroring effects in planetary orbits and galactic rotation. Cohesion derives from <InlineMath math={String.raw`
                \mathrm{e}^{\kappa r}
            `} /></p>
            <p>Mass affects inertia, alignment saturates in dense groups, and predators induce avoidance.
Explore emergent behaviors: spawn a shark by clicking, observe vortices, inertia, wall repulsion, and drag. Adjust parameters to study order or chaos.</p>
        </Card>
    )

}

export default Info