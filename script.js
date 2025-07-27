const width = 923, height = 650, margin = 50;
let scene = 0;
const svg = d3.select("#viz").append("svg")
  .attr("width", width)
  .attr("height", height);
const description = d3.select("#description");

let datasets = {};
let schoolCountryMap = {};
let countryColorMap = {};

// Colors for countries
const colorPalette = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
  "#a6cee3", "#fb9a99", "#fdbf6f", "#cab2d6", "#ff9896",
  "#fdb462", "#b2df8a", "#fb8072", "#80b1d3", "#fdb462"
];

//parse the data
function parseTimesData(data, year) {
    return data.filter(d => d.year === year)
      .filter(d => +d.world_rank <= 100)  // Limit to top 100
      .sort((a, b) => +a.world_rank - +b.world_rank)  // Sort by rank
      .map(d => ({
        name: d.university_name,
        score: +d.total_score,
        country: d.country,  // Use country column directly from timesData.csv
        rank: +d.world_rank
      }));
  }
  
function parseShanghaiData(data, year) {
    return data.filter(d => d.year === year)
      .filter(d => +d.world_rank <= 100)  // Limit to top 100
      .sort((a, b) => +a.world_rank - +b.world_rank)  // Sort by rank
      .map(d => ({
        name: d.university_name,
        score: +d.total_score,
        country: schoolCountryMap[d.university_name] || "Unknown",
        rank: +d.world_rank
      }));
  }
  

  function parseCWURData(data, year) {
    return data.filter(d => d.year === year)
      .filter(d => +d.world_rank <= 100)  // Limit to top 100
      .sort((a, b) => +a.world_rank - +b.world_rank)  // Sort by rank
      .map(d => ({
        name: d.institution,
        score: +d.score,
        country: d.country,  // Use country column directly from cwurData.csv
        rank: +d.world_rank
      }));
  }
  
//load csv
Promise.all([
  d3.csv("data/timesData.csv"),
  d3.csv("data/shanghaiData.csv"),
  d3.csv("data/cwurData.csv"),
  d3.csv("data/school_and_country_table.csv")
]).then(([timesData, shanghaiData, cwurData, schoolCountryData]) => {
  //  school to country mapping
  schoolCountryData.forEach(d => {
    schoolCountryMap[d.school_name] = d.country;
  });
  
  // country to color mapping
  const countries = [...new Set(schoolCountryData.map(d => d.country))];
  countries.forEach((country, index) => {
    countryColorMap[country] = colorPalette[index % colorPalette.length];
  });
  
  datasets["Times"] = parseTimesData(timesData, "2014");
  datasets["Shanghai"] = parseShanghaiData(shanghaiData, "2014");
  datasets["CWUR"] = parseCWURData(cwurData, "2014");

  renderScene(scene); // this will draw bar chart
});

// Scene rendering controller
function renderScene(index) {
    svg.selectAll("*").remove();
    const keys = ["Times", "Shanghai", "CWUR"];
    const key = keys[index];
    const colorMap = {
      "Times": "#1f77b4",
      "Shanghai": "#1f77b4",
      "CWUR": "#1f77b4"
    };
    const sceneTitles = {
      "Times": "Scene 1: Times Higher Education Ranking (2014)",
      "Shanghai": "Scene 2: Shanghai Ranking (2014)",
      "CWUR": "Scene 3: CWUR Ranking (2014)"
    };
  
    description.text(sceneTitles[key]);
  
      drawBarChart({
    data: datasets[key]
  });
  }
  
// trigger
d3.select("#next").on("click", () => {
  if (scene < 2) scene++;
  renderScene(scene);
});
d3.select("#prev").on("click", () => {
  if (scene > 0) scene--;
  renderScene(scene);
});



//functions

function drawBarChart({ data }) {
  const x = d3.scaleBand()
    .domain(data.map(d => d.name))
    .range([margin, width - margin])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.score)])
    .nice()
    .range([height - margin - 250, margin]);

  // bbars
  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d.name))
    .attr("y", d => y(d.score))
    .attr("width", x.bandwidth())
    .attr("height", d => height - margin - 250 - y(d.score))
    .attr("fill", d => countryColorMap[d.country] || "#cccccc")
    .append("title")
    .text(d => `${d.name}\nRank: #${d.rank}\nCountry: ${d.country}\nScore: ${d.score}`);

  // X axis
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin - 250})`)
    .call(d3.axisBottom(x).tickFormat(d => d.length > 20 ? d.substring(0, 20) + "..." : d))
    .selectAll("text")
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "end")
    .attr("dx", "-0.5em")
    .attr("dy", "-0.5em");

  // Y-axis
  svg.append("g")
    .attr("transform", `translate(${margin}, 0)`)
    .call(d3.axisLeft(y));
    
  // Add dotted line between 15 bar
  const barWidth = x.bandwidth();
  const barSpacing = (width - 2 * margin - data.length * barWidth) / (data.length - 1);
  const lineX = margin + 15 * barWidth + 15 * barSpacing + barWidth / 2;
  
  svg.append("line")
    .attr("x1", lineX)
    .attr("y1", margin)
    .attr("x2", lineX)
    .attr("y2", height - margin - 250)
    .attr("stroke", "#666")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5");
    
  // annotation
  svg.append("text")
    .attr("x", lineX + 10)
    .attr("y", 100)
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .attr("fill", "#666")
    .text("Rankings drop off less significantly after this point");

  // Add horizontal dotted lines for lowest ranking from each system
  const timesLowest = d3.min(datasets["Times"], d => d.score);
  const shanghaiLowest = d3.min(datasets["Shanghai"], d => d.score);
  const cwurLowest = d3.min(datasets["CWUR"], d => d.score);
  
  // Times lowest line (blue)
  const timesLowestY = y(timesLowest);
  svg.append("line")
    .attr("x1", margin)
    .attr("y1", timesLowestY)
    .attr("x2", width - margin)
    .attr("y2", timesLowestY)
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "3,3");
    
  svg.append("text")
    .attr("x", width - margin + 5)
    .attr("y", timesLowestY - 20)
    .attr("font-size", "12px")
    .attr("fill", "#1f77b4")
    .text("Times Lowest");
    
  svg.append("text")
    .attr("x", width - margin + 5)
    .attr("y", timesLowestY - 8)
    .attr("font-size", "12px")
    .attr("fill", "#1f77b4")
    .text(`Ranking: ${timesLowest.toFixed(1)}`);
    
  // Shanghai lowest line (orange)
  const shanghaiLowestY = y(shanghaiLowest);
  svg.append("line")
    .attr("x1", margin)
    .attr("y1", shanghaiLowestY)
    .attr("x2", width - margin)
    .attr("y2", shanghaiLowestY)
    .attr("stroke", "#ff7f0e")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "3,3");
    
  svg.append("text")
    .attr("x", width - margin + 5)
    .attr("y", shanghaiLowestY + 4)
    .attr("font-size", "12px")
    .attr("fill", "#ff7f0e")
    .text("Shanghai Lowest");
    
  svg.append("text")
    .attr("x", width - margin + 5)
    .attr("y", shanghaiLowestY + 16)
    .attr("font-size", "12px")
    .attr("fill", "#ff7f0e")
    .text(`Ranking: ${shanghaiLowest.toFixed(1)}`);
    
  // CWUR lowest line (green)
  const cwurLowestY = y(cwurLowest);
  svg.append("line")
    .attr("x1", margin)
    .attr("y1", cwurLowestY)
    .attr("x2", width - margin)
    .attr("y2", cwurLowestY)
    .attr("stroke", "#2ca02c")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "3,3");
    
  svg.append("text")
    .attr("x", width - margin + 5)
    .attr("y", cwurLowestY + 4)
    .attr("font-size", "12px")
    .attr("fill", "#2ca02c")
    .text("CWUR Lowest");
    
  svg.append("text")
    .attr("x", width - margin + 5)
    .attr("y", cwurLowestY + 16)
    .attr("font-size", "12px")
    .attr("fill", "#2ca02c")
    .text(`Ranking: ${cwurLowest.toFixed(1)}`);

    
  // Add legend at bottom
  const countriesInData = [...new Set(data.map(d => d.country))];
  const legend = svg.append("g")
    .attr("transform", `translate(${margin}, ${height-100})`);
    
  countriesInData.forEach((country, i) => {
    const legendItem = legend.append("g")
      .attr("transform", `translate(${i * 120}, 0)`);
      
    legendItem.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", countryColorMap[country] || "#cccccc");
      
    legendItem.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .attr("font-size", "12px")
      .text(country.length > 15 ? country.substring(0, 15) + "..." : country);
  });
}

