// @ts-nocheck
import styled from 'styled-components'
import { breaks, fontSize, grey, gutters } from 'kittyFamily/style/config'
import * as Styled from 'kittyFamily/style'

export const Div = styled.div`
	padding-top: ${gutters['xxl']};
	margin: 0 5%;
	display: flex;
	flex-wrap: wrap;
	> pre {
		width: 100%;
		display: block;
	}
	> code,
	> pre > code {
		width: 100%;
		display: block;
		background-color: #eee;
		margin-bottom: 1rem;
		padding: 0.25rem 1rem;
		border-radius: 0.25rem;
		font-size: 1.2rem;
	}
    > h2 {
        text-align: center;
        margin-bottom: ${gutters['sm']};
    }
`

export const Row = styled.div`
	letter-spacing: 0.02rem;
	margin-bottom: ${gutters['md']};
	width: 100%;
	font-size: ${fontSize['md']};
`

export const Row4 = styled(Row)`
    margin-bottom: ${gutters['sm']};
	@media (min-width: ${breaks['lg']}) {
		display: flex;
		justify-content: space-between;
	}
`

export const IncludeGroupAndTotals = styled.div`
	display: flex;
    width: 100%;
	> div {
		align-items: center;
		margin-right: ${gutters['sm']};
		> div {
			margin-left: ${gutters['sm']};
			&:first-of-type {
				margin-left: 0;
			}
		}
		> b {
			display: inline-block;
			margin-left: ${gutters['xxs']};
			font-weight: 500;
		}
		&:last-of-type {
			margin-left: ${gutters['lg']};
			color: ${grey[600]};
			> b {
				color: ${grey[700]};
			}
		}
        display: none;
        &:first-of-type {
            display: flex;
        }
        @media (min-width: ${breaks['xl']}) {
            display: flex;
        }  
	}

`

export const TagContainer = styled(Row)`
	display: flex;
	justify-content: flex-start;
	> p {
		margin-right: ${gutters['xs']};
	}
`

export const Grid = styled(Styled.Grid)`
`

export const SelectionGroup = styled.div`
	display: flex;
	width: 100%;
	text-align: left;

	@media (min-width: ${breaks['md']}) {
		border: none;
	}

	@media (min-width: ${breaks['xl']}) {
		max-width: 300px;
	}

	> div {
		display: flex;
		align-items: center;
		padding: ${gutters['xs']} ${gutters['sm']};

		&:last-child {
			border-radius: 0 0 ${gutters['xxs']} 0;
		}
		width: 50%;
		margin-top: ${gutters['sm']};
		padding: ${gutters['sm']} ${gutters['sm']};
		border: solid 0.1rem ${grey[200]};
		align-items: center;
        justify-content: center;
		border-radius: ${gutters['xxs']};

		&:first-child {
			border-radius: ${gutters['xxs']};
			@media (min-width: ${breaks['md']}) {
				border-right: none;
			}
		}

		@media (min-width: ${breaks['xl']}) {
			border: none;
			flex-direction: column;
			align-items: flex-start !important;
			padding: 0;
			margin-top: 0;
			&:first-of-type {
				margin-right: ${gutters['md']};
			}
		}

		> span {
			color: ${grey[700]};
			font-size: ${fontSize['xs']};
			display: inline-block;
			min-width: 68px;
            
		}
	}
`
