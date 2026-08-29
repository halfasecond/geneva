import * as Styled from './Headline.style'
import { Copy, ParagraphElement } from 'kittyNews/types/copy'
import { formatPublishedDate } from 'kittyNews/utils'
import { CDN } from 'kittyNews/api'


const Headline: React.FC<{ copy: Copy, headlineImage: string }> = ({ copy, headlineImage }) => {
    return (
        <Styled.Div>
            <h1><img src={`${CDN}/images/kittynews/headlines/${headlineImage}`} alt={copy.title} /></h1>
            {copy.slug === 'purr-new-erc20-by-kitty-international' ? (
                <video
                    autoPlay
                    loop
                    muted={true}
                    playsInline
                    src={`${CDN}/images/purr/purrLaunch1080.mp4`}
                />
            ) : (
                <img src={`${CDN}${copy.thumbnail.src}`} alt={copy.thumbnail.alt} />
            )}
            {copy.content && copy.content.map((c, i: number) => {
                const elementType = Object.keys(c)
                if (elementType.length && elementType[0] === 'p') {
                    return (
                        <p key={i} dangerouslySetInnerHTML={{ __html: 
                            `<b>${formatPublishedDate(copy.publishedDate)}</b> - ${(c as ParagraphElement).p}`
                        }} />
                    )
                }
            })}
        </Styled.Div>
    )
}

export default Headline