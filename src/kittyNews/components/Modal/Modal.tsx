import React, { useEffect, useRef } from 'react'
import * as Styled from './Modal.style'

interface Props {
    onClose: () => void
    children: React.ReactNode
    className: string | undefined
}

const Modal: React.FC<Props> = ({ onClose, children, className }) => {
    const modalRef = useRef<HTMLDivElement | null>(null)

    const handleOverlayClick = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            onClose()
        }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose()
        }
    }

    const handleScrollBar = (visible: boolean) => {
        if (visible) {
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
            document.body.style.overflow = 'hidden'
            document.body.style.paddingRight = `${scrollBarWidth}px`
        } else {
            document.body.style.overflow = 'auto'
            document.body.style.paddingRight = '0px'
        }
    }

    useEffect(() => {
        const handleDocumentClick = (event: MouseEvent) => {
            handleOverlayClick(event)
        }

        document.addEventListener('mousedown', handleDocumentClick)
        document.addEventListener('keydown', handleKeyDown)
        handleScrollBar(true)

        return () => {
            document.removeEventListener('mousedown', handleDocumentClick)
            document.removeEventListener('keydown', handleKeyDown)
            handleScrollBar(false)
        }
    }, [onClose])

    return (
        <Styled.Div>
            <div ref={modalRef} {...{ className }}>
                <Styled.Span onClick={onClose} role={'button'}>X</Styled.Span>
                {children}
            </div>
        </Styled.Div>
    )
}

export default Modal
