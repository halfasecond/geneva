// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Import your SVG file as a string
import logoSvgString from './logo';

const PieChart = ({ percentage }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const width = 500;
    const height = 500;
    const radius = Math.min(width, height) / 2;
  
    // Clear the existing chart
    d3.select(chartRef.current).selectAll('*').remove();
  
    const svg = d3.select(chartRef.current)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

        // Append the logo SVG as a background
        svg.append('foreignObject')
        .attr('width', '100%')
        .attr('height', '100%')
        .append('xhtml:body')
        .style('margin', '0')
        .style('overflow', 'hidden')
        .html(`<div style="top: 0, left: 0; height: 100%; width: 100%;">${logoSvgString}</div>`);
  
    const pie = d3.pie().value(d => d.value);
  
    // Adjust the data array so that the larger portion comes first
    const data = [{ value: percentage }, { value: 100 - percentage }];
  
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);
  
    svg.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => (i === 0 ? '#ffd9ff' : 'gray'));
  
  }, [percentage]);
  return <div ref={chartRef} />;
};

export default PieChart;
