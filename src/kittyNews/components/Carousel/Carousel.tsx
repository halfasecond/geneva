import { Copy } from 'kittyNews/types/copy'
import { Link } from 'react-router-dom'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import Slider, { Settings } from 'react-slick'
import * as Styled from './Carousel.style'
import { CDN } from 'kittyNews/api'



const Carousel = ({ data, settings }: { data: Copy[], settings: Settings  }) => {
    return (
        <Styled.Div>
            <Slider {...settings}>
                {data.map((copy: Copy, i: number) => copy.published && (
                    <Link to={`/${copy.contentType}/${copy.slug}`} key={i}>
                        <div style={{ backgroundImage: `url(${CDN}/${copy.thumbnail['src']})` }} />
                        <h2>{copy.title}</h2>
                    </Link>
                ))}
            </Slider>
        </Styled.Div>
    )
}

export default Carousel