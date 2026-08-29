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
import * as Styled from './Article.style'
import { settings } from './config'
import { ReportType } from 'kittyNews/types/report'
import { CDN, MEDIA } from 'kittyNews/api'


const videoJsOptions = {
  autoplay: false,
  controls: true,
  responsive: true,
  fluid: true,
}

const Article: React.FC<{ endpoint: string, report: ReportType | undefined, admin: boolean }> = ({ endpoint, report, admin }) => {
  const { slug } = useParams<{ slug?: string }>()
  const [article, setArticle] = useState<Copy | undefined>(undefined)
  const [articles, setArticles] = useState<[Copy] | undefined>(undefined)

  useEffect(() => {
    const getArticles = async () => {
      const articles = await axios.get(`${endpoint}?type=article`)
      setArticles(articles.data)
    }
    getArticles()
  }, [])

  useEffect(() => {
    const getArticle = async () => {
      try {
        const response = await axios.get<Copy>(`${endpoint}/${slug}`);
        setArticle(response.data);
      } catch (error) {
        console.error('Error fetching article:', error);
      }
    };
    getArticle();
  }, [slug])

  function randomise<T>(arr: T[], numItems: number): T[] {
    const arrayCopy = [...arr]
    const result = []
    for (let i = 0; i < numItems; i++) {
      if (arrayCopy.length === 0) break;
      const randomIndex = Math.floor(Math.random() * arrayCopy.length);
      result.push(arrayCopy.splice(randomIndex, 1)[0]);
    }
    return result;
  }

  const filteredArticles = articles && articles.filter(a => a.slug !== slug && a.published)

  const randomArticles = filteredArticles && randomise(filteredArticles, 4)
  const parseCopy = (copy: string) => copy.replace(/{{{highestGen}}}/g, report?.gens?.highestGen)

  return (
    <Styled.Div className={article ? article.slug : undefined}>
      {article && report && (
        <>
          {admin ? (
            <h2><Link to={`/cms/${article.slug}`}>{article.title}</Link></h2>
          ) : (
            <h2>{article.title}</h2>
          )}
          <h3>written by <Link to={`https://x.com/KittyIntl`} target={`_blank`}>@kittyIntl</Link> - {formatPublishedDate(article.publishedDate)}</h3>
          <img src={CDN + article.thumbnail.src} alt={article.thumbnail.alt} />
          {article.content.map((copy, i) => {
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
                    dangerouslySetInnerHTML={{ __html: parseCopy((copy as ParagraphElement).p) }}
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
      {article && article.tags.map((tag, i) => (
        <Link to={'/'} className={'tag'} key={i}>
          {tag}
        </Link>
      ))}
      {article && <h3>written by <Link to={`https://x.com/KittyIntl`} target={`_blank`}>@kittyIntl</Link> - {formatPublishedDate(article.publishedDate)}</h3>}
      <ShareWidget size={28} url={window.location.href} />
      <Styled.Section>
        <h2>More like this</h2>
        <Carousel
          data={randomArticles || []}
          {...{ settings }}
        />
      </Styled.Section>

    </Styled.Div>
  );
};

export default Article;
