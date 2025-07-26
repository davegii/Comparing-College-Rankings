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
