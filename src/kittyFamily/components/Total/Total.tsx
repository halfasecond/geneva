// @ts-nocheck
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import loading from 'kittyFamily/svg/loading.svg'
import * as Styled from './Total.style'

const Total = ({ socket, emit }) => {
    const [report, setReport] = useState({
        Birth: undefined,
        TotalVolume: undefined
    })

    useEffect(() => {
        if (report && report.Birth) {
            emit({ tokenId: report.Birth, type: 'Birth', account: "0x51ad709f827c6ec2ed07269573abf592f83ed50c".toLowerCase() })
        }
    }, [report.Birth])

    useEffect(() => {
        if (socket) {
            socket.on('ckReport', _report => setReport(_report))
        }
    }, [socket])
    
  const navigate = useNavigate()

    return (
        <>
            <Styled.Div><h3>Total cryptokitties: {report
                ? <span onClick={() => navigate(`/kitty/${report.Birth}`)} role={'button'}>{report.Birth}</span>
                : <img src={loading} alt={''} />}</h3>
            </Styled.Div>
        </>
        
    )

}
  

export default Total
