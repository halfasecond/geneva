import * as Styled from './MenuC2A.style'

const MenuC2A = () => {
    return (
        <Styled.Link to={'/'}>
            <img src={'/flowbots.png'} alt={'Flowbots'} />
            <h1>Flowbots</h1>
        </Styled.Link>
    )
}

export default MenuC2A