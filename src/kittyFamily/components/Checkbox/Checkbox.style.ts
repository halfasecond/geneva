// @ts-nocheck
import styled, { css } from 'styled-components'
import { breaks, grey, gutters } from 'kittyFamily/style/config'

export const Div = styled.div`
	user-select: none;
	cursor: pointer;
	display: flex;
`

export const Label = styled.label`
	display: inline-flex;
	align-items: center;
	color: ${grey[500]};
	font-weight: 500;
	cursor: pointer;
	> svg {
		margin: 0 ${gutters['xxs']};
		@media screen and (min-width: ${breaks['sm']}) {
			margin: 0 ${gutters['xs']};
		}
	}

	${(props) =>
		props.checked &&
		css`
			color: ${grey[900]};

			@media screen and (min-width: ${breaks['md']}) {
				color: ${grey[900]};
			}
		`};

	/* Using focus instead of hover for better mobile experience */
	${(props) =>
		(props.checked || !props.disabled) &&
		css`
			&:focus {
				color: ${grey[900]};
			}
		`};

	${(props) =>
		props.disabled &&
		css`
			cursor: not-allowed;
		`}
`

export const Input = styled.input`
		margin-right: ${gutters['xs']};
`
