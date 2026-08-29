// @ts-nocheck
import styled from 'styled-components'
import { breaks, colors, fontSize, grey, gutters } from 'kittyFamily/style/config'

export const Div = styled.section`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
	padding-bottom: ${gutters['xxl']};
	width: 100%;
	@media (min-width: ${breaks['md']}) {
		flex-direction: row;
	}

	.-page,
	.-button {
		border-radius: 0.3rem;
		font-weight: 500;
		cursor: pointer;
		outline: none;
		background: transparent;
		border: 0;
	}

	.-button {
		padding-top: ${gutters['xs']};
		padding-bottom: ${gutters['xs']};
		font-size: ${fontSize['md']};
		color: ${grey[1000]};
		background: none;
		border: 0;
		transition: color 0.25s;

		@media (min-width: ${breaks['md']}) {
			padding-left: ${gutters['md']};
			padding-right: 0;
		}

		&:hover {
			color: ${colors.secondary};
		}

		&--disabled {
			color: ${grey[400]};
			pointer-events: none;
		}
		&:first-child {
			padding-left: 0;
		}
	}

	.-page {
		margin-right: ${gutters['xxs']};
		padding: ${gutters['xs']} ${gutters['xs']};
		font-size: ${fontSize['sm']};
		font-weight: 500;
		color: ${grey[900]};
		transition: background-color 0.25s;

		@media (min-width: ${breaks['sm']}) {
			margin-right: ${gutters['xs']};
			padding: ${gutters['xs']} ${gutters['sm']};
		}

		&:hover {
			background-color: ${grey[200]};
		}

		&--active,
		&--active:hover {
			background-color: ${colors.secondary};
			color: ${grey[0]};
		}
	}
`
