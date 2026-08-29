import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Socket } from 'socket.io-client'
import moment from 'moment'
import web3 from 'web3'
import * as Styled from './Logo.style'

type Block = {
    blocknumber: number
    timestamp: number,
    readableDate: String
}

type Report = {
    TotalVolume: String,
    owners: number,
}

const toBlock = (blocknumber: number, timestamp: number): Block => ({
    blocknumber,
    timestamp,
    readableDate: moment(timestamp * 1000).format('dddd Do MMMM YYYY h:mmA'),
})

const Logo: React.FC<{
    socket: Socket,
    report?: { TotalVolume?: string | number, owners?: number },
    ethBlock?: { blocknumber: number, timestamp: number },
}> = ({ socket, report: reportProp, ethBlock }) => {
    const [block, setBlock] = useState<Block | undefined>(undefined)
    const [flowBlock, setFlowBlock] = useState<Block | undefined>(undefined)
    const [report, setReport] = useState<Report | undefined>(undefined)

    useEffect(() => {
        if (!reportProp?.TotalVolume) return
        const volume = web3.utils.fromWei(reportProp.TotalVolume.toString(), 'ether')
        setReport({ TotalVolume: parseFloat(volume).toFixed(2), owners: reportProp.owners ?? 0 })
    }, [reportProp])

    useEffect(() => {
        if (!ethBlock?.blocknumber || !ethBlock.timestamp) return
        setBlock(toBlock(ethBlock.blocknumber, ethBlock.timestamp))
    }, [ethBlock])

    useEffect(() => {
        if (socket) {
            socket.on('newFlowBlock', ({ blocknumber, timestamp }: Block) => {
                setFlowBlock(toBlock(blocknumber, timestamp))
            })
            return () => {
                socket.off('newFlowBlock')
            }
        }
    }, [socket])

    return (
        <Styled.Div>
            <Link to={'/'}><img src={'/apple-touch-icon.png'} alt={'kitty.news'} /></Link>     
            <h1><Link to={'/'}>kitty.news</Link></h1>
            <h2>by <a href={'https://kitty.international'} target={'_blank'}>kitty.international</a></h2>
            <p><span>🐾</span>{block && `${block.readableDate}`}<span>🐾</span></p>
            <h2>
                {block && `eth block: ${block.blocknumber}`}
                {block && flowBlock && ` - `}
                {flowBlock && `flow block: ${flowBlock.blocknumber}`}
            </h2>
            <h2>Total Volume: {report?.TotalVolume ? `Ξ${report.TotalVolume}` : ''} - Current owners: {report?.owners}</h2>
        </Styled.Div>
    )
}

export default Logo 