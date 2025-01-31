import { expect, test, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import Docs from './Docs'

beforeEach(() => {
    vi.clearAllMocks()
})

test('renders Docs component', async () => {
    const { getByText } = render(<Docs />)
    const titleElement = getByText(/How to use this app/i)
    expect(titleElement).toBeTruthy()
})

