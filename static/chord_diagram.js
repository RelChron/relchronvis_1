// Draw and manage interactive chord diagram, sidebar and examples
// Based on https://d3-graph-gallery.com/graph/chord_basic.html

const OUTER_WIDTH = document.getElementById("chord-diagram")
    .getBoundingClientRect().width
const OUTER_HEIGHT = document.getElementById("chord-diagram")
    .getBoundingClientRect().height

console.log("Width:" + OUTER_WIDTH)
console.log("Height:" + OUTER_HEIGHT)

const MARGIN = {TOP: CIRCLE_RADIUS, RIGHT: CIRCLE_RADIUS + 10, BOTTOM: 0,
  LEFT: CIRCLE_RADIUS + 10}
const INNER_WIDTH = OUTER_WIDTH - MARGIN.LEFT - MARGIN.RIGHT
const INNER_HEIGHT = OUTER_HEIGHT - MARGIN.TOP - MARGIN.BOTTOM
const GRAPH_BOTTOM_Y = INNER_HEIGHT - LABEL_AREA_HEIGHT

let offcanvasDrawerEl = document.getElementById("offcanvasRight")
let offcanvasDrawerObj = new bootstrap.Offcanvas(offcanvasDrawerEl)
let lockOriginNodeId = null

// SVG AND GROUPING ELEMENT SETUP
const svg = d3.select("#arc-diagram")
  .append("svg")
  .attr("xmlns", "http://www.w3.org/2000/svg")
  .attr("xlink", "http://www.w3.org/1999/xlink")
  .attr("width", OUTER_WIDTH)
  .attr("height", OUTER_HEIGHT)

const diagram = svg.append("g")
  .attr("transform", "translate(" + MARGIN.LEFT + "," + MARGIN.TOP + ")")