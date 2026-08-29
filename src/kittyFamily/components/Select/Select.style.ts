// @ts-nocheck
import styled from 'styled-components'
import { grey, gutters } from 'kittyFamily/style/config'

export const Div = styled.div`
	width: 100%;
	display: inline-block;
	position: relative;
	> select {
		display: block;
		padding: 0 ${gutters['lg']} 0 0;
		width: 100%;
		color: ${grey[700]};
		cursor: pointer;
		
		transition: color 0.2s;
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		border: none;
		outline: none;
		font-weight: bold !important;
        font-family: "source-code-pro", monospace;
	}
	> svg {
		position: absolute;
		top: 10%;
		right: 0;
		display: block;
		pointer-events: none;
	}
`
