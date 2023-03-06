// Draw and manage interactive chord diagram, sidebar and examples
// Based on https://d3-graph-gallery.com/graph/chord_basic.html

const language = "Russian"

const OUTER_WIDTH = document.getElementById("chord-diagram")
    .getBoundingClientRect().width
const OUTER_HEIGHT = document.getElementById("chord-diagram")
    .getBoundingClientRect().height

console.log("Width:" + OUTER_WIDTH)
console.log("Height:" + OUTER_HEIGHT)

// Arbitrary division
const RADIUS = OUTER_WIDTH / 5
// const MARGIN = OUTER_WIDTH / 2
const MARGIN = {
  TOP: OUTER_HEIGHT / 2, 
  RIGHT: OUTER_WIDTH / 2, 
  BOTTOM: OUTER_HEIGHT / 2,
  LEFT: OUTER_WIDTH / 2
}

console.log("Radius:" + RADIUS)
console.log("Margin:" + MARGIN)


let offcanvasDrawerEl = document.getElementById("offcanvasRight")
let offcanvasDrawerObj = new bootstrap.Offcanvas(offcanvasDrawerEl)
let lockOriginNodeId = null

// SVG AND GROUPING ELEMENT SETUP
const svg = d3.select("#chord-diagram")
  .append("svg")
  .attr("xmlns", "http://www.w3.org/2000/svg")
  .attr("xlink", "http://www.w3.org/1999/xlink")
  .attr("width", OUTER_WIDTH)
  .attr("height", OUTER_HEIGHT)

const diagram = svg.append("g")
  .attr("transform", `translate(${MARGIN.LEFT},${MARGIN.TOP})`)

Promise.all([
  d3.json(`/dependency_wheel_old?lang=${language}`),
  d3.json(`/examples?lang=${language}`),
]).then(function([sc_data, example_data]) {
  // Set up chord layout
  chord = d3.chord()
    .padAngle(0.02)

  // Actually load data
  chords = chord(sc_data.matrix)
  
  diagram
    .datum(chords)
    .selectAll("g")
    .data(function(d) { return d.groups; })
    .enter()
    .append("g")
    .append("path")
      // .style("fill", "grey")
      // .style("stroke", "black")
      .attr("class", "ring-el")
      .attr("d", d3.arc()
        .innerRadius(RADIUS)
        .outerRadius(RADIUS + 10)
      )
})