// @ts-nocheck
import React from 'react'
import * as Styled from './Pagination.style'

function Pagination({ showPages, currentPage, totalPages, maxPages, onChange }) {
	const max = maxPages > totalPages ? totalPages : maxPages
	let minPage = currentPage - Math.floor((max - 1) / 2)
	let maxPage = currentPage + Math.ceil((max - 1) / 2)

	const validatePage = (page) => Math.min(Math.max(page, 1), totalPages)
	const goToPage = (page) => (e) => onChange(validatePage(page), e)

	if (minPage < 1) {
		maxPage += 1 - minPage
		minPage += 1 - minPage
	}

	if (maxPage > totalPages) {
		minPage -= maxPage - totalPages
		maxPage -= maxPage - totalPages
	}

	const pages = []
	for (let i = minPage; i <= maxPage; i += 1) {
		pages.push(i)
	}

	return (
		<Styled.Div>
			{showPages && (
				<div>
					{pages.map((p) => (
						<button
							type='button'
							key={`-page-${p}`}
							className={currentPage === p ? '-page -page--active' : '-page'}
							onClick={goToPage(p)}
						>
							{p}
						</button>
					))}
				</div>
			)}
			<div>
				<button
					type='button'
					className={currentPage === 1 ? '-button -button--disabled' : '-button'}
					onClick={goToPage(currentPage - 1)}
				>
					{'previous'}
				</button>
				<button
					type='button'
					className={currentPage === totalPages ? '-button -button--disabled' : '-button'}
					onClick={goToPage(currentPage + 1)}
				>
					{'next'}
				</button>
			</div>
		</Styled.Div>
	)
}

// Pagination.propTypes = {
//   className: PropTypes.string,
//   currentPage: PropTypes.number,
//   totalPages: PropTypes.number,
//   maxPages: PropTypes.number,
//   onChange: PropTypes.func.isRequired,
//   showPages: PropTypes.bool,
//   t: PropTypes.func.isRequired,
// };

// Pagination.defaultProps = {
//   className: undefined,
//   currentPage: 1,
//   totalPages: 1,
//   maxPages: 10,
//   showPages: true,
// };

export default Pagination
