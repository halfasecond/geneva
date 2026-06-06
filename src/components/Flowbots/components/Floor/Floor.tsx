import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, /* useNavigate */ } from 'react-router-dom'
import * as Styled from './Floor.style'
import Bot from '../Bot'
import { Bot as BotType } from '../Bot/bot.types'
import { Counts as CountsType } from '../Counts/count.types'
import { unPadAndFormatPrice } from '../../utils/format'

const { VITE_APP_ENDPOINT } = import.meta.env;

const checkboxSections = {
    power: ['flat', 'needs a charge', 'charged', 'fully charged'],
    award: ['Odd', 'Musical', 'Agile', 'Recycled', 'Centurion', 'Virtuoso'],
    prime: ['Prime', 'Twin', 'Yokel', 'Amorous'],
}
const PER_PAGE = 20

interface Props {
    counts: CountsType | undefined;
    activeAuction: number;
    loggedIn: undefined | string;
}

type CheckboxSections = {
    power: string[]
    award: string[]
    prime: (string | undefined)[]
}

type CheckboxesState = {
    power: { [key: string]: boolean }
    award: { [key: string]: boolean }
    prime: { [key: string]: boolean }
}

const Floor: React.FC<Props> = ({ counts, activeAuction, loggedIn }) => {
    const [bots, setBots] = useState<BotType[]>([])
    const [total, setTotal] = useState<number>(0)
    const [search, setSearch] = useState({ page: 1 })
    const [checkboxes, setCheckboxes] = useState<CheckboxesState>({
        power: checkboxSections['power'].reduce((acc, power) => ({ ...acc, [power]: false }), {}),
        award: checkboxSections['award'].reduce((acc, award) => ({ ...acc, [award]: false }), {}),
        prime: checkboxSections['prime'].reduce((acc, award) => ({ ...acc, [award]: false }), {})
    })
    const [amour, setAmour] = useState(0)

    // const navigate = useNavigate()

    // useEffect(() => {
    //     const _params = new URLSearchParams(location.search)
    //     const _search = prepSearchObject(_params)
    //     const url = makeUrl(_search, searchables)
    //     assessUrl(url, _search)
    // }, [location.search, prepSearchObject, assessUrl, searchables])

    // const addSearch = (_search: any) => {
    //     const url = makeUrl(_search, {})
    //     navigate(`${location.pathname}?${url}`)
    // }

    // const makeUrl = (_search: any, searchables: any) => {
    //     console.log(_search)
    //     let include = ``;
    //     let orderAndPages = ``;
    //     let searchStrings = [];
    //     Object.keys(_search).forEach((term) => {
    //         if (term === 'include') {
    //             const includes = [];
    //             if (Object.keys(_search.include).length) {
    //                 Object.keys(_search.include).forEach((s) => {
    //                     if (_search.include[s]) {
    //                         includes.push(s);
    //                     }
    //                 });
    //                 if (includes.length) {
    //                     include = `include=${includes.join(',')}`;
    //                 }
    //             }
    //         } else {
    //             if (['orderBy', 'orderDirection', 'page'].includes(term)) {
    //                 if (![1, 'asc', 'current_price'].includes(_search[term])) {
    //                     orderAndPages = `${orderAndPages}${orderAndPages.length > 0 ? '&' : ''}${term}=${_search[term]}`;
    //                 }
    //             } else {
    //                 if (term === 'terms') {
    //                     const cleanTerms = _search[term].map(
    //                         (t) => searchables.find(({ description }) => description === t).description,
    //                     );
    //                     if (cleanTerms.length) {
    //                         searchStrings.push(cleanTerms.join('+'));
    //                     }
    //                 } else {
    //                     if (!(term === 'type' && _search[term] === 'normal')) {
    //                         searchStrings.push(`${term}:${_search[term]}`);
    //                     }
    //                 }
    //             }
    //         }
    //     });
    //     let searchString = searchStrings.length ? `search=${searchStrings.join('+')}` : '';
    //     return concatenateWithAmpersand([include, searchString, orderAndPages]);
    // };

    // const concatenateWithAmpersand = (strings) => strings.filter(Boolean).join('&');

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, category: keyof typeof checkboxes) => {
        const { name, checked } = e.target
        setCheckboxes(prevState => ({ ...prevState, [category]: { ...prevState[category], [name]: checked } }))
    }

    const getBots = async () => {
        try {
            const { data: { data, total } } = await axios.get(`${VITE_APP_ENDPOINT}/nfts?sale=true&limit=5`)
            setBots([...data])
            setTotal(total)
        } catch (e) {
            console.log(e)
        }

    }

    useEffect(() => {
        getBots()
        setSearch({ page: 1 })
    }, [activeAuction])

    const isEqual = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

    return counts && (
        <Styled.Div className={'flowbots-floor'}>
            <h3>Floor: {bots.length > 0 && <Link to={`search?include=sale`}>{unPadAndFormatPrice(bots[0].currentPrice)}</Link>} - Listed: <Link to={`search?include=sale`}>{parseFloat(((100 / counts.total) * total).toFixed(2).toString())}</Link>% ({total} of {counts.total})</h3>
            <Styled.Search>
                {(Object.keys(checkboxSections) as Array<keyof CheckboxSections>).map((section, i: number) => {
                    const _array = checkboxSections[section]
                    return (
                        <div key={i}>
                            {_array.map((alt, q) => {
                                if (counts[alt] > 0 || (alt === 'Prime')) {
                                    let src = section === 'power'
                                        ? `/battery${alt === checkboxSections.power[0] ? '25' : alt === checkboxSections.power[1] ? '50' : alt === checkboxSections.power[2] ? '75' : '100'}.svg`
                                        : alt === 'Amorous' && amour > 0 ? amour === 1 ? '/amorous2.svg' : `/obsessed.svg` : `/${alt}.svg`
                                    src = src.toLowerCase()
                                    const amourLimit = counts['Obsessed'] > 0 ? 2 : 1
                                    return (
                                        <label key={q}>
                                            {alt === 'Prime' ? <span>{'ℙ'}</span> : <img {...{ src, alt }} />}
                                            <input
                                                type="checkbox"
                                                name={alt}
                                                checked={checkboxes[section][alt as string]}
                                                onChange={e => handleCheckboxChange(e, section)}
                                            />
                                            {alt === 'Amorous' && counts['Very Amorous'] > 0 && (
                                                <div>
                                                    <button disabled={amour === 0} onClick={() => setAmour(prevState => prevState - 1)}>-</button>
                                                    <button disabled={amour === amourLimit} onClick={() => setAmour(prevState => prevState + 1)}>+</button>
                                                </div>
                                            )}
                                        </label>
                                    );
                                }
                            })}
                        </div>
                    )
                })}
            </Styled.Search>
            <Styled.Grid>
                {bots.slice((search.page - 1) * PER_PAGE, search.page * PER_PAGE).map((bot: BotType, i: number) => (
                    <div key={i}>
                        <Link to={`/flowbot/${bot.tokenId}`}>
                            <Bot bot={bot} lines={true} />
                        </Link>
                        <h2><span>#{bot.tokenId}</span><span style={{ opacity: loggedIn && isEqual(loggedIn, bot.owner) ? '0.4' : 1 }}>{unPadAndFormatPrice(bot.currentPrice)}</span></h2>
                    </div>

                ))}
            </Styled.Grid>
            
        </Styled.Div>
    )
}

export default Floor