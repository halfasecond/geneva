import styled from 'styled-components'

const jewelIcon = (type: string) => {
    switch (type) {
        case 'diamond':
            return '/kittyFamily/icons/diamond.svg'
        case 'gilded':
            return '/kittyFamily/icons/gilded.svg'
        case 'amethyst':
            return '/kittyFamily/icons/amethyst.svg'
        case 'lapis':
            return '/kittyFamily/icons/lapis.svg'
        default:
            return 'none'
    }
}

export const Div = styled.div`
    display: flex;
    justify-content: center;
    min-height: 20px;
`

export const Jewel = styled.div.withConfig({
    shouldForwardProp: (prop) => !['$type', '$trait', '$displayType'].includes(prop),
})<{ $type: string; $trait?: string; $displayType?: string }>`
    position: relative;
    cursor: ${({ $type }) => ($type === 'none' ? 'default' : 'pointer')};

    &:before {
        content: '';
        display: block;
        padding-top: 100%;
    }

    background-image: ${({ $type }) => `url('${jewelIcon($type)}')`};
    background-size: 100% auto;
    background-repeat: no-repeat;

    &:after {
        content: '${({ $trait }) => ($trait ?? '').replace(/'/g, "\\'")}';
        opacity: 0;
        position: absolute;
        left: -50%;
        top: ${({ $displayType }) => ($displayType === 'mewtations' ? '-20px' : '20px')};
        font-size: 12px;
        font-weight: normal;
        background-color: #fff;
        padding: 2px 6px;
        z-index: 100;
        border-radius: 4px;
    }

    &:hover {
        &:after {
            opacity: ${({ $type }) => ($type === 'none' ? 0 : 1)};
        }
    }
`