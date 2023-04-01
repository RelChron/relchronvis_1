// Draw and manage interactive chord diagram, sidebar and examples
// Based on https://d3-graph-gallery.com/graph/chord_basic.html
// Also based on http://www.redotheweb.com/DependencyWheel/

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

let translateX = MARGIN.LEFT
let translateY = MARGIN.TOP
let scaleFactor = 1

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
  .attr("transform", `translate(${translateX},${translateY})`)

Promise.all([
  d3.json(`/sound_changes?lang=${language}`),
  d3.json(`/dependency_wheel_old?lang=${language}`),
  d3.json(`/examples?lang=${language}`),
]).then(function([sc_data, matrix, example_data]) {
  // Set up chord layout, load data
  chord = d3.chord().padAngle(0.02)
  chords = chord(matrix)
  
  for (let i = 0; i < chords.length; i++) {
    console.assert((chords[i].source.index + 1 === sc_data.relations[i].source
           && chords[i].target.index + 1 === sc_data.relations[i].target),
           "Copied relation data with different source and target value :(")
    chords[i].type = sc_data.relations[i].type
    chords[i].descr = sc_data.relations[i].descr
  }

  // Debug
  console.log("Here's the chords object")
  console.log(chords)
  console.log("Here's the chords.groups object")
  console.log(chords.groups)
  console.log("Here's the sc_data.relations object with length", sc_data.relations.length)
  console.log(sc_data.relations)

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
      // can I call .each() here or do it on ribbons later?
      .each(function(d, i) {
        className = null
        if (d.type === "F") {
          className = "feeding"
        } else if (d.type === "CF") {
          className = "counterfeeding"
        } else if (d.type === "B") {
          className = "bleeding"
        } else if (d.type === "CB") {
          className = "counterbleeding"
        } else if (d.type === "M") {
          className = "manuscript"
        } else if (d.type === "LW") {
          className = "loanword"
        } else {
          className = "other"
        }

        d3.select(this).classed(className, true)
      })
      // set class to variable base on type
      // can I define a function for that and call .each() or something?

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

  ribbons
    .on("click", function(event, mRibbon) {
      let ribbonIsLocked = d3.select(this).classed("locked")
      if (!ribbonIsLocked) {return}

      let relCardIsOpen = d3.select(this).classed("rel-card-open")
      ribbons.classed("rel-card-open", false)
      d3.select("#rel-card").classed("d-none", true)
      d3.select("#second-sc-card").classed("d-none", true)
    

      // Remove description elements from relation card
      d3.selectAll(".list-group-item").remove()

      if (relCardIsOpen) {return}

      sourceId = mRibbon.source.index+1
      targetId = mRibbon.target.index+1

      let header = `${sourceId} before ${targetId} ` 
      header += `because of ${mRibbon.type}`

      // Select source or target change, depending on arc direction
      // The array is 0-indexed, so no +1 here
      secondCardIndex = mRibbon.target.index
      firstCardIndex = Number(d3.select("#sc-card-id").text()) - 1
      if (firstCardIndex === secondCardIndex) {
        secondCardIndex = mRibbon.source.index
      }

      d3.select(this).classed("rel-card-open", true)
      relCard = d3.select("#rel-card").classed("d-none", false)
      for (const description of mRibbon.descr) {
        d3.select("#rel-card-list")
        .append("li")
          .classed("list-group-item", true)
          .text(description)
      }

      d3.select("#second-sc-card-id")
        .text(sc_data["changes"][secondCardIndex]["id"])
      d3.select("#second-sc-card-header")
        .text(sc_data["changes"][secondCardIndex]["name"])
      d3.select("#second-sc-card-body")
        .text(sc_data["changes"][secondCardIndex]["descr"])
      d3.select("#second-sc-card").classed("d-none", false)

      // Change visibilities and styles depending on confidence
      // Select <li>'s to change their styles as well
      descriptions = d3.selectAll(".list-group-item")
      if (mRibbon.conf) {
        relCard
          .classed("border-primary bg-transparent text-primary", false)
          .classed("text-bg-primary", true)
        header += ":"
        descriptions
          .classed("border-primary bg-transparent text-primary", false)
          .classed("text-bg-primary", true)
      } else {
        relCard
          .classed("border-primary bg-transparent text-primary", true)
          .classed("text-bg-primary", false)
        header += " (uncertain):"
        descriptions
          .classed("border-primary bg-transparent text-primary", true)
          .classed("text-bg-primary", false)
      } 
      d3.select("#rel-card-header").text(header)
    })

  // On example click, if it's already shown ("open"), set "open" to false
  // and clear the example chronology display box. If it wasn't shown yet,
  // fill the box with the chronology of the examples and bold the selected
  // sound change as well as the forms before and after it.
  examples
    .on("click", function(event, mExample) {
      idToBold = String(lockOriginIndex + 1)
      let boldLastThree = false
      let exampleIsOpen = d3.select(this).classed("open")
      examples.classed("open", false)
      // Clear info box, and remember element
      box = d3.select("#example-chronology").html("")
      if (exampleIsOpen) {return}    

      box.append("span")
        .attr("class", "chronology-el")
        // oldestVariety (and newest) is passed into html script tag by flask
        .html(`${oldestVariety} ${mExample[oldestVariety]} `)

      if (Object.keys(mExample)[0] === idToBold) {
        boldLastThree = true
      }

      for (const sc_id in mExample) {
        // Skip strings (converting string with Number() will result in NaN)
        if (isNaN(Number(sc_id))) {continue}

        box.append("span")
          .attr("class", "chronology-el")
          .html(">")
          .append("sub")
            .append("sub")
              .html(sc_id)

        box.append("span")
          .attr("class", "chronology-el")
          .html(` ${mExample[sc_id]} `)

          // Simplify by changing how bolding works for element 0
          if (sc_id === idToBold) {
            boldLastThree = true
          }

          if (boldLastThree === true) {
            cElements = d3.selectAll(".chronology-el")
            nOfElements = cElements.size()

            cElements
              .filter((d, i) => i >= nOfElements - 3)
              .classed("fw-bold", "true")

            boldLastThree = false
          }
      }

      box.append("span")
        .attr("class", "chronology-el")
        .html(">")

      box.append("span")
        .attr("class", "chronology-el")
        .html(`${newestVariety} ${mExample[newestVariety]}`)

      offcanvasDrawerObj.hide()
      d3.select(this).classed("open", true)
      d3.select("#chron-close-btn").classed("invisible", false)
    })

    d3.select("#chron-close-btn")
      .on("click", () => {
        examples.classed("open", false)
        d3.select("#example-chronology").html("")
        d3.select("#chron-close-btn").classed("invisible", true)
      })
    
    // SEMANTIC ZOOM BEHAVIOR
    let zoom = d3.zoom()
      // Limit scale
      .scaleExtent([0.1, 10])

      // Scale radius and apply to elements
      .on("zoom", zoomEvent => {
        let newScaleFactor = zoomEvent.transform.k
        let newRadius = RADIUS * newScaleFactor

        ringElements
          .attr("d", d3.arc()
            .innerRadius(newRadius)
            .outerRadius(newRadius + 20)
          )

        ribbons
          .attr("d", d3.ribbon()
            .radius(newRadius)
          )
      
        ringLabels
          .attr("transform", d => {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
              "translate(" + (newRadius + 30) + ")" +
              (d.angle > Math.PI ? "rotate(180)" : "");
          })
      })
    svg.call(zoom)
      // Prevent default double click zoom
      .on("dblclick.zoom", null)

    // Handles dragging only, and only when <g> elements are clicked
    let drag = d3.drag()
      .on("drag", dragEvent => {
        // let transform = dragEvent.transform
        console.log(dragEvent.dx)
        console.log(dragEvent.dy)
        translateX += dragEvent.dx
        translateY += dragEvent.dy
        diagram
          .attr("transform", `translate(${translateX},${translateY})`)
      })
    diagram.call(drag)
      

})

d3.select("#drawer-btn")
  .on("click", () => {
    offcanvasDrawerObj.show()
  })


