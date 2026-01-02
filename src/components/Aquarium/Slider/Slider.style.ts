import styled from 'styled-components'

export const Label = styled.label`
    display: flex;
    flex-direction: column;
    gap: 4;

    > span {
        font-size: 12px;
        opacity: 0.8;
        display: inline-block;
        margin-bottom: 4px;
        font-weight: bold;
    }
`