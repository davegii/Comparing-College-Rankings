const width = 1000, height = 600, margin = 50;
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
function parseData(data, year) {
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
        country: schoolCountryMap[d.institution] || "Unknown",
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
  
  datasets["Times"] = parseData(timesData, "2014");
  datasets["Shanghai"] = parseData(shanghaiData, "2014");
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
    .range([height - margin, margin]);

  // bbars
  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d.name))
    .attr("y", d => y(d.score))
    .attr("width", x.bandwidth())
    .attr("height", d => height - margin - y(d.score))
    .attr("fill", d => countryColorMap[d.country] || "#cccccc")
    .append("title")
    .text(d => `${d.name}\nRank: #${d.rank}\nCountry: ${d.country}\nScore: ${d.score}`);

  // X axis
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin})`)
    .call(d3.axisBottom(x).tickFormat(d => d.split(" ")[0]))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  // Y-axis
  svg.append("g")
    .attr("transform", `translate(${margin}, 0)`)
    .call(d3.axisLeft(y));
    
  // Add legend at bottom
  const countriesInData = [...new Set(data.map(d => d.country))];
  const legend = svg.append("g")
    .attr("transform", `translate(${margin}, ${height+10})`);
    
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

