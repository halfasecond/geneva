// @ts-nocheck
import styled from 'styled-components'
import { colors, fontSize, grey, gutters } from 'kittyFamily/style/config'

export const Div = styled.div`
	position: relative;
	display: flex;
	flex-grow: 1;
	width: 100%;

	> div {
		&:first-of-type {
			position: relative;
			z-index: 2;
			width: 100%;
			display: flex;
			align-items: center;
			padding: ${gutters['sm']} ${gutters['md']};
			border-radius: 5px;
			border: solid 0.2rem ${({ $isFocussed }) => ($isFocussed ? colors.bubblegum : grey[300])};
			> svg {
				flex: 0 0 1.6rem;
				margin-right: ${gutters['md']};
			}
			> input {
				flex: 1;
				width: auto;
				min-width: 0;
				line-height: 1;
				border: none;
				font-size: ${fontSize['sm']};
				font-weight: bold;
				color: ${grey[700]};
				letter-spacing: 0.02rem;
				&:focus {
					outline: none;
				}
			}
			> div {
				display: flex;
				margin-left: ${gutters['sm']};
				margin-right: 0;
				> button {
					font-size: ${fontSize['xs']};
					font-weight: 500;
					color: ${grey[400]};
					white-space: nowrap;
					transition: opacity 0.2s;
					border: transparent;
					background: transparent;
					cursor: pointer;
					&:hover {
						color: ${colors.bubblegum};
					}
				}
			}
		}

		&:nth-of-type(2) {
			position: absolute;
			top: 5.2rem;
			left: 5%;
			z-index: 10;
		}
	}
`

export const Suggestions = styled.div`
	box-shadow: 0 0.2rem 0 ${grey[300]};
	border: 0.2rem solid ${grey[300]};
	border-radius: 0.4rem;
	background-color: ${grey[0]};
	font-size: ${fontSize['md']};
	font-weight: 500;

	.-item {
		display: block;
		position: relative;
		margin: ${gutters['xs']};
		padding: ${gutters['xs']} ${gutters['sm']};
		border-radius: 0.4rem;
		text-transform: lowercase;
		cursor: pointer;
		transition: background-color 0.2s;

		&:hover {
			background-color: ${grey[100]};
		}
		&--highlighted {
			background-color: ${grey[100]};
		}

		&--highlighted.-item--viewAll {
			color: ${grey[900]};
		}

		&-description {
			color: ${grey[900]};
		}
		&-type {
			line-height: 1;
			color: ${grey[500]};
		}
		&-line {
			border-top: 0.2rem solid ${grey[300]};
		}

		+ .-item--viewAll {
			margin-top: ${gutters['xs']};
			padding-top: ${gutters['sm']};
		}

		&--viewAll {
			position: relative;
			padding-right: ${gutters['sm']};
			padding-left: ${gutters['sm']};
			color: ${grey[500]};
		}
	}
`
