// Draw and manage interactive chord diagram, sidebar and examples
// Based on https://d3-graph-gallery.com/graph/chord_basic.html
// Also based on http://www.redotheweb.com/DependencyWheel/

const language = "Russian"

const OUTER_WIDTH = document.getElementById("chord-diagram")
    .getBoundingClientRect().width
const OUTER_HEIGHT = document.getElementById("chord-diagram")
    .getBoundingClientRect().height

// Arbitrary division
const RADIUS = OUTER_WIDTH / 4
const MARGIN = {
  TOP: OUTER_HEIGHT / 2, 
  RIGHT: OUTER_WIDTH / 2, 
  BOTTOM: OUTER_HEIGHT / 2,
  LEFT: OUTER_WIDTH / 2
}

// For later
// let offcanvasDrawerEl = document.getElementById("offcanvasRight")
// let offcanvasDrawerObj = new bootstrap.Offcanvas(offcanvasDrawerEl)
// let lockOriginNodeId = null

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
  // Set up chord layout, load data
  chord = d3.chord().padAngle(0.02)
  chords = chord(sc_data.matrix)
  
  let ringElements = diagram
    .datum(chords)
    .selectAll("g")
    .data(d => d.groups)
    .enter()
    .append("path")
      .attr("class", "ring-el")
      .attr("d", d3.arc()
        .innerRadius(RADIUS)
        .outerRadius(RADIUS + 10)
      )
  
  // Add the links between groups
  let ribbons = diagram
    .datum(chords)
    .append("g")
    .selectAll("path")
    .data(function(d) { return d; })
    .enter()
    .append("path")
      .attr("class", "ribbon")
      .attr("d", d3.ribbon()
        .radius(RADIUS)
      )

  // Labels displayed outside ring
  let ringLabels = diagram
    .selectAll("ringLabels")
    .data(chords.groups)
    .enter()
    .append("text")
    .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
    .attr("dy", ".35em")
    .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
    .attr("transform", d => {
      return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
        "translate(" + (RADIUS + 20) + ")" +
        (d.angle > Math.PI ? "rotate(180)" : "");
    })
    .style("cursor", "pointer")
    .text(function(d) { return sc_data.sc_names[d.index]; })
})