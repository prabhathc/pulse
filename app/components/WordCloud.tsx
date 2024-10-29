import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import cloud from "d3-cloud";

type WordCloudProps = {
  messages: { username: string; content: string; timestamp: number }[];
};

const WordCloud = ({ messages }: WordCloudProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Process the messages to create word frequency
  const wordFrequency = (messages: string[]) => {
    const wordMap: { [word: string]: number } = {};
    messages.forEach((msg) => {
      const words = msg.content.split(/\s+/);
      words.forEach((word) => {
        word = word.toLowerCase().replace(/[^\w\s]/g, ""); // Normalize words
        wordMap[word] = (wordMap[word] || 0) + 1;
      });
    });
    return Object.entries(wordMap).map(([word, frequency]) => ({
      text: word,
      size: frequency * 10, // Adjust size scaling as needed
    }));
  };

  useEffect(() => {
    const words = wordFrequency(messages);
    
    const width = 500;
    const height = 300;

    // Clear any existing SVG elements
    d3.select(svgRef.current).selectAll("*").remove();

    const layout = cloud()
      .size([width, height])
      .words(words)
      .padding(5)
      .rotate(() => ~~(Math.random() * 2) * 90)
      .fontSize((d) => d.size)
      .on("end", (words) => {
        const svg = d3
          .select(svgRef.current)
          .attr("width", width)
          .attr("height", height)
          .append("g")
          .attr("transform", `translate(${width / 2},${height / 2})`);

        svg
          .selectAll("text")
          .data(words)
          .enter()
          .append("text")
          .style("font-size", (d) => `${d.size}px`)
          .style("fill", () => d3.schemeCategory10[Math.floor(Math.random() * 10)])
          .attr("text-anchor", "middle")
          .attr(
            "transform",
            (d) => `translate(${[d.x, d.y]})rotate(${d.rotate})`
          )
          .text((d) => d.text);
      });

    layout.start();
  }, [messages]);

  return <svg ref={svgRef}></svg>;
};

export default WordCloud;
