import * as Styled from './Gens.style'
import { Link } from 'react-router-dom'
import { ReportType } from 'kittyNews/types/report'

const URL = 'https://cryptokitties.co/search?include=sale,sire,other&search='

const GEN_KEYS = [
    ...Array.from({ length: 26 }, (_, i) => `gen${i}`),
    'gen26etc',
    'gen100',
    'gen1000',
    'gen10000',
    'highestGen',
]

const labelFor = (key: string) => {
    if (key === 'gen26etc') return 'gen26+'
    if (key === 'gen10000') return 'gen10k'
    return key
}

const searchFor = (key: string, gens: Record<string, number>) => {
    if (key === 'gen26etc') return `26-${gens.highestGen}`
    if (key === 'highestGen') return String(gens.highestGen)
    return String(Number(key.replace('gen', '')))
}

const Gens: React.FC<{ report: ReportType }> = ({ report: { gens } }) => (
    <Styled.Div>
        {gens && GEN_KEYS.map((key) => (
            <div key={key}>
                {labelFor(key)}
                <Link to={`${URL}gen:${searchFor(key, gens)}&orderBy=age`} target={'_blank'}>
                    {gens[key] ?? 0}
                </Link>
            </div>
        ))}
    </Styled.Div>
)

export default Gens