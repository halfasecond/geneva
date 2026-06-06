import * as Styled from './Countdown.style'

const Countdown: React.FC<{ countdown: number }> = ({ countdown }) => {
    function calculateTimeRemaining(time: number) {
        if (time <= 0) {
            return {
                days: '00',
                hours: '00',
                minutes: '00',
                seconds: '00',
            }
        }
  
        const days = Math.floor(time / (1000 * 60 * 60 * 24))
        const hours = Math.floor((time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((time % (1000 * 60)) / 1000)
        return {
            days: String(days).padStart(2, '0'),
            hours: String(hours).padStart(2, '0'),
            minutes: String(minutes).padStart(2, '0'),
            seconds: String(seconds).padStart(2, '0'),
        }
        
    }
    return (
        <Styled.Div className={'countdown'}>
            {calculateTimeRemaining(countdown * 1000).days}:{calculateTimeRemaining(countdown * 1000).hours}:
            {calculateTimeRemaining(countdown * 1000).minutes}:{calculateTimeRemaining(countdown * 1000).seconds}
        </Styled.Div>
    )
}
export default Countdown
