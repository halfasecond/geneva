// @ts-nocheck
import styled from 'styled-components'
import { fontSize, grey, gutters } from 'kittyFamily/style/config'

export const Span = styled.span`
	display: flex;
	align-items: center;
	justify-content: flex-start;
	position: absolute;
	padding: 2px 8px;
	z-index: 1;
	background-color: rgba(255, 255, 255, 0.5);
	border-radius: 10px;
	text-align: center;
	&&& {
		font-weight: 700;
	}
	&&& > span {
		font-weight: 700;
	}
	font-size: ${fontSize['md']};
	cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
	border: 1px solid ${grey[200]};
	opacity: 0.8;
	&:hover {
		opacity: ${({ disabled }) => (disabled ? 0.8 : 1)};
	}
	> img, svg {
		width: 22px;
		height: 22px;
		margin-right: ${gutters['xs']};
	}
	> svg {
		margin-left: ${gutters['sm']};
	}
	> span {
		margin-right: 2px;
		font-size: ${fontSize['sm']};
	}
`
