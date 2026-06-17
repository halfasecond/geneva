import { type ReactNode } from 'react'

interface TreeConnectorProps {
    width: string
    visible?: boolean
}

const TreeConnector = ({ width, visible = true }: TreeConnectorProps) => (
    <div
        className={`kf-tree-connector ${visible ? '' : 'kf-tree-connector-hidden'}`}
        style={{ width }}
        aria-hidden
    />
)

interface TreeConnectorRowProps {
    children: ReactNode
    variant?: 'single' | 'split' | 'quad'
}

export const TreeConnectorRow = ({ children, variant = 'single' }: TreeConnectorRowProps) => (
    <div className={`kf-tree-connector-row kf-tree-connector-row--${variant}`}>{children}</div>
)

export default TreeConnector