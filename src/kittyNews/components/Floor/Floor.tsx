import * as Styled from './Floor.style'
import { Link } from 'react-router-dom'
import { FloorData/* , FloorItem */ } from './Floor.types'
import Diamond from 'kittyNews/components/Diamond'
import { ReportType } from 'kittyNews/types/report'

const Floor: React.FC<{ floor: ReportType }> = ({ floor: _floor }) => {
    const floor = {
        sale: { ..._floor.sale, icon: 'offer.svg', searchUrl: '?include=sale' },
        sire: { ..._floor.sire, icon: 'eggplant.svg', searchUrl: '?include=sire' },
        gen0: { ..._floor.gen0, icon: 'gen0.svg', searchUrl: '?include=sale&search=gen:0' },
        gen0virgin: { ..._floor.gen0virgin, icon: 'normal.png', searchUrl: '?include=sale&search=gen:0+virgin:true' },
        founders: { ..._floor.founders, icon: 'founders.svg', searchUrl: '?include=sale&search=id:1-100' },
        fancy: { ..._floor.fancy, icon: 'fancy.svg', searchUrl: '?include=sale&search=type:fancy' },
        shinyfancy: { ..._floor.shinyfancy, icon: 'shinyfancy.svg', searchUrl: '?include=sale&search=type:shinyfancy' },
        exclusive: { ..._floor.exclusive, icon: 'exclusive.svg', searchUrl: '?include=sale&search=type:exclusive' },
        diamond: { ..._floor.diamond, icon: 'diamond.svg', searchUrl: '?include=sale&search=mewtation:diamond' },
        gilded: { ..._floor.gilded, icon: 'gilded.svg', searchUrl: '?include=sale&search=mewtation:gilded' },
        amethyst: { ..._floor.amethyst, icon: 'amethyst.svg', searchUrl: '?include=sale&search=mewtation:amethyst' },
        lapis: { ..._floor.lapis, icon: 'lapis.svg', searchUrl: '?include=sale&search=mewtation:lapis' },
        purrstige: { ..._floor.purrstige, icon: 'purrstige.svg', searchUrl: '?include=sale&search=type:purrstige' },
        specialedition: { ..._floor.specialedition, icon: 'specialedition.svg', searchUrl: '?include=sale&search=type:specialedition' },
        day1: { ..._floor.day1, icon: 'normal.svg', searchUrl: '?include=sale&search=id:1-3365' },
        born2017: { ..._floor.born2017, icon: 'normal.svg', searchUrl: '?include=sale&search=id:1-438354' }
    }

    return (
        <Styled.Div>
            {floor && Object.keys(floor).map((item: string, i: number) => {
                const floorItem = floor[item as keyof FloorData]
                if (!floorItem?.price) return null
                return (
                    <div key={i}>
                        {item === 'diamond' ? (
                            <Diamond />
                        ) : (
                            <img src={`/images/icons/${floorItem.icon}`} alt={item} />
                        )}
                        
                        <h2>{item}</h2>
                        <Link to={`https://cryptokitties.co/search${floorItem.searchUrl}`} target={'_blank'}>
                            Ξ{floorItem.price}
                        </Link>
                    </div>
                );
            })}
        </Styled.Div>
    )
}

export default Floor