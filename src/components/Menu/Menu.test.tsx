import { expect, test } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Menu from './Menu'

const links = ['transactions', 'cryptokitties', 'erc-721', 'authorizations']

test('renders Menu component with links', () => {
    const { getByText } = render(
        <MemoryRouter>
            <Menu links={links} />
        </MemoryRouter>
    )

    links.forEach(link => {
        expect(getByText(link)).toBeTruthy()
    })
})

test('links have correct hrefs', () => {
    const { container } = render(
        <MemoryRouter>
            <Menu links={links} />
        </MemoryRouter>
    )

    links.forEach(link => {
        const anchor = container.querySelector(`a[href="/${link}"]`)
        expect(anchor).toBeTruthy()
    })
})