// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from 'react';
import { colors, grey } from 'kittyNews/style/config'
import { ReportType } from 'kittyNews/types/report';
import * as d3 from 'd3';

interface Props {
    data: ReportType[];
    parameters: string[];
}

const D3LineChart: React.FC<Props> = ({ data, parameters }) => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const svgRef = useRef<SVGSVGElement | null>(null); // Correcting svgRef typing
    const margin = { top: 60, right: 160, bottom: 40, left: 80, labelPadding: 10 };

    const updateDimensions = useCallback(() => {
        const svg = d3.select(svgRef.current);
        const containerWidth = (svg.node()?.parentNode as HTMLElement)?.clientWidth || 0;
        const width = containerWidth - margin.left - margin.right;
        const height = 0.4 * containerWidth - margin.top - margin.bottom;

        if (width !== dimensions.width || height !== dimensions.height) {
            setDimensions({ width, height });
        }

        const xScale = d3.scaleLinear<number, number>().domain([d3.min(data, d => d.Day) || 0, d3.max(data, d => d.Day) || 0]).range([0, width]);

        const maxAcrossParameters = d3.max(data, (d: ReportType) => 
            d3.max(parameters.map((param: string) => d[param])) || 0
        ) || 0;

        const yScales: { [key: string]: d3.ScaleLinear<number, number> } = {};
        parameters.forEach(param => {
            yScales[param] = d3.scaleLinear().domain([0, maxAcrossParameters]).range([height, 0]);
        });

        const lineGenerator = d3.line<ReportType>().x((d: ReportType) => xScale(d.Day));

        parameters.forEach(param => {
            lineGenerator.y((d: any) => yScales[param](d[param]));

            svg.select(`.${param}-line`)
                .datum(data)
                .attr('fill', 'none')
                .attr('stroke', param === 'ethPrice' ? colors.twilightsparkle : colors.bubblegum)
                .attr('stroke-width', 3)
                .attr('d', lineGenerator);

            const lastDataPoint = data[data.length - 1];
            const labelX = xScale(lastDataPoint.Day);
            const labelY = yScales[param](lastDataPoint[param] as any);

            svg.select(`.${param}-label`)
                .attr('x', labelX + margin.labelPadding)
                .attr('y', labelY)
                .text(`${param}: ${param === 'ethPrice' ? `$${parseFloat((lastDataPoint[param] / 1000).toString()).toFixed(2)}` : lastDataPoint[param].toLocaleString()}`);
        });

        const validTimestamps = data.filter((d: ReportType) => Number(d.timestamp) > 0)
        const xTimeScale = d3.scaleTime()
            .domain([new Date(d3.min(validTimestamps, (d: ReportType) => 
                new Date(Number(d.timestamp) * 1000)) || new Date()),
                new Date(d3.max(data, (d: ReportType) => new Date(Number(d.timestamp) * 1000)) || new Date())]
            ).range([0, width])

        const minYear = new Date(d3.min(validTimestamps, (d: ReportType) => new Date(Number(d.timestamp) * 1000)) || new Date()).getFullYear()
        const maxYear = new Date(d3.max(data, (d: ReportType) => new Date(Number(d.timestamp) * 1000)) || new Date()).getFullYear()

        const yearsRange = Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);
        const yearPositions = yearsRange.map(year => xTimeScale(new Date(`${year}-01-01`)) + margin.left);

        svg.selectAll('.year-line')
            .data(yearPositions)
            .join(
                (enter: any) => enter.append('line').attr('class', 'year-line'),
                (update: any) => update,
                (exit: any) => exit.remove()
            )
            .attr('x1', (d: any) => d)
            .attr('x2', (d: any) => d)
            .attr('y1', margin.top)
            .attr('y2', height + margin.top)
            .attr('stroke', '#999')
            .attr('stroke-dasharray', '4')

        svg.selectAll('.year-label')
            .data(yearPositions)
            .join(
                (enter: any) => enter.append('text').attr('class', 'year-label'),
                (update: any) => update,
                (exit: any) => exit.remove()
            )
            .attr('x', (d: any) => d)
            .attr('y', margin.top)
            .attr('dy', '-1em')
            .text((d: any) => d3.timeFormat('%Y')(xTimeScale.invert(d)))
            .attr('text-anchor', 'middle')
            .attr('fill', 'black');

        svg.select('.y-axis')
            .attr('transform', `translate(${width + margin.left}, ${margin.top})`)
            .call(d3.axisRight(yScales[parameters[0]]) as any)

        let additionalSvgContainer1 = svg.select('.foreign-object-container-1');

        if (additionalSvgContainer1.empty()) {
            additionalSvgContainer1 = svg.append('foreignObject') as d3.Selection<SVGForeignObjectElement, unknown, null, undefined>;

            const div = additionalSvgContainer1.append('xhtml:div');

            div.html(`
                <svg width="100%" height="100%" viewBox="0 0 1200 1200" preserveAspectRatio="xMidYMid meet">
                    <g fill="#999" >
                        <path d="m1072.5 1024.5h-897v-897c0-26.508-21.492-48-48-48s-48 21.492-48 48v945c0 26.508 21.492 48 48 48h945c26.508 0 48-21.492 48-48s-21.492-48-48-48z"/>
                        <path d="m228 840c-9.2148 0-18.434-3.5156-25.453-10.547-14.062-14.051-14.062-36.852 0-50.902l205.5-205.5c14.051-14.062 36.852-14.062 50.902 0l114.05 114.05 435.79-435.79c14.062-14.062 36.84-14.062 50.902 0 14.062 14.051 14.062 36.852 0 50.902l-461.24 461.25c-14.051 14.062-36.852 14.062-50.902 0l-114.05-114.05-180.05 180.05c-7.0195 7.0312-16.238 10.547-25.453 10.547z"/>
                    </g>
                </svg>
            `);
        } else {
            additionalSvgContainer1.attr('x', width + margin.left - 4);
        }

        svg.selectAll('.y-axis .tick text')
            .text((d: any) => `${d.toLocaleString()} / $${(d / 1000).toLocaleString()}`)
            .style('opacity', 0.25)

        svg.select('.x-axis')
            .attr('transform', `translate(${margin.left}, ${margin.top + height})`)
            .call(d3.axisBottom(xScale as d3.Axis<number | Date>).ticks(0).tickSize(0))
    }, [data, dimensions, parameters, margin])

    useEffect(() => {
        if (data && data.length > 0) {
            updateDimensions()
            window.addEventListener('resize', updateDimensions)
            return () => {
                window.removeEventListener('resize', updateDimensions)
            }
        }
    }, [updateDimensions, data, dimensions, parameters])

    return (
        <svg ref={svgRef} width="100%" height="100%">
            <BarChart parameter="SaleVolumeDaily" {...{ data, dimensions, margin }} />
            <g transform={`translate(${margin.left}, ${margin.top})`} className="x-axis" />
            <g transform={`translate(${margin.left}, ${margin.top})`} className="y-axis" />
            {parameters.map((param, i) => (
                <g key={i} transform={`translate(${margin.left}, ${margin.top})`}>
                    <path className={`${param}-line`} />
                    <text className={`${param}-label`} textAnchor="start" fill={grey[700]} />
                </g>
            ))}
        </svg>
    );
};

const BarChart = ({ data, parameter, dimensions, margin }) => {
    const svgRef = useRef();

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const width = dimensions.width;
        const height = dimensions.height;

        // Adjust margins for the BarChart
        const barChartMargin = { ...margin, left: 0, top: 0 }

        const xScale = d3.scaleBand()
            .domain(data.map(d => d.Day))
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d[parameter])])
            .range([height, 0]);

        // Update existing bars
        const bars = svg.selectAll('.bar')
            .data(data);

        bars
            .attr('x', d => xScale(d.Day))
            .attr('y', d => yScale(d[parameter]))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - yScale(d[parameter]) > 0 ? height - yScale(d[parameter]) : 0)
            .attr('fill', colors.skyblue);

        // Enter new bars
        bars.enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.Day))
            .attr('y', d => yScale(d[parameter]))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - yScale(d[parameter]) > 0 ? height - yScale(d[parameter]) : 0)
            .attr('fill', colors.skyblue);

        // Remove bars that are not in the updated data
        bars.exit().remove();

        // Update y-axis
        svg.select('.y-axis')
            .call(d3.axisLeft(yScale));

        // Add left axis
        svg.select('.left-axis')
            .attr('transform', `translate(${barChartMargin.left}, ${barChartMargin.top})`)
            .style('opacity', 0.25)
            .call(d3.axisLeft(yScale))
            .selectAll('text') // select all text elements on the y-axis
            .text((d) => `Ξ${d}`)

        const additionalSvgContainer = svg.append('foreignObject')
            .attr('width', 32)  // Adjust the width as needed
            .attr('height', 32); // Adjust the height as needed

        // Append a div inside the foreignObject
        const div = additionalSvgContainer.append('xhtml:div');

        // Paste your existing SVG paths and attributes here
        div.html(`
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <g fill="none" stroke="#999" stroke-linecap="round" stroke-linejoin="round" stroke-width="3">
            <path d="m71.78 72h-42.81"/>
            <path d="m45.62 38.7h9.5101v23.78h-9.5101z"/>
            <path d="m28.97 48.22h9.5101v14.27h-9.5101z"/>
            <path d="m62.27 28h9.5101v34.49h-9.5101z"/>
          </g>
        </svg>
      `);

        // Adjust the position as needed
        additionalSvgContainer.attr('x', -18).attr('y', -30);

    }, [data, parameter, dimensions, margin]);

    return (
        <g transform={`translate(${margin.left}, ${margin.top})`} ref={svgRef}>
            <g className="left-axis" />
        </g>
    );
};


export default D3LineChart