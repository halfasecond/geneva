// @ts-nocheck
export const LIMIT = 20

export const isNumber = (number) => {
	return /^-?[\d.]+(?:e-?\d+)?$/.test(number)
}

/* https://regex101.com/r/jzHmOf/1 */
export const isWithinRange = (range) => {
	const splitRange = range.split('-')
	return (
		splitRange.length === 2 &&
		/^([0-9][0-9]{0,7})$/.test(splitRange[0]) &&
		/^([0-9][0-9]{0,7})$/.test(splitRange[1])
	)
}

export const includeTermWhitelist = ['sale', 'sire', 'other']

export const searchTermWhitelist = [
	'id',
	'cooldown',
	'fancy',
	'variant',
	'variation',
	'exclusive',
	'specialedition',
	'special',
	'purrstige',
	'shinyfancy',
	'gen',
	'mewtation',
	'type',
	'virgin',
    'hats',
	'account',
	'hatchedBy',
	'pfrom',
	'pto',
	'preggers',
	'resting',
    'm1',
    'm2',
    'm3',
    'm4'
]

export const orderByWhitelist = ['current_price', 'age', 'generation', 'cooldown']
export const orderDirectionWhitelist = ['asc', 'desc']

export const isValidSearchTerm = (term) => searchTermWhitelist.includes(term)
export const isValidIncludeTerm = (term) => includeTermWhitelist.includes(term)

export const acceptedInputForCooldown = (input) =>
	input === 'fast' ||
	input === 'swift' ||
	input === 'snappy' ||
	input === 'brisk' ||
	input === 'plodding' ||
	input === 'slow' ||
	input === 'sluggish' ||
	input === 'catatonic'

export const acceptedInputForMewtation = (input) =>
	input === 'diamond' || input === 'gilded' || input === 'amethyst' || input === 'lapis'

export const acceptedInputForType = (input) =>
	input === 'normal' ||
	input === 'fancy' ||
	input === 'exclusive' ||
	input === 'specialedition' ||
	input === 'shinyfancy' ||
	input === 'purrstige'

const concatenateWithAmpersand = (strings) => strings.filter(Boolean).join('&')

export const makeUrl = (_search, searchables) => {
	let include = ``
	let orderAndPages = ``
	let searchStrings = []
	Object.keys(_search).forEach((term) => {
		if (term === 'include') {
			const includes = []
			if (Object.keys(_search.include).length) {
				Object.keys(_search.include).forEach((s) => {
					if (_search.include[s]) {
						includes.push(s)
					}
				})
				if (includes.length) {
					include = `include=${includes.join(',')}`
				}
			}
		} else {
			if (['orderBy', 'orderDirection', 'page'].includes(term)) {
				if (![1, 'asc', 'current_price'].includes(_search[term])) {
					orderAndPages = `${orderAndPages}${orderAndPages.length > 0 ? '&' : ''}${term}=${
						_search[term]
					}`
				}
			} else {
				if (term === 'terms') {
					const cleanTerms = _search[term].map(
						(t) => searchables.find(({ description }) => description === t).description
					)
					if (cleanTerms.length) {
						searchStrings.push(cleanTerms.join('+'))
					}
				} else {
                    console.log('in here?')
					searchStrings.push(`${term}:${_search[term]}`)
				}
			}
		}
	})
	let searchString = searchStrings.length ? `search=${searchStrings.join('+')}` : ''
	return concatenateWithAmpersand([include, searchString, orderAndPages])
}

export const makeApiUrl = (searchObject, profile, pureBred) => {
	const includes = Object.keys(searchObject.include).filter((key) => searchObject.include[key])

	const searches = Object.keys(searchObject).reduce((acc, s) => {
		const ignoredTerms = ['account', 'include', 'orderDirection', 'orderBy', 'page']
		if (!ignoredTerms.includes(s)) {
			// account is added via &owner_wallet_address=
			const value = Array.isArray(searchObject[s]) ? searchObject[s].join(',') : searchObject[s]
			acc.push(`${s}:${value}`)
		}
		return acc
	}, [])

	if (searchObject.terms) {
		searchObject.terms.forEach((term) => {
            if (pureBred.includes(term)) {
                searches.push(`pb-${term}`)
            } else {
                searches.push(`${term}`)
            }
		})
	}

	const stringParts = []
	stringParts.push(`include=${includes.join(',')}`)
	stringParts.push(searches.length > 0 ? `search=${searches.join('+')}` : '')
	stringParts.push(`orderBy=${searchObject.orderBy}`)
	stringParts.push(`orderDirection=${searchObject.orderDirection}`)
	stringParts.push(`page=${searchObject.page}`)
	stringParts.push(`limit=${LIMIT}`)
	if (searchObject.account) {
		stringParts.push(`owner_wallet_address=${searchObject.account}`)
	}
	if (profile) {
		stringParts.push(`owner_wallet_address=${profile}`)
	}
	return concatenateWithAmpersand(stringParts)
}

export const makeCSApiUrl = (searchObject) => {
	const includes = Object.keys(searchObject.include).filter((key) => searchObject.include[key])

	const searches = Object.keys(searchObject).reduce((acc, s) => {
		const ignoredTerms = ['account', 'include', 'orderDirection', 'orderBy', 'page']
		if (!ignoredTerms.includes(s)) {
			// account is added via &owner_wallet_address=
			const value = Array.isArray(searchObject[s]) ? searchObject[s].join(',') : searchObject[s]
			acc.push(`${s}:${value}`)
		}
		return acc
	}, [])

	if (searchObject.terms) {
		searchObject.terms.forEach((term) => {
			searches.push(term)
		})
	}

	const stringParts = []
	stringParts.push(`include=${includes.join(',')}`)
	stringParts.push(searches.length > 0 ? `search=${searches.join('+')}` : '')
	stringParts.push(`orderBy=${searchObject.orderBy}`)
	stringParts.push(`orderDirection=${searchObject.orderDirection}`)
	stringParts.push(`page=${searchObject.page}`)
	stringParts.push(`limit=${LIMIT}`)
	if (searchObject.account) {
		stringParts.push(`owner_wallet_address=${searchObject.account}`)
	}

	return concatenateWithAmpersand(stringParts)
}

export const parseSearchTerm = (searchTermType, searchTerm, _search) => {
    if (isNumber(searchTerm) || isWithinRange(searchTerm)) {
      _search[searchTermType] = searchTerm;
    } else if (searchTerm.split(',').length > 0) {
      const items = [];
      searchTerm.split(',').forEach((_term) => {
        if (
          isNumber(_term) ||
          (acceptedInputForCooldown(_term) && searchTermType === 'cooldown') ||
          (acceptedInputForMewtation(_term) && searchTermType === 'mewtation')
        ) {
          items.push(_term);
        }
      });
      _search[searchTermType] = items;
    }
};

export const getPage = (_params) => {
	let page = _params.get('page');
	return page && isNumber(page) ? Number(page) : 1;
  };

export const getInclude = (_params, showAll) => {
	let string = _params.get('include');
	const include = {};
	if (!string)
	  return {
		sale: true,
		sire: showAll,
		other: showAll,
	  };
	const _string = string.split(',');
	_string.forEach((s) => {
	  if (isValidIncludeTerm(s)) {
		include[s] = true;
	  }
	});
	includeTermWhitelist.forEach((s) => {
	  if (!include[s]) {
		include[s] = false;
	  }
	});
	return include;
};