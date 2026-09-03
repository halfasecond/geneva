import { Copy } from 'kittyNews/types/copy'
import { Link } from 'react-router-dom'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import Slider, { Settings } from 'react-slick'
import * as Styled from './Carousel.style'
import { CDN } from 'kittyNews/api'

const Card = ({ copy }: { copy: Copy }) => (
    <Link to={`/${copy.contentType}/${copy.slug}`}>
        <div style={{ backgroundImage: `url(${CDN}/${copy.thumbnail?.src})` }} />
        <h2>{copy.title}</h2>
    </Link>
)

const Carousel = ({ data, settings }: { data: Copy[], settings: Settings  }) => {
    const slides = data.filter((copy) => copy.published)
    return (
        <Styled.Div>
            <Styled.MobileTrack>
                {slides.map((copy, i) => (
                    <Card copy={copy} key={`m-${copy.slug || i}`} />
                ))}
            </Styled.MobileTrack>
            <Styled.DesktopTrack>
                <Slider {...settings}>
                    {slides.map((copy, i) => (
                        <Card copy={copy} key={`d-${copy.slug || i}`} />
                    ))}
                </Slider>
            </Styled.DesktopTrack>
        </Styled.Div>
    )
}

export default Carousel