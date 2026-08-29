import axios from 'axios'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Carousel from 'kittyNews/components/Carousel'
import ShareWidget from 'kittyNews/components/ShareWidget'
import VideoPlayer from 'kittyNews/components/VideoPlayer'
import {
    Copy, CopyElement, ImageElement, ParagraphElement, CodeElement,
    BlockquoteElement, ListElement, VideoElement, GridElement
} from 'kittyNews/types/copy'
import { formatPublishedDate } from 'kittyNews/utils'
import { settings } from './config'
import * as Styled from './News.style'
import { CDN, MEDIA } from 'kittyNews/api'



const videoJsOptions = {
    autoplay: false,
    controls: true,
    responsive: true,
    fluid: true,
}

const News: React.FC<{ endpoint: string, admin: boolean }> = ({ endpoint, admin }) => {
    const { slug } = useParams<{ slug?: string }>()
    const [story, setStory] = useState<Copy | undefined>(undefined)
    const [news, setNews] = useState<[Copy] | undefined>(undefined)

    useEffect(() => {
        const getNews = async () => {
            const news = await axios.get(`${endpoint}?type=news`)
            setNews(news.data)
        }
        getNews()
    }, [])

    useEffect(() => {
        const getNews = async () => {
            try {
                const response = await axios.get<Copy>(`${endpoint}/${slug}`);
                setStory(response.data);
            } catch (error) {
                console.error('Error fetching story:', error);
            }
        };
        getNews();
    }, [slug])

    function randomise<T>(arr: T[], numItems: number): T[] {
        const arrayCopy = [...arr]
        const result = []
        for (let i = 0; i < numItems; i++) {
            if (arrayCopy.length === 0) break
            const randomIndex = Math.floor(Math.random() * arrayCopy.length)
            result.push(arrayCopy.splice(randomIndex, 1)[0])
        }
        return result
    }

    const filteredNews = news && news.filter(a => a.slug !== slug && a.published);

    const randomNews = filteredNews && randomise(filteredNews, filteredNews.length);

    return (
        <Styled.Div className={story ? story.slug : undefined}>
            {story && (
                <>
                    {admin ? (
                        <h2><Link to={`/cms/${story.slug}`}>{story.title}</Link></h2>
                    ) : (
                        <h2>{story.title}</h2>
                    )}
                    <h3>written by <Link to={`https://x.com/KittyIntl`} target={`_blank`}>@kittyIntl</Link> - {formatPublishedDate(story.publishedDate)}</h3>
                    <img src={CDN + story.thumbnail.src} alt={story.thumbnail.alt} />
                    {story.content.map((copy, i) => {
                        const Element = Object.keys(copy)[0] as keyof CopyElement;
                        switch (Element) {
                            case 'img':
                                return (
                                    <img
                                        src={CDN + (copy as ImageElement).img.src}
                                        key={i}
                                        alt={(copy as ImageElement).img.alt}
                                    />
                                );
                            case 'ul':
                                return (
                                    <ul key={i}>
                                        {(copy as ListElement).ul.map((li, q) => (
                                            <li key={`a${q}`} dangerouslySetInnerHTML={{ __html: li }} />
                                        ))}
                                    </ul>
                                );
                            case 'grid':
                                return (
                                    <Styled.Grid key={i}>
                                        {(copy as GridElement).grid.map(({ img: { src, alt }, h3 }, q) => (
                                            <div key={q}>
                                                <img src={CDN + src} alt={alt} />
                                                <h3>{h3}</h3>
                                            </div>
                                        ))}
                                    </Styled.Grid>
                                );
                            case 'blockquote':
                                return (
                                    <blockquote
                                        key={i}
                                        dangerouslySetInnerHTML={{ __html: (copy as BlockquoteElement).blockquote }}
                                    />
                                );
                            case 'code':
                                return (
                                    <code
                                        key={i}
                                        dangerouslySetInnerHTML={{ __html: (copy as CodeElement).code }}
                                    />
                                );
                            case 'p':
                                return (
                                    <p
                                        key={i}
                                        dangerouslySetInnerHTML={{ __html: (copy as ParagraphElement).p }}
                                    />
                                );
                            case 'h2':
                                return (
                                    <h2
                                        key={i}
                                        dangerouslySetInnerHTML={{ __html: (copy as any).h2 }} // :/
                                    />
                                );
                            case 'h3':
                                return (
                                    <h3
                                        key={i}
                                        dangerouslySetInnerHTML={{ __html: (copy as any).h3 }} // :/
                                    />
                                );
                            case 'component': // TODO - this logic needs expanding for types of component
                                return <p key={i} />
                            case 'video':
                                return (
                                    <VideoPlayer
                                        key={i}
                                        options={{
                                            ...videoJsOptions,
                                            sources: [{ src: MEDIA + (copy as VideoElement).video.src }],
                                            poster: CDN + (copy as VideoElement).video.poster,
                                        }}
                                    />
                                );
                            default:
                                return null;
                        }
                    })}
                </>
            )
            }
            {story && story.tags.map((tag, i) => (
                <Link to={'/'} className={'tag'} key={i}>
                    {tag}
                </Link>
            ))}
            {story && <h3>written by <Link to={`https://x.com/KittyIntl`} target={`_blank`}>@kittyIntl</Link> - {formatPublishedDate(story.publishedDate)}</h3>}
            <ShareWidget size={28} url={window.location.href} />
            <Styled.Section>
                <h2>More like this</h2>
                <Carousel
                    data={randomNews || []}
                    {...{ settings }}
                />
            </Styled.Section>

        </Styled.Div>
    );
};

export default News;
