import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import * as Styled from './Search.style'
import Bot from '../Bot'
import { Bot as BotType } from '../Bot/bot.types'
import { Counts as CountsType } from '../Counts/count.types'
import { unPadAndFormatPrice } from '../../utils/format'

const { VITE_APP_ENDPOINT } = import.meta.env

const searchables: Record<string, string> = {}

const includeTermWhiteList = ['sale', 'all']
const orderByWhitelist = ['current_price', 'age']
const orderDirectionWhitelist = ['asc', 'desc']

const checkboxSections = {
    power: ['flat', 'needs a charge', 'charged', 'fully charged'],
    award: ['Odd', 'Musical', 'Agile', 'Recycled', 'Centurion', 'Virtuoso'],
    prime: ['Prime', 'Twin', 'Yokel', 'Amorous'],
} as const

const PER_PAGE = 20

interface Props {
    counts?: CountsType
    activeAuction?: number
    loggedIn?: string | undefined
}

type CheckboxSections = {
    power: string[]
    award: string[]
    prime: (string | undefined)[]
}

type CheckboxesState = {
    power: Record<string, boolean>
    award: Record<string, boolean>
    prime: Record<string, boolean>
}

interface SearchState {
    page: number
    include?: Record<string, boolean>
    orderDirection?: string
    orderBy?: string
    terms?: string[]
}

const Search: React.FC<Props> = ({ counts, activeAuction, loggedIn }) => {
    const [bots, setBots] = useState<BotType[]>([])
    const [total, setTotal] = useState<number>(0)
    const [search, setSearch] = useState<SearchState>({ page: 1 })
    const [checkboxes, setCheckboxes] = useState<CheckboxesState>({
        power: checkboxSections['power'].reduce((acc, power) => ({ ...acc, [power]: false }), {}),
        award: checkboxSections['award'].reduce((acc, award) => ({ ...acc, [award]: false }), {}),
        prime: checkboxSections['prime'].reduce((acc, prime) => ({ ...acc, [prime]: false }), {}),
    })
    const [amour, setAmour] = useState<number>(0)

    const navigate = useNavigate()

    const isValidIncludeTerm = (term: string): boolean => includeTermWhiteList.includes(term)

    const getInclude = (_params: URLSearchParams): Record<string, boolean> => {
        let string = _params.get('include')
        const include: Record<string, boolean> = {}
        if (!string)
            return {
                sale: true,
            }
        const _string = string.split(',')
        _string.forEach((s) => {
            if (isValidIncludeTerm(s)) {
                include[s] = true
            }
        })
        includeTermWhiteList.forEach((s) => {
            if (!include[s]) {
                include[s] = false
            }
        })
        return include
    }

    const prepSearchObject = useCallback(
        (_params: URLSearchParams): Record<string, any> => {
            const _search: SearchState = { page: 1 }

            _search.include = getInclude(_params)
            _search.page = getPage(_params)

            let orderDirection = _params.get('orderDirection')
            _search.orderDirection =
                orderDirection && orderDirectionWhitelist.includes(orderDirection)
                    ? orderDirection
                    : orderDirectionWhitelist[0]

            let orderBy = _params.get('orderBy')
            _search.orderBy = orderBy && orderByWhitelist.includes(orderBy) ? orderBy : orderByWhitelist[0]

            let _string = _params.get('search')
            if (!_string) return _search
            const __string = _string.split(' ')
            __string.forEach((s) => {
                console.log(s)
            })
            return _search
        },
        [],
    )

    const assessUrl = useCallback(
        (url: string, _search: SearchState) => {
            url === location.search.replace('?', '') ? setSearch(_search) : navigate(`${location.pathname}?${url}`)
        },
        [navigate],
    )

    useEffect(() => {
        const _params = new URLSearchParams(location.search)
        const _search = prepSearchObject(_params) as SearchState
        const url = makeUrl(_search, searchables)
        assessUrl(url, _search)
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth',
        })
    }, [prepSearchObject, assessUrl])

    const isNumber = (number: string): boolean => /^-?[\d.]+(?:e-?\d+)?$/.test(number)

    const getPage = (_params: URLSearchParams): number => {
        let page = _params.get('page')
        return page && isNumber(page) ? Number(page) : 1
    }

    const addSearch = (_search:  SearchState) => {
        const url = makeUrl(_search, {})
        navigate(`${location.pathname}?${url}`)
    }

    const concatenateWithAmpersand = (strings: string[]): string => strings.filter(Boolean).join('&')

    const makeUrl = (_search: SearchState, searchables: any): string => {
        let include = ``
        let orderAndPages = ``
        let searchStrings: string[] = []
        if (include === 'jam') {
            console.log(searchables)
        }
        // Object.keys(_search).forEach((term) => {
        //     if (term === 'terms' && _search.terms) {
        //         const cleanTerms = _search.terms.map((t: string) => {
        //             const searchable = searchables.find(({ description }: any) => description === t)
        //             return searchable?.description || ''
        //         })
        //         if (cleanTerms.length) {
        //             searchStrings.push(cleanTerms.join('+'))
        //         }
        //     }
        // })
        let searchString = searchStrings.length ? `search=${searchStrings.join('+')}` : ''
        return concatenateWithAmpersand([include, searchString, orderAndPages])
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, category: keyof CheckboxesState) => {
        const { name, checked } = e.target
        setCheckboxes(prevState => ({ ...prevState, [category]: { ...prevState[category], [name]: checked } }))
    }

    const getBots = async () => {
        try {
            // const { data: { data, total } } = await axios.get(`${VITE_APP_ENDPOINT}/nfts?sale=true`)
            setBots([{
                tokenId: 1,
                arms: 6,
                legs: 4,
                body: 10,
                grill: 5,
                panel: 4,
                head: 3,
                awards: [],
                luck: 4,
                skill: 13,
                power: 32,
                isPrime: 6,
                issue: 4,
                currentPrice: '',
                forSale: false,
                owner: 'string',
                owners: [''],
                bids: []
            }])
            setTotal(100)
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        getBots()
    }, [activeAuction])

    const isEqual = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase()

    return !counts && (
        <Styled.Div>
            <h2>Flowbots Search</h2>
            {/* <h3>Total: {total} (of {counts.total}) - ℙrime: {bots && bots.filter(({ isPrime }) => isPrime).length} (of {counts.prime})</h3> */}
            {/* <Styled.Search>
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
            </Styled.Search> */}
            <Styled.Grid>
                {bots.map((bot: BotType, i: number) => (
                    <div key={i}>
                        <Link to={`/flowbot/${bot.tokenId}`}>
                            <Bot bot={bot} lines={true} />
                        </Link>
                        <h2><span>#{bot.tokenId}</span><span style={{ opacity: loggedIn && isEqual(loggedIn, bot.owner) ? '0.4' : 1 }}>{unPadAndFormatPrice(bot.currentPrice)}</span></h2>
                    </div>

                ))}
            </Styled.Grid>
            {total > PER_PAGE && (
                <Styled.Pagination>
                    <div>
                        <button onClick={() => addSearch({ ...search, page: search.page - 1 })} disabled={search.page === 1}>prev.</button>
                    </div>
                    <div>
                        <button onClick={() => addSearch({ ...search, page: search.page + 1 })} disabled={total <= ((search.page + 1) * PER_PAGE)}>next</button>
                    </div>
                </Styled.Pagination>
            )}
        </Styled.Div>
    )
}

export default Search