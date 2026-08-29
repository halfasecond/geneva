// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { NavLink, /* Navigate, */ useLocation} from 'react-router-dom'
import iconSearchSrc from 'kittyFamily/svg/search.svg'
import { grey } from 'kittyFamily/style/config'
import * as Styled from './SearchBar.style'

const SEARCH_BAR = {
	INPUT: -1,
	VIEW_ALL: 1000
}

const ENTER = 'Enter'
const ESCAPE = 'Escape'
const ARROW_DOWN = 'ArrowDown'
const ARROW_UP = 'ArrowUp'

const SearchBar = ({
	searchQuery: _searchQuery,
	suggestions,
	disabled,
	onSearchSuggestionSelect,
	onSearchSubmit,
	onSearchClear
}) => {
	const location = useLocation()
	const [isFocussed, setIsFocussed] = useState(false)
	const [searchQuery, setSearchQuery] = useState(_searchQuery ? _searchQuery + ' ' : '')
	const [focusedArea, setFocusedArea] = useState(SEARCH_BAR.INPUT)
	const [suggestionsVisible, setSuggestionsVisible] = useState(false)
	const [redirect, setRedirect] = useState(false)
	const inputRef = useRef(null)
	const searchBarRef = useRef(null)

	const handleFocusedArea = (direction) => {
		setFocusedArea((prevFocus) => {
			let area = prevFocus + direction
			if (area < 0) {
				area = -1
			}
			const isFooterFocused = area > suggestions.length - 1
			const isMovingUp = direction < 0
			const isMovingDown = direction > 0
			if (isMovingUp && isFooterFocused) {
				area = suggestions.length - 1
			}
			if (isMovingDown && isFooterFocused) {
				area = SEARCH_BAR.VIEW_ALL
			}
			return area
		})
	}

	const onSubmit = () => {
		onBlur()
		setSuggestionsVisible(false)
		if (onSearchSubmit) {
			onSearchSubmit(searchQuery)
		}
	}

	const onClear = () => {
		onSearchClear()
		onBlur()
	}

	const onBlur = useCallback((_isFocussed = false) => {
		setIsFocussed(_isFocussed)
		setSuggestionsVisible(false)
		inputRef.current && inputRef.current.blur()
	}, [])

	const onFocus = () => setIsFocussed(true)

	useEffect(() => {
		const handleClickOutside = (e) => {
			searchBarRef.current && !searchBarRef.current.contains(e.target) && onBlur()
		}

		window.addEventListener('mousedown', handleClickOutside)
		return () => {
			window.removeEventListener('mousedown', handleClickOutside)
		}
	}, [onBlur])

	useEffect(() => {
		setSearchQuery(_searchQuery ? _searchQuery + ' ' : '')
		setSuggestionsVisible(false)
	}, [_searchQuery, location])

	const onChange = (e) => {
		const searchQuery = e.target.value
		setSearchQuery(searchQuery)
		handleSuggestions(!!searchQuery)
	}

	const onKeyDown = (e) => {
		setSuggestionsVisible(true)
		if (e.key === ENTER) {
			if (focusedArea === SEARCH_BAR.INPUT) {
				onSubmit(true)
			} else if (focusedArea === SEARCH_BAR.VIEW_ALL) {
				setRedirect(true)
			} else {
				const _suggestions = generateSuggestions()
				onSearchSuggestionSelect(_suggestions[focusedArea])
			}
		} else if (e.key === ESCAPE) {
			onBlur()
		} else if (e.key === ARROW_DOWN) {
			e.preventDefault()
			handleFocusedArea(1)
		} else if (e.key === ARROW_UP) {
			e.preventDefault()
			handleFocusedArea(-1)
		}
	}

	const handleSuggestions = (isUserTyping) => {
		setIsFocussed(true)
		setSuggestionsVisible(!!isUserTyping)
	}

	const generateSuggestions = () => {
		const chunks = searchQuery.split(' ')
		const chunk = chunks.length ? chunks[chunks.length - 1] : false

		return suggestions
			.filter(
				(c) =>
					chunk && chunk.length > 0 && c.description.toLowerCase().includes(chunk.toLowerCase())
			)
			.slice(0, 8)
	}

	const footerLinkParams = {
		pathname: '/cattributes',
		state: { referrer: location.pathname }
	}

	if (redirect) {
		console.log('todo!')// return <Navigate push to={footerLinkParams} />
	}

	return (
		<Styled.Div ref={searchBarRef} $isFocussed={isFocussed}>
			<div>
				<img src={iconSearchSrc} alt="" color={isFocussed ? grey[900] : grey[400]} />
				<input
					ref={inputRef}
					type='text'
					value={searchQuery}
					placeholder={'search'}
					autoComplete='off'
					autoCorrect='off'
					autoCapitalize='off'
					spellCheck='false'
					{...{ onChange, onKeyDown, onFocus, disabled }}
				/>
				{searchQuery.length > 0 && (
					<div>
						<button type='button' onClick={onSubmit}>
							submit
						</button>
						<button type='button' onClick={onClear}>
							cancel
						</button>
					</div>
				)}
			</div>
			{suggestionsVisible && generateSuggestions().length > 0 && (
				<Styled.Suggestions>
					{generateSuggestions().map((suggestion, i) => (
						<div
							key={i}
							role='button'
							onClick={() => onSearchSuggestionSelect(suggestion)}
							className={focusedArea === i ? '-item -item--highlighted' : '-item'}
						>
							<div className='-item-description'>{suggestion.description} - {suggestion.total}</div>
							<div className='-item-type'>
								{suggestion.type}
							</div>
						</div>
					))}
					{!!suggestions.length && <div className='-line' />}
					<NavLink
						to={footerLinkParams}
						className={
							focusedArea === SEARCH_BAR.VIEW_ALL
								? '-item -item--viewAll -item--highlighted'
								: '-item -item--viewAll'
						}
					>
						view all
					</NavLink>
				</Styled.Suggestions>
			)}
		</Styled.Div>
	)
}

// SearchBar.propTypes = {
//   searchQuery: PropTypes.string.isRequired,
//   suggestions: PropTypes.array,
//   onSearchChange: PropTypes.func,
//   onSearchSuggestionSelect: PropTypes.func,
//   onSearchSubmit: PropTypes.func,
//   onSearchClear: PropTypes.func,
//   disabled: PropTypes.bool.isRequired,
//   t: PropTypes.func.isRequired,
// };

// SearchBar.defaultProps = {
//   suggestions: [],
//   onSearchChange: noop,
//   onSearchSuggestionSelect: noop,
//   onSearchSubmit: noop,
//   onSearchClear: noop,
// };

export default SearchBar
