// Heatmap Component using React-D3 for Glint Analytics
// Install Dependencies: npm install react-d3 d3

import { select, scaleBand, scaleSequential, interpolateYlGnBu, axisBottom, axisLeft, max } from 'd3';
import { useEffect, useRef } from 'react';
// import './Heatmap.css';

type HeatmapDatum = {
  x: string;
  y: string;
  value: number;
};

export type HeatmapData = HeatmapDatum[];

export function Heatmap({ data, title }: { data: HeatmapData, title: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);
    const width = 600;
    const height = 400;
    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.selectAll('*').remove(); // Clear previous content

    const xScale = scaleBand()
      .domain(data.map((d: HeatmapDatum) => d.x))
      .range([0, innerWidth])
      .padding(0.05);

    const yScale = scaleBand()
      .domain(data.map((d: HeatmapDatum) => d.y))
      .range([innerHeight, 0])
      .padding(0.05);

    const colorScale = scaleSequential(interpolateYlGnBu)
      .domain([0, max(data, (d: HeatmapDatum) => d.value) || 100]);

    const chart = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    chart.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d: HeatmapDatum) => xScale(d.x) || 0)
      .attr('y', (d: HeatmapDatum) => yScale(d.y) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .style('fill', (d: HeatmapDatum) => colorScale(d.value))
      .append('title')
      .text((d: HeatmapDatum) => `Value: ${d.value}`);

    chart.append('g')
      .call(axisBottom(xScale))
      .attr('transform', `translate(0,${innerHeight})`);

    chart.append('g')
      .call(axisLeft(yScale));
  }, [data]);

  return <div>
    <h2>{title}</h2>
    <svg ref={svgRef} width={600} height={400} />
  </div>;
}

// Example Usage:
// const heatmapData = [
//   { x: 'Monday', y: '10:00', value: 45 },
//   { x: 'Monday', y: '11:00', value: 78 }
// ];
// <Heatmap data={heatmapData} />
