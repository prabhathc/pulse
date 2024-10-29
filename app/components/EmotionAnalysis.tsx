import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

type EmotionAnalysisProps = {
  data: { category: string; value: number }[];
};

const EmotionAnalysis = ({ data }: EmotionAnalysisProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const predefinedCategories = [
    "disappointment",
    "sadness",
    "annoyance",
    "neutral",
    "disapproval",
    "realization",
    "nervousness",
    "approval",
    "joy",
    "anger",
    "embarrassment",
    "caring",
    "remorse",
    "disgust",
    "grief",
    "confusion",
    "relief",
    "desire",
    "admiration",
    "optimism",
    "fear",
    "love",
    "excitement",
    "curiosity",
    "amusement",
    "surprise",
    "gratitude",
    "pride",
  ];

  const normalizedData = predefinedCategories.map((category) => ({
    category,
    value: data.find((d) => d.category === category)?.value || 0,
  }));

  useEffect(() => {
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 400 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(predefinedCategories)
      .range([0, width])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(normalizedData, (d) => d.value) || 0])
      .nice()
      .range([height, 0]);

    // Bars
    svg
      .selectAll(".bar")
      .data(normalizedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.category)!)
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.value))
      .attr("fill", "black");

    // X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Y axis
    svg.append("g").call(d3.axisLeft(y));
  }, [normalizedData]);

  if (normalizedData.every((d) => d.value === 0)) {
    return (
      <div className="w-full h-full bg-gray-800 rounded-lg p-8 flex flex-col flex-grow items-center justify-center text-white">
        <h2>No data available for analysis</h2>
      </div>
    );
  }

  return (
    <div
      className="w-full h-64 bg-gray-800 rounded-lg p-4 flex flex-col flex-grow overflow-auto"
      style={{ maxHeight: "400px", overflow: "auto" }} // Allow scrolling if needed
    >
      <h2 className="text-white mb-4">Emotion Analysis Results</h2>
      <div className="w-full h-full overflow-x-auto">
        <svg ref={svgRef} className="w-full h-full"></svg>
      </div>
    </div>
  );
};

export default EmotionAnalysis;
