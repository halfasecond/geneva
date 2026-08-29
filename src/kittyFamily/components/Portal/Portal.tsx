// @ts-nocheck
import { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'

const Portal = ({ container, children }) => {
	const containerRef = useRef(null)

	useEffect(() => {
		containerRef.current = document.querySelector(container)
	}, [container])

	return ReactDOM.createPortal(children, document.body)
}

export default Portal
