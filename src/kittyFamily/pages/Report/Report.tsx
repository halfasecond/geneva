// @ts-nocheck
import React, { Fragment, useEffect, useState } from 'react'
import Chart from 'kittyFamily/components/Chart'
import axios from 'axios'
import * as Styled from './Report.style'
import { fromWei } from 'web3-utils'
import BN from 'bn.js'
import { formatElapsedTime, catTypes, genes } from 'kittyFamily/utils'
import { API } from 'kittyFamily/api'


function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
  
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    };
  
    return date.toLocaleDateString('en-US', options);
}

const reportObject = { 
    All: 0, Day: 0, Birth: 0, Transfer: 0, OwnersAll: 0,
    AuctionCreated: 0, AuctionSuccessful: 0, AuctionCancelled: 0, SaleCreated: 0, SaleSuccessful: 0, SaleCancelled: 0, 
    SireCreated: 0, SireSuccessful: 0, SireCancelled: 0,
    SaleVolume: '0', SireVolume: '0', SaleVolumeDaily: '0', SireVolumeDaily: '0',
    Owners: 0, OwnersDaily: 0, flooredItAndGTFO: 0,
    blockNumber: 0, gens: { gen0: 0, gen1: 0, gen2: 0, gen3: 0, gen4: 0, gen5: 0,
    gen6: 0, gen7: 0, gen8: 0, gen9: 0, gen10: 0, gen11: 0, gen12: 0, gen13: 0, gen14: 0, gen15: 0,
    gen16: 0, gen17: 0, gen18: 0, gen19: 0, gen20: 0, gen21: 0, gen22: 0, gen23: 0, gen24: 0, gen25: 0,
    gen26etc: 0, gen100: 0, gen1000: 0, gen10000: 0, highestGen: 0, },
    SaleSuccessfulTotal: 0, SireSuccessfulTotal: 0, SaleVolumeTotal: 0, SireVolumeTotal: 0, BirthTotal: 0,
    timestamp: 1511395200,
    timer: 0, cattributes: {
        g0: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g1: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g2: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g3: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g4: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g5: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g6: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g7: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g8: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g9: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g10: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g11: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g12: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g13: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g14: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g15: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g16: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g17: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g18: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g19: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g20: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g21: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g22: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g23: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g24: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g25: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g26: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g27: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g28: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g29: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g30: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g31: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g32: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g33: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g34: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g35: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g36: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g37: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g38: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g39: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g40: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g41: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g42: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g43: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g44: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g45: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g46: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g47: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g0pb: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g4pb: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g8pb: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g12pb: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g16pb: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g20pb: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g24pb: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g28pb: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g32pb: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g36pb: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g40pb: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g44pb: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g0d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g4d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g8d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g12d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g16d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g20d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g24d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g28d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g32d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g36d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g40d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        g44d: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    }
}

const dataTypes = ['Birth', 'Owners', 'flooredItAndGTFO', 'SaleSuccessful', 'SaleCreated', 'SaleCancelled', 'Transfer', 'SaleVolume', 'SaleVolumeUSD', 'ethPrice', 'averagePrice', 'averagePriceUSD']

const Report = ({ socket }) => {
    const [report, setReport] = useState(undefined)
    const [latestReport, setLatestReport] = useState(undefined)
    const [historicReports, setHistoricReports] = useState([])
    const [sliderValue, setSliderValue] = useState(0)
    const [total, setTotal] = useState(0)
    const [chartData, setChartData] = useState([])
    const [chartMenu, setChartMenu] = useState(dataTypes)
    const [ethPrices, setEthPrices] = useState(undefined)
    const [ethPrice, setEthPrice] = useState(false)

    useEffect(() => {
        if (socket) {
            socket.on('ckReport', _report => {
                setReport(_report)
            })
        }
    })

    useEffect(() => {
        if (!ethPrice) {
        axios.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD').then(res => {
            setEthPrice(res.data.USD)
        }).catch(err => console.log(err))
        }
    }, [ethPrice])

    useEffect(() => {
        if (ethPrices === undefined) {
            const getEthPrices = async () => {
                const { data } = await axios.get(`${API}/kittynews/ethprices`)
                setEthPrices(data)
            }
            getEthPrices()
        }
    }, [ethPrices])

    useEffect(() => {
        if (historicReports.length > 0 && latestReport && ethPrices && ethPrice) {
            console.log('ehhlo')
            const reports = [reportObject, ...historicReports, latestReport]
            let SaleVolumeUSD = 0
            let SireVolumeUSD = 0
            const modifiedData = reports
                .slice(0, sliderValue + 2)
                .map((hR, i) => {
                    const _ethPrice = ethPrices.find(({ timestamp }) => timestamp === hR.timestamp)
                    const SaleVolumeDailyUSD = _ethPrice === undefined
                        ? Number(parseFloat(fromWei(hR.SaleVolumeDaily, 'ether')).toFixed(2)) * ethPrice
                        : Number(parseFloat(fromWei(hR.SaleVolumeDaily, 'ether')).toFixed(2)) * _ethPrice.ethprice
                    const SireVolumeDailyUSD = _ethPrice === undefined
                        ? Number(parseFloat(fromWei(hR.SireVolumeDaily, 'ether')).toFixed(2)) * ethPrice
                        : Number(parseFloat(fromWei(hR.SireVolumeDaily, 'ether')).toFixed(2)) * _ethPrice.ethprice
                    SireVolumeUSD = SireVolumeUSD + SireVolumeDailyUSD
                    SaleVolumeUSD = SaleVolumeUSD + SaleVolumeDailyUSD
                    let averagePrice = 0
                    let averagePriceUSD = 0
                    if (hR.SaleSuccessful > 0) {
                        averagePrice = new BN(hR.SaleVolume).div(new BN(hR.SaleSuccessful.toString()))
                        averagePriceUSD = _ethPrice === undefined
                            ? Number(parseFloat(fromWei(averagePrice.toString(), 'ether')).toFixed(2)) * ethPrice
                            : Number(parseFloat(fromWei(averagePrice.toString(), 'ether')).toFixed(2)) * _ethPrice.ethprice
                        averagePrice = Number(parseFloat(fromWei(averagePrice.toString(), 'ether')))
                    }
                    return ({ 
                        ...hR,
                        SaleVolume: Number(parseFloat(fromWei(hR.SaleVolume, 'ether')).toFixed(2)),
                        SaleVolumeDaily: Number(parseFloat(fromWei(hR.SaleVolumeDaily, 'ether')).toFixed(2)),
                        SaleVolumeDailyUSD,
                        SaleVolumeUSD,
                        SireVolumeDailyUSD,
                        SireVolumeUSD,
                        averagePrice,
                        averagePriceUSD,
                        ethPrice: _ethPrice === undefined ? ethPrice * 1000 : _ethPrice.ethprice * 1000
                    })
                 });
            console.log('eh?')
            setChartData([...modifiedData])
            sliderValue === historicReports.length ? setReport(latestReport) : setReport(historicReports[sliderValue])
        }
    }, [sliderValue, historicReports, ethPrices, ethPrice]);


    useEffect(() => {
        const getDailies = async () => {
            const { data } = await axios.get(`${API}/kittynews/dailies`)
            setHistoricReports(data)
            setSliderValue(data.length)
            console.log('!!')
        }
        if (historicReports.length === 0) {
            getDailies()
            console.log('eh?')
        }
    }, [historicReports])

    const handleCheckboxChange = (dataType) => {
        setChartMenu((prevChartMenu) => {
            if (prevChartMenu.includes(dataType)) {
                // If the data type is already in the array, remove it
                return prevChartMenu.filter((type) => type !== dataType);
            } else {
                // If the data type is not in the array, add it
                return [...prevChartMenu, dataType];
            }
        })
    }

    if (!report) return null

    return (
        <>
            {historicReports.length > 0 && 
                <Styled.FixedContainer>
                    <h2>{formatTimestamp(report.timestamp)} - Day: {report.Day} {report.timer && ` - ${formatElapsedTime(report.timer)}`}</h2>
                    <input
                        type="range"
                        min="0"
                        max={historicReports.length}
                        step="1"
                        value={sliderValue}
                        onChange={(e) => setSliderValue(parseInt(e.target.value))}
                    />
                </Styled.FixedContainer>
            }
            <Styled.Div>
            
                <Styled.ChartContainer>
                    <Styled.ChartWrapper>
                        {chartData.length > 0 && <Chart data={chartData} parameters={chartMenu} />}{console.log(chartData)}
                        {/* {chartData.length > 0 && <PieChart percentage={parseFloat((100 / total) * report.All).toFixed(2)} />} */}
                    </Styled.ChartWrapper>
                </Styled.ChartContainer>
                <div>
                    {dataTypes.map((d, i) => {
                        return (
                            <div key={i} className={'graphKey'}>
                                <label>{d}</label>
                                <input type={'checkbox'} checked={chartMenu.includes(d)} onChange={() => handleCheckboxChange(d)} disabled={chartMenu.includes(d) && chartMenu.length === 1} />
                            </div>
                        )
                        
                    })}
                </div>
                <hr />
                <div>
                    <div>All: {report.All} ({parseFloat((100 / total) * report.All).toFixed(2)}%)</div>
                    <div>Total: {total}</div>
                    <div>Birth: {report.Birth} ({parseFloat((100 / 4294967295) * report.Birth).toFixed(5)}%)</div>
                    <div>Transfer {report.Transfer}</div>
                </div>
                {/* <div>
                    <div>New Owners Daily: {report.OwnersDaily}</div>
                    <div>FI & GTFO: {report.flooredItAndGTFO}</div>
                    <div>Current Owners: {report.Owners - report.flooredItAndGTFO}</div>
                </div> */}
                <hr />
                <div>
                    <div>Sales Created: {report.SaleCreated}</div>
                    <div>Sales Successful: {report.SaleSuccessful}</div>
                    <div>Sales Cancelled: {report.SaleCancelled}</div>
                </div>
                <div>
                    <div>Sale Volume (ETH - daily): Ξ{report.SaleVolumeDaily && parseFloat(fromWei(report.SaleVolumeDaily, 'ether')).toFixed(6)}</div>
                    <div>Sale Volume (USD - daily): ${chartData[sliderValue + 1] && chartData[sliderValue + 1].SaleVolumeDailyUSD.toFixed(2)}</div>
                </div>
                <div>
                    <div>Sale Volume (ETH): Ξ{report.SaleVolume && parseFloat(fromWei(report.SaleVolume, 'ether')).toFixed(6)}</div>
                    <div>Sale Volume (USD): ${chartData[sliderValue + 1] && chartData[sliderValue + 1].SaleVolumeUSD.toFixed(2)}</div>
                    {/* <div>EthPrice: ${chartData[sliderValue + 1] && (chartData[sliderValue + 1].ethPrice / 1000).toFixed(2)}</div> */}
                </div>
                <hr />
                <div>
                    <div>Sires Created: {report.SireCreated}</div>
                    <div>Sires Successful: {report.SireSuccessful}</div>
                    <div>Sires Cancelled: {report.SireCancelled}</div>
                </div>
                <div>
                    <div>Sire Volume (ETH - daily): Ξ{report.SireVolumeDaily && parseFloat(fromWei(report.SireVolumeDaily, 'ether')).toFixed(6)}</div>
                    <div>Sire Volume (USD - daily): ${chartData[sliderValue + 1] && chartData[sliderValue + 1].SireVolumeDailyUSD.toFixed(2)}</div>
                </div>
                <div>
                    <div>Sire Volume (ETH): Ξ{report.SireVolume && parseFloat(fromWei(report.SireVolume, 'ether')).toFixed(6)}</div>
                    <div>Sire Volume (USD): ${chartData[sliderValue + 1] && chartData[sliderValue + 1].SireVolumeUSD.toFixed(2)}</div>
                </div>
                <hr />
                <div className={'smaller'}>
                    {Array.from({ length: 13 }).map((_, i) => (
                        <div key={i}><b>Gen{i}</b>:<br />{report.gens[`gen${i}`]}</div>
                    ))}
                </div>
                <div className={'smaller'}>
                    {Array.from({ length: 13 }).map((_, i) => (
                        <div key={i}><b>Gen{i + 13}</b>:<br />{report.gens[`gen${i + 13}`]}</div>
                    ))}
                </div>
                <div className={'smaller'}>
                    <div><b>{'>= Gen 26'}</b>:<br />{report.gens.gen26etc}</div>
                    <div><b>{'Gen 100'}</b>:<br />{report.gens.gen100}</div>
                    <div><b>{'Gen 1000'}</b>:<br />{report.gens.gen1000}</div>
                    <div><b>{'Gen 10000'}</b>:<br />{report.gens.gen10000}</div>
                    <div><b>{'Highest Gen'}</b>:<br />{report.gens.highestGen}</div>
                </div>
                <hr />
                {report.cattributes && [0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
                    return (
                        <Fragment key={i}>
                            <h3>{catTypes[i].readable}</h3>
                            <div className={'m4'}>
                                {report.cattributes[`g${i * 4}`].map((g, q) => q === 30 &&
                                    <Styled.Cattribute key={q} className={report.cattributes[`g${i * 4}d`][q] > 0 ? genes[q]['ec'] : 'grey'}>
                                        <div>{genes[q][catTypes[i].param]}</div>
                                        <div>
                                            {g} {/* report.cattributes[`g${(i * 4) + 1}`][q]} {report.cattributes[`g${(i * 4) + 2}`][q]} {report.cattributes[`g${(i * 4) + 3}`][q] */}
                                        </div>
                                        <div>
                                            PB: {report.cattributes[`g${i * 4}pb`][q]} - D: {report.cattributes[`g${i * 4}d`][q]}
                                        </div>
                                    </Styled.Cattribute>
                                )}
                            </div>
                            <div className={'m3'}>
                                {report.cattributes[`g${i * 4}`].map((g, q) => q >= 28 && q <= 29 &&
                                    <Styled.Cattribute key={q} className={report.cattributes[`g${i * 4}d`][q] > 0 ? genes[q]['ec'] : 'grey'}>
                                        <div>{genes[q][catTypes[i].param]}</div>
                                        <div>
                                            {g} {/* report.cattributes[`g${(i * 4) + 1}`][q]} {report.cattributes[`g${(i * 4) + 2}`][q]} {report.cattributes[`g${(i * 4) + 3}`][q] */}
                                        </div>
                                        <div>
                                            PB: {report.cattributes[`g${i * 4}pb`][q]} - D: {report.cattributes[`g${i * 4}d`][q]}
                                        </div>
                                    </Styled.Cattribute>
                                )}
                            </div>
                            <div className={'m2'}>
                                {report.cattributes[`g${i * 4}`].map((g, q) => q >= 24 && q <= 27 &&
                                    <Styled.Cattribute key={q} className={report.cattributes[`g${i * 4}d`][q] > 0 ? genes[q]['ec'] : 'grey'}>
                                        <div>{genes[q][catTypes[i].param]}</div>
                                        <div>
                                            {g} {/* report.cattributes[`g${(i * 4) + 1}`][q]} {report.cattributes[`g${(i * 4) + 2}`][q]} {report.cattributes[`g${(i * 4) + 3}`][q] */}
                                        </div>
                                        <div>
                                            PB: {report.cattributes[`g${i * 4}pb`][q]} - D: {report.cattributes[`g${i * 4}d`][q]}
                                        </div>
                                    </Styled.Cattribute>
                                )}
                            </div>
                            <div className={'m1'}>
                                {report.cattributes[`g${i * 4}`].map((g, q) => q >= 16 && q <= 23 &&
                                    <Styled.Cattribute key={q} className={report.cattributes[`g${i * 4}d`][q] > 0 ? genes[q]['ec'] : 'grey'}>
                                        <div>{genes[q][catTypes[i].param]}</div>
                                        <div>
                                            {g} {/* report.cattributes[`g${(i * 4) + 1}`][q]} {report.cattributes[`g${(i * 4) + 2}`][q]} {report.cattributes[`g${(i * 4) + 3}`][q] */}
                                        </div>
                                        <div>
                                            PB: {report.cattributes[`g${i * 4}pb`][q]} - D: {report.cattributes[`g${i * 4}d`][q]}
                                        </div>
                                    </Styled.Cattribute>
                                )}
                            </div>
                            <div className={'m0'}>
                                {report.cattributes[`g${i * 4}`].map((g, q) => q <= 15 &&
                                    <Styled.Cattribute key={q} className={report.cattributes[`g${i * 4}d`][q] > 0 ? genes[q]['ec'] : 'grey'}>
                                        <div>{genes[q][catTypes[i].param]}</div>
                                        <div>
                                            {g} {/* report.cattributes[`g${(i * 4) + 1}`][q]} {report.cattributes[`g${(i * 4) + 2}`][q]} {report.cattributes[`g${(i * 4) + 3}`][q] */}
                                        </div>
                                        <div>
                                            PB: {report.cattributes[`g${i * 4}pb`][q]} - D: {report.cattributes[`g${i * 4}d`][q]}
                                        </div>
                                    </Styled.Cattribute>
                                )}
                            </div>
                        </Fragment>
                        
                    )
                })}
            </Styled.Div>
        </>
        
    )
}

export default Report