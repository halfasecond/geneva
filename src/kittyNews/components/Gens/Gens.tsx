import * as Styled from './Gens.style'
import { Link } from 'react-router-dom'
import { ReportType } from 'kittyNews/types/report'

const URL = 'https://cryptokitties.co/search?include=sale,sire,other&search='

const Gens: React.FC<{ report: ReportType }> = ({ report: { gens } }) => (
    <Styled.Div>
        {gens && Object.keys(gens).map((gen, i) => gen !== 'highestGen' && gen !== 'gen26' && (
            <div key={i}>
                {gen === 'gen26etc' ? 'gen26+' : gen === 'gen10000' ? 'gen10k' : gen}
                {gen === 'gen26etc' ? (
                    <Link to={`${URL}gen:${26}-${gens['highestGen']}&orderBy=age`} target={'_blank'}>{gens['gen26etc']}</Link>
                ) : (
                    <Link to={`${URL}gen:${Number(gen.replace('gen', ''))}&orderBy=age`} target={'_blank'}>{gens[gen]}</Link>
                )}
            </div>
        ))}
        {gens && Object.keys(gens).map((gen, i) => gen === 'highestGen' && (
            <div key={i}>
                {gen}
                <Link to={`${URL}gen:${gens['highestGen']}&orderBy=age`} target={'_blank'}>{gens[gen]}</Link>
            </div>
        ))}
    </Styled.Div>
)

export default Gens