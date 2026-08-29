// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BarChart = ({ dailyVolumes, width, height, margin }) => {
  const chartRef = useRef();

  useEffect(() => {
    const svg = d3.select(chartRef.current);
    const chartContainer = svg
      .append('g')
      .attr('class', 'bar-chart-container')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(dailyVolumes.map(d => d.day))
      .range([0, width - margin.left - margin.right])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(dailyVolumes, d => d.volume)])
      .range([height - margin.top - margin.bottom, 0]);

    // Render bars
    chartContainer.selectAll('.bar')
      .data(dailyVolumes)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.day))
      .attr('y', d => yScale(d.volume))
      .attr('width', xScale.bandwidth())
      .attr('height', d => height - margin.top - margin.bottom - yScale(d.volume))
      .attr('fill', 'steelblue');

    // Render x-axis
    chartContainer.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    // Render y-axis
    chartContainer.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale));

  }, [dailyVolumes, width, height, margin]);

  return <svg ref={chartRef} width={width} height={height} />;
};

export default BarChart;