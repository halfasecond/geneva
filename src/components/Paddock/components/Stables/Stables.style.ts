import styled from 'styled-components'

export const Div = styled.div`
    > p {
        color: #FFF;
        display: flex;
        margin-bottom: 12px;
        > b {
            font-weight: bold; 
        }
        > span {
            display: inline-block;
            margin-right: 18px;
        }
        > img {
            width: 22px;
            margin-right: 10px;
        }
    }

    > h2 {
        margin: 32px 0 16px;
        color: #FFF; 
    }

    > ul {
        color: #FFF;
        > li {
            font-weight: bold;
            margin: 0 0 8px 2px;
            display: flex;
            justify-content: space-between;
            > span {
                display: flex;
                img {
                    width: 22px;
                }
            }
        } 
    }
`

export const Grid = styled.div`
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    margin-bottom: 48px;
`

export const Horse = styled.div`
     width: 32%;
    margin-right: 1.3%;
    margin-bottom: 4px;
    position: relative;
    &:after {
        content: '#${props => props.tokenId}';
        position: absolute;
        bottom: -20px;
        color: #FFF;
        left: 0;
        font-weight: bold;
    }
`