// Draw and manage interactive chord diagram, sidebar and examples
// Based on https://d3-graph-gallery.com/graph/chord_basic.html
// Also based on http://www.redotheweb.com/DependencyWheel/

// const language = "Russian"

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
let offcanvasDrawerEl = document.getElementById("offcanvasRight")
let offcanvasDrawerObj = new bootstrap.Offcanvas(offcanvasDrawerEl)
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
  d3.json(`/sound_changes?lang=${language}`),
  d3.json(`/dependency_wheel_old?lang=${language}`),
  d3.json(`/examples?lang=${language}`),
]).then(function([sc_data, matrix, example_data]) {
  // Set up chord layout, load data
  chord = d3.chord().padAngle(0.02)
  chords = chord(matrix)
  console.log("Here's the chords object")
  console.log(chords)
  console.log("Here's the chords.groups object")
  console.log(chords.groups)

  let ringElements = diagram
    .selectAll()
    .data(chords.groups)
    .enter()
    .append("path")
      .attr("class", "ring-el")
      .attr("d", d3.arc()
        .innerRadius(RADIUS)
        .outerRadius(RADIUS + 20)
      )

  let ribbons = diagram
    .selectAll()
    .data(chords)
    .enter()
    .append("path")
      .attr("class", "ribbon")
      .attr("d", d3.ribbon()
        .radius(RADIUS)
      )

  // Labels displayed outside ring
  let ringLabels = diagram
    .selectAll()
    .data(chords.groups)
    .enter()
    .append("text")
      .attr("class", "ring-label")
      .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
      .attr("transform", d => {
        return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
          "translate(" + (RADIUS + 30) + ")" +
          (d.angle > Math.PI ? "rotate(180)" : "");
      })
      // TEST
      .text(d => sc_data.changes[d.index].name)

  // Same as in main.js
  let examples = d3.select(".offcanvas-body")
    .selectAll("myExampleCards")
    .data(example_data)
    .enter()
    .append("div")
    .attr("class", "card example text-center text-bg-light d-none")
      .append("div")
      .attr("class", "card-body")
        .append("p")
        .attr("class", "card-text")
        .html(data => data[newestVariety])

  // MOUSE INTERACTIONS
  ringElements
    .on("mouseover", (event, mElement) => {
      let ribbonsToHighlight = ribbons
        .filter(ribbon => (ribbon.source.index === mElement.index
                           || ribbon.target.index === mElement.index))
        .classed("highlighted", true)

      let hlData = ribbonsToHighlight.data()

      let hlIndices = new Set(hlData.map(ribbon => (
        [ribbon.source.index, ribbon.target.index]))
        .flat())

      ringElements
        .filter(element => hlIndices.has(element.index))
        .classed("highlighted", true)

      ringLabels
        .filter(element => hlIndices.has(element.index))
        .classed("highlighted", true)

      // Bring highlighted ribbons to front
      ribbons
        .filter(".highlighted")
        .raise()
    })
    .on("mouseout", (event, mElement) => {
      for (const selection of [ringElements, ringLabels, ribbons]) {
        selection.classed("highlighted", false)
      }
      ribbons
        .filter(".locked")
        .raise()
    })
    .on("dblclick", function(event, mElement) {
      let elemIsOrigin = d3.select(this).classed("lock-origin")

      for (const selection of [ringElements, ringLabels, ribbons]) {
        selection.classed("locked", false)
        selection.classed("lock-origin", false)
      }

      d3.selectAll(".card").classed("d-none", true)
      d3.select("#explainer-text").classed("d-none", false)
      d3.selectAll(".bg-danger").classed("d-none", false)

      // If lock origin clicked, just turn everything off. Else, toggle lock on
      // for the appropriate elements (with all the code below)
      if (elemIsOrigin) {return}

      // Only double-clicking the lock origin should toggle the lock fully off
      d3.select(this).classed("lock-origin", true)
      lockOriginIndex = d3.select(this).data()[0].index

      let ribbonsToHighlight = ribbons
        .filter(ribbon => (ribbon.source.index === mElement.index
                           || ribbon.target.index === mElement.index))
        .classed("locked", true)

      let hlData = ribbonsToHighlight.data()

      let hlIndices = new Set(hlData.map(ribbon => (
        [ribbon.source.index, ribbon.target.index]))
        .flat())

      ringElements
        .filter(element => hlIndices.has(element.index))
        .classed("locked", true)

      ringLabels
        .filter(element => hlIndices.has(element.index))
        .classed("locked", true)

      // Add SC card and display examples
      selected_sc = sc_data.changes[lockOriginIndex]
      d3.select("#sc-card-id").text(selected_sc.id)
      d3.select("#sc-card-header").text(selected_sc.name)
      d3.select("#sc-card-body").text(selected_sc.descr)
      d3.select("#sc-card").classed("d-none", false)
      
      d3.select("#explainer-text").classed("d-none", true)
  
      examples
        .select(function() {return this.parentNode.parentNode})
        .filter((d, i) => d.hasOwnProperty(String(lockOriginIndex + 1)))
        .classed("d-none", false)
    })

    d3.select("#drawer-btn")
    .on("click", () => {
      offcanvasDrawerObj.show()
    })

    



















})