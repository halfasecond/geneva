// @ts-nocheck
import React, { Component } from 'react'
// import { IconCaret } from 'kittyFamily/components/Icons'
import { grey } from 'kittyFamily/style/config'
import * as Styled from './Select.style'

class Select extends Component {
	constructor(props) {
		super(props)
		this.state = {
			caretColor: grey[400]
		}
	}

	onSelectChange = (e) => {
		this.props.onSelectChange(e.target.value)
	}

	onMouseOver = () => {
		this.setState({ caretColor: grey[900] })
	}

	onMouseOut = () => {
		this.setState({ caretColor: grey[400] })
	}

	render() {
		const { placeholder, options, selected /* , t */ } = this.props
		return (
			<Styled.Div role='menu' onMouseOver={this.onMouseOver} onMouseOut={this.onMouseOut}>
				<select placeholder={placeholder} value={selected} onChange={this.onSelectChange}>
					{options.map((option, i) => (
						<option key={i} value={option.value}>
							{/* t(option.name) */ option.name}
						</option>
					))}
				</select>
				{/* <IconCaret color={this.state.caretColor} /> */}
			</Styled.Div>
		)
	}
}

// Select.propTypes = {
//   placeholder: PropTypes.string,
//   options: PropTypes.array,
//   selected: PropTypes.string,
//   onSelectChange: PropTypes.func,
//   t: PropTypes.func.isRequired,
// };

// Select.defaultProps = {
//   placeholder: '',
//   options: [],
//   selected: '',
//   onSelectChange: noop,
// };

export default Select
