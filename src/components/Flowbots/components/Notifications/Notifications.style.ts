import styled from 'styled-components';

export const Div = styled.div`
    position: fixed;
    bottom: 18px;
    left: 24px;
    z-index: 10000;
    width: 360px;
`

export const Toast = styled.div`
    width: calc(100% - 48px);
    background-color: #FFF;
    border-radius: 4px;
    z-index: 10000;
    max-width: 320px;
    box-shadow: 10px 10px 30px rgba(77,173,212,0.1);
    padding: 24px;
    display: flex;
    opacity: 1;
    position: relative;
    margin-top: 8px;
    

    &:after {
        content: "";
        position: absolute;
        top: 5px;
        bottom: 5px;
        left: 5px;
        right: 5px;
        border: 2.5px dotted rgba(77,173,212,1);
        border-radius: 4px;
        pointer-events: none;
    }

    > img {
        width: 36px;
        height: 36px;
        margin-right: 16px;
        border-radius: 4px;
    }

    > p {
        font-weight: bold;
        font-size: 12px;
        line-height: 18px;
        > span {
            display: block;
            line-height: 18px;
            > a {
                border-bottom: 2px dotted transparent;
                color: #666;
                &:hover {
                    border-bottom: 2px dotted #666;
                }
            }
        }
    }
`;