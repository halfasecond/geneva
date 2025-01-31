import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { Paddock } from './Paddock'

describe('Paddock', () => {
  it('renders without crashing', () => {
    const { container } = render(<Paddock />)
    expect(container).toBeTruthy()
  })

  it('renders horse image', () => {
    const { getByAltText } = render(<Paddock />)
    const horseImage = getByAltText('Horse')
    expect(horseImage).toBeInTheDocument()
  })

  it('handles zoom events', () => {
    const { container } = render(<Paddock />)
    const gameSpace = container.querySelector('.sc-*') // styled-components class

    // Zoom in
    fireEvent.wheel(gameSpace!, { deltaY: -100 })
    
    // Zoom out
    fireEvent.wheel(gameSpace!, { deltaY: 100 })
  })

  it('handles keyboard movement', () => {
    render(<Paddock />)
    
    // Move right
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    fireEvent.keyUp(document, { key: 'ArrowRight' })
    
    // Move down
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    fireEvent.keyUp(document, { key: 'ArrowDown' })
  })
})
