import { useEffect, useState } from 'react'
import ReactSlider from 'react-slider'
import Chart from 'kittyNews/components/Chart'
import axios from 'axios'
import { API } from 'kittyNews/api'
import * as Styled from './Report.style'
import { utils } from 'web3'
import { unPadAndFormatPrice } from 'kittyNews/utils';
import { ReportType } from 'kittyNews/types/report'

const { fromWei } = utils

function formatTimestamp(timestamp: number) {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

const reportObject = {
    Birth: 0,
    BirthDaily: 0,
    Day: 0,
    SaleCancelled: 0,
    SaleCancelledDaily: 0,
    SaleCreated: 0,
    SaleCreatedDaily: 0,
    SaleSuccessful: 0,
    SaleSuccessfulDaily: 0,
    SaleVolume: '0',
    SaleVolumeUSD: '0',
    SaleVolumeDaily: '0',
    SaleVolumeDailyUSD: '0',
    SireCancelled: 0,
    SireCancelledDaily: 0,
    SireCreated: 0,
    SireCreatedDaily: 0,
    SireSuccessful: 0,
    SireSuccessfulDaily: 0,
    SireVolume: '0',
    SireVolumeUSD: '0',
    SireVolumeDaily: '0',
    SireVolumeDailyUSD: '0',
    TotalVolume: '0',
    TotalVolumeDaily: '0',
    timestamp: 0,
    ethPrice: '381.44'
}

const dataTypes: string[] = ['Birth', 'ethPrice'
    //'Owners', 'flooredItAndGTFO', 'SaleSuccessful', 'SaleCreated', 'SaleCancelled', 'Transfer', 'SaleVolume', 'SaleVolumeUSD', 'ethPrice', 'averagePrice', 'averagePriceUSD'
]

const Report: React.FC<{ report: ReportType }> = ({ report }) => {
    const [reports, setReports] = useState<ReportType[]>([]);
    const [sliderValues, setSliderValues] = useState<number[]>([0, 0])
    const [chartData, setChartData] = useState<ReportType[]>([])

    // Update chart data whenever reports change
    useEffect(() => {
        if (reports.length > 0) {
            let SaleVolumeUSD = 0;
            const modifiedData = reports.map((hR: ReportType) => {
                const svd = hR.TotalVolumeDaily ? hR.TotalVolumeDaily : '0';
                const SaleVolumeDailyUSD = Number(parseFloat(fromWei(svd, 'ether')).toFixed(2)) * hR.ethPrice;
                SaleVolumeUSD = SaleVolumeUSD + SaleVolumeDailyUSD;
                return {
                    Birth: hR.Birth || 0,
                    BirthDaily: hR.BirthDaily || 0,
                    Day: hR.Day || 0,
                    SaleCancelled: hR.SaleCancelled || 0,
                    SaleCancelledDaily: hR.SaleCancelledDaily || 0,
                    SaleCreated: hR.SaleCreated || 0,
                    SaleCreatedDaily: hR.SaleCreatedDaily || 0,
                    SaleSuccessful: hR.SaleSuccessful || 0,
                    SaleSuccessfulDaily: hR.SaleSuccessfulDaily || 0,
                    SaleVolume: hR.SaleVolume ? Number(unPadAndFormatPrice(hR.SaleVolume.toString()).replace('Ξ', '')) : '0',
                    SaleVolumeUSD,
                    SaleVolumeDaily: hR.SaleVolumeDaily ? Number(unPadAndFormatPrice(hR.SaleVolumeDaily.toString()).replace('Ξ', '')) : 0,
                    SaleVolumeDailyUSD,
                    SireCancelled: hR.SireCancelled || 0,
                    SireCancelledDaily: hR.SireCancelledDaily || 0,
                    SireCreated: hR.SireCreated || 0,
                    SireCreatedDaily: hR.SireCreatedDaily || 0,
                    SireSuccessful: hR.SireSuccessful || 0,
                    SirleSuccessfulDaily: hR.SireSuccessfulDaily || 0,
                    // SireVolumeUSD: '0',
                    // SireVolumeDaily: '0',
                    // SireVolumeDailyUSD: '0',
                    TotalVolume: hR.TotalVolume ? Number(unPadAndFormatPrice(hR.TotalVolume.toString())) : '0',
                    TotalVolumeDaily: hR.TotalVolume ? Number(unPadAndFormatPrice(hR.TotalVolumeDaily.toString())) : '0',
                    ethPrice: Number(hR.ethPrice) * 1000,
                    timestamp: hR.timestamp,
                };
            });
            setChartData([...modifiedData]);
        }
    }, [reports])

    // Fetch daily reports and initialize the slider values
    useEffect(() => {
        const getDailies = async () => {
            const { data } = await axios.get(`${API}/kittynews/dailies`)
            const days = [...data].sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
            const reports = [reportObject, ...days]
            const sliderValues = [2, reports.length]
            setReports(reports)
            setSliderValues(sliderValues)
        }
        getDailies()
    }, [report])

    return (
        <>
            {reports.length > 0 && !(sliderValues[0] === 0 && sliderValues[1] === 0) && (
                <Styled.Control>
                    <h2><span>{`${formatTimestamp(Number(reports[sliderValues[0] - 1].timestamp))} -`}&nbsp;</span>{formatTimestamp(Number(reports[sliderValues[1] - 1].timestamp))} - Day: {reports[sliderValues[1] - 1].Day}</h2>
                    {/* Range slider with two handles (start and end) - desktop only */}
                    <ReactSlider
                        className="horizontal-slider"
                        thumbClassName="example-thumb"
                        trackClassName="example-track"
                        defaultValue={sliderValues}
                        min={2}
                        max={reports.length}
                        ariaLabel={['Lower thumb', 'Upper thumb']}
                        ariaValuetext={state => `Thumb value ${state.valueNow}`}
                        pearling
                        minDistance={0}
                        onChange={values => setSliderValues(values)}
                    />
                    {/* Range slider with one handle (end) - mobile only */}
                    <div className={'mobile'}>
                        <input
                            type="range"
                            min="2"
                            max={reports.length}
                            step="1"
                            value={sliderValues[1]}
                            onChange={(e) => setSliderValues(prevState => ([prevState[0], Number(e.target.value)]))}
                            style={{ width: '100%' }}
                        />
                    </div>
                </Styled.Control>
            )}
            {chartData.length > 0 && !(sliderValues[0] === 0 && sliderValues[1] === 0) && (
                <Styled.Div>
                    {chartData[sliderValues[1] - 1] && (
                        <>
                            <Styled.ChartContainer>
                                <Styled.ChartWrapper>
                                    {chartData.length > 0 && <Chart data={chartData.slice(sliderValues[0] - 2, sliderValues[1])} parameters={dataTypes} />}
                                    {/* {chartData.length > 0 && <PieChart percentage={parseFloat((100 / total) * report.All).toFixed(2)} />} */}
                                </Styled.ChartWrapper>
                            </Styled.ChartContainer>
                            {/* <div>
                        {dataTypes.map((d, i) => {
                            return (
                                <div key={i} className={'graphKey'}>
                                    <label>{d}</label>
                                    <input type={'checkbox'} checked={chartMenu.includes(d)} onChange={() => handleCheckboxChange(d)} disabled={chartMenu.includes(d) && chartMenu.length === 1} />
                                </div>
                            )

                        })}
                    </div> */}
                            <div className={'bg-grey'}>
                                <div>Births (daily): <span>{chartData[sliderValues[1] - 1].BirthDaily}</span></div>
                                {sliderValues[0] === 2 && sliderValues[1] === reports.length ? (
                                    <div>Births (total): <span>{chartData[sliderValues[1] - 1].Birth.toLocaleString()}</span></div>
                                ) : !(sliderValues[1] === sliderValues[0]) && (
                                    <div>Births (custom): <span>{(Number(chartData[sliderValues[1] - 1].Birth) - Number(chartData[sliderValues[0] - 2].Birth)).toLocaleString()}</span></div>
                                )}
                            </div>
                            <div>
                                <div>ETH Volume (daily): <span>Ξ{Number(parseFloat(chartData[sliderValues[1] - 1].TotalVolumeDaily.toString()).toFixed(4)).toLocaleString()}</span></div>
                                {sliderValues[0] === 2 && sliderValues[1] === reports.length ? (
                                    <div>ETH Volume (total): <span>Ξ{Number(parseFloat(chartData[sliderValues[1] - 1].TotalVolume.toString()).toFixed(2)).toLocaleString()}</span></div>
                                ) : sliderValues[1] !== sliderValues[0] && (
                                    <div>ETH Volume (custom): <span>Ξ{Number(parseFloat((Number(chartData[sliderValues[1] - 1].TotalVolume) - Number(chartData[sliderValues[0] - 2].TotalVolume)).toString()).toFixed(2)).toLocaleString()}</span></div>
                                )}
                            </div>
                            <div className={'bg-grey'}>
                                <div>USD Volume (daily): <span>${Number(parseFloat(chartData[sliderValues[1] - 1].SaleVolumeDailyUSD.toString()).toFixed(2)).toLocaleString()}</span></div>
                                {sliderValues[0] === 2 && sliderValues[1] === reports.length ? (
                                    <div>USD Volume (total): <span>${Number(parseFloat(chartData[sliderValues[1] - 1].SaleVolumeUSD.toString()).toFixed(2)).toLocaleString()}</span></div>
                                ) : sliderValues[1] !== sliderValues[0] && (
                                    <div>USD Volume (custom): <span>${Number(parseFloat((Number(chartData[sliderValues[1] - 1].SaleVolumeUSD) - Number(chartData[sliderValues[0] - 2].SaleVolumeUSD)).toString()).toFixed(2)).toLocaleString()}</span></div>
                                )}
                                <div>Eth Price: <span>${(chartData[sliderValues[1] - 1].ethPrice / 1000).toFixed(2)}</span></div>
                            </div>
                            <div>
                                <div>Sales Created: <span>{chartData[sliderValues[1] - 1].SaleCreated.toLocaleString()}</span></div>
                                <div>Sales Successful: <span>{chartData[sliderValues[1] - 1].SaleSuccessful.toLocaleString()}</span></div>
                                <div>Sales Cancelled: <span>{chartData[sliderValues[1] - 1].SaleCancelled.toLocaleString()}</span></div>
                                <div>Current Sales: <span>{(chartData[sliderValues[1] - 1].SaleCreated - chartData[sliderValues[1] - 1].SaleSuccessful - chartData[sliderValues[1] - 1].SaleCancelled).toLocaleString()}</span></div>
                            </div>
                        </>
                    )}


                </Styled.Div>
            )}

        </>

    )
}

export default Report