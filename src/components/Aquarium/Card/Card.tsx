import * as Styled from './Card.style'
type Props = {
    style? : object;
    children?: React.ReactNode;
    onClose?: () => void;
}

const Card: React.FC<Props> = ({ style, onClose, children }) => {
    return (
        <Styled.Div style={{ ...style }}>
            {onClose && <Styled.Close onClick={onClose}>x</Styled.Close>}
            {children}
        </Styled.Div>
    )
}

export default Card