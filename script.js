const width = 1000, height = 500, margin = 50;
let scene = 0;
const svg = d3.select("#viz").append("svg")
  .attr("width", width)
  .attr("height", height);
const description = d3.select("#description");

let datasets = {};
//parse the data

function parseData(data, year) {
    return data.filter(d => d.year === year)
      .map(d => ({
        name: d.university_name,
        score: +d.total_score,
      }));
  }
  

  function parseCWURData(data, year) {
    return data.filter(d => d.year === year)
      .map(d => ({
        name: d.institution,
        score: +d.score
      }));
  }
  
//load csv
Promise.all([
  d3.csv("data/timesData.csv"),
  d3.csv("data/shanghaiData.csv"),
  d3.csv("data/cwurData.csv")
]).then(([timesData, shanghaiData, cwurData]) => {
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
      data: datasets[key],
      color: colorMap[key]
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

function drawBarChart({ data, color }) {
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
    .attr("fill", color)
    .append("title")
    .text(d => `${d.name}\nScore: ${d.score}`);

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
}

