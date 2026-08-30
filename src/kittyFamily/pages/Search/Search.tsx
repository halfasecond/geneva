// @ts-nocheck
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Checkbox from 'kittyFamily/components/Checkbox'
import SearchBar from 'kittyFamily/components/SearchBar'
import Select from 'kittyFamily/components/Select'
import Kitty from 'kittyFamily/components/Kitty'
import KittyModal from 'kittyFamily/components/KittyModal'
import Pagination from 'kittyFamily/components/Pagination'
import Tag from 'kittyFamily/components/Tag'
import * as Styled from './Search.style'
import { API } from 'kittyFamily/api'
import {
	acceptedInputForType,
	acceptedInputForCooldown,
	acceptedInputForMewtation,
	includeTermWhitelist,
	isValidSearchTerm,
	isValidIncludeTerm,
	isNumber,
	isWithinRange,
	searchTermWhitelist,
	orderByWhitelist,
	orderDirectionWhitelist,
	makeUrl,
	makeApiUrl,
	LIMIT,
  } from './utils';

const specialTerms = ['fancy', 'exclusive', 'specialedition', 'shinyfancy']

const Search = ({ account, searchables, handlePurchase, profile, defaultInclude = { sale: true } }) => {
	const location = useLocation()
	const navigate = useNavigate()

	const [results, setResults] = useState(undefined)
	const [total, setTotal] = useState(undefined)
	const [search, setSearch] = useState(undefined)
	const [modal, setModal] = useState(undefined)
    const [pureBred, setPureBred] = useState([])

	const getPage = (_params) => {
		let page = _params.get('page')
		return page && isNumber(page) ? Number(page) : 1
	}

	const getInclude = (_params) => {
		let string = _params.get('include')
		const include = {}
		if (!string)
			return defaultInclude
		const _string = string.split(',')
		_string.forEach((s) => {
			if (isValidIncludeTerm(s)) {
				include[s] = true
			}
		})
		includeTermWhitelist.forEach((s) => {
			if (!include[s]) {
				include[s] = false
			}
		})
		return include
	}

	const parseSearchTerm = (searchTermType, searchTerm, _search) => {
		if (isNumber(searchTerm) || isWithinRange(searchTerm)) {
			_search[searchTermType] = searchTerm
		} else if (searchTerm.split(',').length > 0) {
			const items = []
			searchTerm.split(',').forEach((_term) => {
				if (
					isNumber(_term) ||
					(acceptedInputForCooldown(_term) && searchTermType === 'cooldown') ||
					(acceptedInputForMewtation(_term) && searchTermType === 'mewtation')
				) {
					items.push(_term)
				}
			})
			_search[searchTermType] = items
		}
	}

	const handleStringSearchTerm = (searchTermType, searchTerm, _search, searchables) => {
        console.log(searchTerm, searchTerm === 'any', searchTermType,)
		const findInSearchables = (searchType) =>
			[...searchables.filter(({ type }) => type === searchType)].find(
				(f) => f.description === searchTerm
			)
		const findInVariants = [].find((f) => f.variants && f.variants.includes(searchTerm))

		const conditions = {
			type: () => acceptedInputForType(searchTerm) && (_search.type = searchTerm),
			fancy: () =>
				findInSearchables('fancy') &&
				((_search.type = searchTermType), (_search[searchTermType] = searchTerm)),
			exclusive: () =>
				findInSearchables('exclusive') &&
				((_search.type = searchTermType), (_search[searchTermType] = searchTerm)),
			specialedition: () =>
				findInSearchables('specialedition') &&
				((_search.type = searchTermType), (_search[searchTermType] = searchTerm)),
			shinyfancy: () =>
				findInSearchables('shinyfancy') &&
				((_search.type = searchTermType), (_search[searchTermType] = searchTerm)),
			purrstige: () =>
				findInSearchables('purrstige') &&
				((_search.type = searchTermType), (_search[searchTermType] = searchTerm)),
			variant: () => findInVariants && (_search.variant = searchTerm),
			variation: () => findInVariants && (_search.variant = searchTerm),
			virgin: () => searchTerm === 'true' && (_search.virgin = 'true'),
			account: () => (_search.account = searchTerm),
			hatchedBy: () => (_search.hatchedBy = [searchTerm]),
			pfrom: () => (_search.min = searchTerm),
			pto: () => (_search.max = searchTerm),
			preggers: () => searchTerm === 'true' && (_search.preggers = searchTerm),
			resting: () => searchTerm === 'true' && (_search.resting = searchTerm),
            hats: () => searchTerm === 'true' && (_search.hats = searchTerm),
            m1: () => (searchTerm === 'any' || Number(searchTerm) <= 12) && (_search.m1 = searchTerm),
            m2: () => (searchTerm === 'any' || Number(searchTerm) <= 12) && (_search.m2 = searchTerm),
            m3: () => (searchTerm === 'any' || Number(searchTerm) <= 12) && (_search.m3 = searchTerm),
            m4: () => (searchTerm === 'any' || Number(searchTerm) <= 12) && (_search.m4 = searchTerm),
		}

		if (conditions[searchTermType]) conditions[searchTermType]()
	}

	const prepSearchObject = useCallback(
		(_params) => {
			const _search = {}

			_search.include = getInclude(_params)
			_search.page = getPage(_params)

			let orderDirection = _params.get('orderDirection')
			_search.orderDirection =
				orderDirection && orderDirectionWhitelist.includes(orderDirection)
					? orderDirection
					: orderDirectionWhitelist[0]

			let orderBy = _params.get('orderBy')
			_search.orderBy =
				orderBy && orderByWhitelist.includes(orderBy) ? orderBy : orderByWhitelist[0]

			let _string = _params.get('search')
			if (!_string) return _search
			const __string = _string.split(' ')
			__string.forEach((s) => {
				if (s.split(':').length === 2) {
					const searchTermType = s.split(':')[0]
					if (isValidSearchTerm(searchTermType)) {
						const searchTerm = s.split(':')[1]
						if (searchTerm) {
							if (['id', 'cooldown', 'gen', 'mewtation'].includes(searchTermType)) {
								parseSearchTerm(searchTermType, searchTerm, _search)
							} else {
								handleStringSearchTerm(searchTermType, searchTerm, _search, searchables)
							}
						}
					}
				} else {
					_search.terms = _search.terms || []
					const searchable = searchables.find(({ description }) => description === s)
					if (searchable) {
						if (specialTerms.includes(searchable.type)) {
							handleStringSearchTerm(searchable.type, s, _search, searchables)
						} else {
							const sameTypeTerms = searchables
								.filter(({ type }) => type === searchable.type)
								.map(({ description }) => description)
							_search.terms = _search.terms.filter((term) => !sameTypeTerms.includes(term))
							_search.terms.push(s)
						}
					}
				}
			})
			return _search
		},
		[searchables]
	)

	const changeDirection = (orderDirection) => addSearch({ ...search, orderDirection })
	const changeOrderBy = (orderBy) => addSearch({ ...search, orderBy })
	const changePage = (page) => {
		const totalPages = Math.ceil(total / LIMIT)
		if (isNumber(page) && page <= totalPages) {
			const _search = {...search, page }
			const url = makeUrl(_search, searchables)
			navigate(`${location.pathname}?${url}`)
		}
	}

	const changeInclude = (checkboxName, isChecked) => {
		const include = { ...search.include }
		include[checkboxName] = isChecked
		if (!Object.values(include).filter((val) => val).length) {
			include.sale = true
		}
		addSearch({ ...search, include })
	}

	const addTerm = (description, sType) => {
		const _search = { ...search }
		_search['page'] = 1
		if (sType) {
			if (specialTerms.includes(sType)) {
				specialTerms.forEach((type) => {
					if (_search[type] && sType !== _search[type]) delete _search[type]
				})
				_search.type = sType
				_search[sType] = description
				_search['mewtation'] && delete _search['mewtation']
				_search['terms'] && delete _search['terms']
				addSearch(_search)
			} else {
				if (searchTermWhitelist.includes(sType)) {
					_search[sType] = description
					addSearch(_search)
				} else {
				}
			}
		} else {
			const searchable = searchables.find((s) => s.description === description)
			if (searchable) {
				_search.terms = _search.terms || []
				delete _search['type']
				specialTerms.forEach((type) => {
					delete _search[type]
				})
				const sameTypeTerms = searchables
					.filter(({ type }) => type === searchable.type)
					.map((s) => s.description)
				_search.terms = _search.terms.filter((term) => !sameTypeTerms.includes(term))
				_search.terms.push(description)
			}
			addSearch(_search)
		}
	}

	const removeTerm = (description, sType) => {
		const _search = { ...search }
		if (sType === 'terms') {
			_search.terms = _search.terms.filter((term) => term !== description)
		} else if (_search[sType] === description) {
			delete _search[sType]
		}
		addSearch(_search)
	}

	const assessUrl = useCallback(
		(url, _search) => {
			url === location.search.replace('?', '')
				? setSearch(_search)
				: navigate(`${location.pathname}?${url}`)
		},
		[location, history]
	)

	const formatSearchInputDisplay = (_search) =>
		formatTags(_search)
		.map((s) => {
			if (s === 'terms') {
			    return search[s].join(' ');
			} else {
			if (!(s === 'pto' || s === 'pfrom' || (s === 'type' && search[s] === 'normal'))) {
				return [...specialTerms, 'purrstige'].includes(s) ? `${search[s]}` : `${s}:${search[s]}`;
			}
			}
			return undefined;
		})
		.filter((item) => item !== undefined)
		.join(' ');

	const formatTags = (_search) =>
		Object.keys(search).filter(
			(s) =>
			(searchTermWhitelist.includes(s) &&
				!['virgin'].includes(s) && !['hats'].includes(s) &&
				!(['account'].includes(s) && _search[s] === account?.wallet)) ||
			s === 'terms',
		);

	const handleSearchSubmit = (searchQuery) => {
		const _search = { ...search }
		_search.terms = []
		const searchTerms = searchQuery.trim().split(/\s+/)
		searchTerms.forEach((term) => {
			const searchable = searchables.find((s) => s.description === term)
			if (searchable) {
				const sameTypeTerms = searchables
					.filter(({ type }) => type === searchable.type)
					.map((s) => s.description)
				if (specialTerms.includes(searchable.type)) {
					const termType = searchable.type
					_search[termType] = term
				} else {
					_search.terms = _search.terms.filter((term) => !sameTypeTerms.includes(term))
					_search.terms.push(term)
				}
				specialTerms.forEach((type) => {
					delete _search[type]
				})
			} else {
				const [termType, termValue] = term.split(':')
				if (isValidSearchTerm(termType)) {
					if (specialTerms.includes(termType)) {
						specialTerms.forEach((type) => {
							if (_search[type] && termType !== _search[type]) delete _search[type]
						})
						_search.type = termType
						_search[termType] = termValue
						_search['mewtation'] && delete _search['mewtation']
						_search['terms'] && delete _search['terms']
					} else {
						if (searchTermWhitelist.includes(termType)) {
							_search[termType] = termValue
						}
					}
				}
			}
		})
		addSearch(_search)
	}

	const handleSearchClear = () => {
		const _search = {}
		_search.include = search.include
		_search.orderBy = search.orderBy
		_search.orderDirection = search.orderDirection
		_search.virgin = search.virginx
		_search.page = 1
		if (account.wallet && search.account === account.wallet) {
			_search.account = search.account
		}
		addSearch(_search)
	}

	const addSearch = (_search) => {
		_search.page = 1
		const url = makeUrl(_search, searchables)
		navigate(`${location.pathname}?${url}`)
	}

	useEffect(() => {
		fetchData()
	}, [search, pureBred])

    const fetchData = async () => {
        try {
          if (!!search) {
            setResults(undefined)
            setTotal(undefined)
              
            const query = `${API}/cryptokitties/nfts?${makeApiUrl(search, profile, pureBred)}`
            const { data: { kitties, total } } = await axios.get(query)
    
            const ids = kitties.map(({ tokenId }) => tokenId).join(',')
            const ckResult = await axios.get(`https://api.cryptokitties.co/v3/kitties?search=id:${ids}&limit=20`)
            const { data: { kitties: ckData } } = ckResult
    
            const _kitties = kitties.map(kitty => ({
                ...ckData.find(ck => Number(ck.id) === Number(kitty.tokenId)),
                ...kitty,
            }))
            setResults(_kitties)
            setTotal(total)
          }
        } catch (error) {
            console.error(error)
        }
    }

	useEffect(() => {
		const _params = new URLSearchParams(location.search)
		const _search = prepSearchObject(_params)
		const url = makeUrl(_search, searchables)
		assessUrl(url, _search)
	}, [location.search, prepSearchObject, assessUrl, searchables])

	useEffect(() => {
		modal
			? document.body.style.overflow = 'hidden'
			: document.body.style.overflow = 'auto'
		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [modal])

	return (
		<>
			{modal && (
				<KittyModal onClose={() => setModal(false)} {...{ handlePurchase }} {...modal } currentKittyId={undefined} />
			)}
			<Styled.Div>
                <h2>Find your purrfect CryptoKitty....</h2>
				{search && (
					<Styled.Row>
						<SearchBar
							searchQuery={formatSearchInputDisplay(search)}
							suggestions={searchables}
							onSearchSuggestionSelect={({ description }) => addTerm(description)}
							onSearchSubmit={handleSearchSubmit}
							onSearchClear={handleSearchClear}
							disabled={!search}
							{...{ location }}
						/>
					</Styled.Row>
				)}

				<Styled.Row4>
					<Styled.IncludeGroupAndTotals>
						<div>
							{search && (
								<>
									<Checkbox
										id={`checkbox-sale`}
										label={'sale'}
										disabled={!results || (!search.include.sire && !search.include.other)}
										labelPosition={'left'}
										checked={search.include.sale ? true : false}
										onChange={(isChecked) => changeInclude('sale', isChecked)}
									/>
									<Checkbox
										id={`checkbox-sire`}
										label={'sire'}
										disabled={!results}
										labelPosition={'left'}
										checked={search.include['sire'] ? true : false}
										onChange={(isChecked) => changeInclude('sire', isChecked)}
									/>
									<Checkbox
										id={`checkbox-other`}
										label={'other'}
										disabled={!results}
										labelPosition={'left'}
										checked={search.include['other'] ? true : false}
										onChange={(isChecked) => changeInclude('other', isChecked)}
									/>
								</>
							)}
						</div>
						<div>
							<Checkbox
								id={`virgin`}
								label={'virgin'}
								disabled={!results}
								labelPosition={'left'}
								checked={search?.virgin ? true : false}
								onChange={(isChecked) => addSearch({ ...search, virgin: isChecked })}
							/>
                            <Checkbox
                                id={'hats'}
                                label={'hats'}
                                disabled={!results}
                                labelPosition={'left'}
                                checked={search?.hats ? true : false}
                                onChange={isChecked => addSearch({ ...search, hats: isChecked })}
                            />
						</div>
						{account.wallet && !profile && (
							<div>
								<Checkbox
									id={`your-kitties`}
									label={'your kitties'}
									disabled={!results}
									labelPosition={'left'}
									checked={search?.account === account.wallet}
									onChange={(isChecked) => {
										const _search = { ...search }
										if (isChecked) {
											addSearch({
												..._search,
												account: account.wallet,
												include: { sale: true, sire: true, other: true },
												orderBy: 'age',
											})
										} else {
											delete _search.account
											addSearch({..._search })
										}
									}}
								/>
							</div>
						)}
						<div>
							{'Total'}: {total ? <b>{total.toLocaleString()}</b> : '...'}
						</div>
					</Styled.IncludeGroupAndTotals>

					{search && (
						<Styled.SelectionGroup display={'default'}>
							<div>
								<span>{'sortBy'}</span>
								<Select
									options={[
										{ value: 'current_price', name: 'price' },
										{ value: 'age', name: 'age' },
									]}
									selected={search.orderBy}
									onSelectChange={changeOrderBy}
								/>
							</div>
							<div>
								<span>{'orderBy'}</span>
								<Select
									options={[
										{ value: 'asc', name: 'ascending' },
										{ value: 'desc', name: 'descending' }
									]} 
									selected={search.orderDirection}
									onSelectChange={changeDirection}
								/>
							</div>
						</Styled.SelectionGroup>
					)}
				</Styled.Row4>
				<Styled.TagContainer>
					{search &&
						formatTags(search).map((s, i) => (
							<Tag
								key={i}
								tag={`${s}:${search[s]}`}
								onRemove={(tag) => (s === 'terms' ? removeTerm(tag, s) : removeTerm(search[s], s))}
                                onSetPureBred={tag => {
                                    setPureBred(prevState => prevState.includes(tag)
                                        ? prevState.filter(item => item !== tag)
                                        : [...prevState, tag]
                                    )
                                }}
								{...{ pureBred, searchables }}
							/>
						))}
				</Styled.TagContainer>
				<Styled.Grid>
					{!!results &&
						results.map((kitty, i) => 
                            <Kitty key={i} 
                                {...{ kitty, handlePurchase }}
                                getInfo={() => setModal({ kitty })}
                                showInfo={false}
                                showMewts={true}
                                showName
                                bgColor={kitty.color}
                                c2aPosition={'top'}
                                showPrice={true}
                            />
						)}
				</Styled.Grid>
				{search && results && (
					<Pagination
						showPages={true}
						currentPage={search.page}
						totalPages={Math.ceil(total / LIMIT)}
						maxPages={10}
						onChange={(page) => changePage(page)}
					/>
				)}
			</Styled.Div>
		</>
	)
}

export default Search
