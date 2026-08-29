// @ts-nocheck
import React, { useState } from 'react'
// import { IconCheck, IconCheckEmpty } from 'kittyFamily/components/Icons'
import { colors, grey } from 'kittyFamily/style/config'
import * as Styled from './Checkbox.style'

const Checkbox = ({ id, label, disabled, labelPosition, checked, onChange }) => {
	const [isHovered, setIsHovered] = useState(false)

	const handleChange = (e) => {
		if (disabled) return
		const { checked } = e.target
		onChange(checked)
	}

	const handleMouseEnter = () => {
		if (disabled) return
		setIsHovered(true)
	}

	const handleMouseLeave = () => {
		if (disabled) return
		setIsHovered(false)
	}


	
	return (
		<Styled.Div
			role='checkbox'
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			aria-checked={checked}
		>
			<Styled.Input type='checkbox' onChange={handleChange} {...{ checked, disabled, id }} />
			<Styled.Label htmlFor={id} {...{ checked, disabled }}>
				<span>{label}</span>
				{/* {checked ? (
					<IconCheck color={colors['bubblegum']} />
				) : (
					<IconCheckEmpty color={isHovered ? grey[700] : grey[400]} />
				)} */}
			</Styled.Label>
		</Styled.Div>
	)
}

export default Checkbox
