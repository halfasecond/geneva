import styled from 'styled-components'
import * as Styled from 'kittyNews/style'
import { gutters } from 'kittyNews/style/config'

export const Div = styled(Styled.Div)`
    h1 {
        > a {
            &:last-of-type {
                font-size: 14px;
                margin-left: ${gutters['md']};
                &:hover {
                    text-decoration: underline;
                }
            }
        }
    }
    > h2 {
        margin-bottom: ${gutters['lg']};
        > span {
            color: #FF0066; 
        }
    }
    h3 {
        margin-bottom: ${gutters['md']};
        > a > span {
            display: inline-block;
            margin-left: ${gutters['lg']};
            color: #666;
        }
        > a {
            font-size: 14px;
            display: inline-block;
            margin-left: ${gutters['md']};
        }
    }
`

export const Form = styled.form`
    width: 100%;
    max-width: 800px;
    > div {
        margin-bottom: ${gutters['md']};
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        position: relative;
        > label {
            padding-top: ${gutters['xxs']};
            min-width: 140px;
            font-weight: 700;
            color: #666;
            > select {
                padding: ${gutters['xs']} ${gutters['sm']};
                font-weight: 700;
                color: #666;
            }
            > i {
                 color: #FF0066;
            }
        }
        > div {
            width: 100%;
            position: relative;
            > b {
                font-weight: 500;
            }
            > section {
                width: 100%;
                display: flex;
                flex-wrap: wrap;
                > input[type="text"] {
                    width: 80%;
                    padding: ${gutters['sm']} ${gutters['md']};
                    margin-bottom: ${gutters['md']};
                    margin-right: ${gutters['sm']};
                }
                > img {
                    margin-bottom: ${gutters['lg']};
                    max-width: 300px;
                }
                > menu {
                    margin-left: ${gutters['xs']};
                    width: 80px;
                    > button {
                        margin-right: ${gutters['xs']};
                        &:last-of-type {
                            margin-right: 0;
                        }
                    }
                }
            }
        }
        > select {
            padding: ${gutters['xs']} ${gutters['sm']};
            font-weight: 700;
            color: #666;
        }
        > input[type="text"], textarea {
            width: 100%;
            padding: ${gutters['sm']} ${gutters['md']};
        }
        > input[type="checkbox"] {
            margin-top: ${gutters['sm']};
        }
        > menu {
            position: absolute;
            left: 100%;
            margin-left: ${gutters['md']};
            width: 80px;
            > button {
                margin-right: ${gutters['sm']};
                &:last-of-type {
                    margin-right: 0;
                }
            }
        }
        > button {
            margin-top: ${gutters['lg']};
            padding: ${gutters['sm']} ${gutters['md']};
        }
       
    }
    > img {
        margin-left: 140px;
        margin-bottom: ${gutters['lg']};
        max-width: 300px;
    }
    > h2 {
        margin: ${gutters['xxl']} 0 ${gutters['lg']};
    }

    > ul {
        display: flex;
        flex-wrap: wrap;
        > li {
            background-color: #EEE;
            display: inline-block;
            border: 1px solid #999;
            padding: ${gutters['xs']} ${gutters['lg']} ${gutters['xs']} ${gutters['md']};
            margin: 0 ${gutters['md']} ${gutters['md']} 0;
            position: relative;
            > span {
                position: absolute;
                right: 4px;
                top: 2px;
                font-size: 12px;
                line-height: 12px;
                cursor: pointer;
                color: #666;
                font-weight: bold;
                &:hover {
                    opacity: 0.6;
                }
            }
            > input[type="text"] {
                padding: ${gutters['xs']} ${gutters['sm']};
                margin-right: ${gutters['sm']};
            }
        } 
    }
    
`