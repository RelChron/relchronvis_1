// Draw and manage interactive chord diagram, sidebar and examples
// Based on https://d3-graph-gallery.com/graph/chord_basic.html
// Also based on http://www.redotheweb.com/DependencyWheel/

const SVG_WIDTH = document.getElementById("chord-diagram")
    .getBoundingClientRect().width
const SVG_HEIGHT = document.getElementById("chord-diagram")
    .getBoundingClientRect().height

// Arbitrary division
const RADIUS = SVG_WIDTH / 4

let translateX = SVG_WIDTH / 2
let translateY = SVG_HEIGHT / 2
let scaleFactor = 1

// SVG AND GROUPING ELEMENT SETUP
const svg = d3.select("#chord-diagram")
  .append("svg")
  .attr("xmlns", "http://www.w3.org/2000/svg")
  .attr("xlink", "http://www.w3.org/1999/xlink")
  .attr("width", SVG_WIDTH)
  .attr("height", SVG_HEIGHT)

const diagram = svg.append("g")
  .attr("transform", `translate(${translateX},${translateY})`)
  .attr("id", "main-grouping-el")

Promise.all([
  d3.json(`/sc_data?lang=${language}`),
  d3.json(`/matrix?lang=${language}`),
  d3.json(`/examples?lang=${language}`),
]).then(function([req_sc_data, req_matrix, req_example_data]) {
  // Check for custom data and load it
  let sc_data = null
  let matrix = null
  let example_data = null
  if (language === "custom") {
    sc_data = JSON.parse(localStorage.getItem("custom_sc_data"))
    matrix = JSON.parse(localStorage.getItem("custom_matrix"))
    let exampleDataDefined = localStorage.getItem("custom_example_data") !== "undefined"
    if (exampleDataDefined) {
      example_data = JSON.parse(localStorage.getItem("custom_example_data"))
    } else {
      example_data = []
      d3.select("#explainer-text").remove()
      d3.select(".offcanvas-body")
        .append("div")
        .attr("role", "alert")
        .classed("alert alert-danger", true)
        .text("It seems like you did not upload custom examples data.")
    }
    oldestVariety = localStorage.getItem("custom_old_var")
    newestVariety = localStorage.getItem("custom_new_var")
  } else {
    sc_data = req_sc_data
    matrix = req_matrix
    example_data = req_example_data
  }

  // Catch errors
  for (const returnedData of [sc_data, example_data, matrix]) {
    if (returnedData.hasOwnProperty("error")) {
      // the template receives the server response and sets serverResponse
      addErrorCard(returnedData["error"])
    }
  }
  
  // Set up chord layout, load data
  chord = d3.chord().padAngle(0.02)
  chords = chord(matrix)

  // Find chords with multiple relation types and split them for each type
  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i];
    if (chord.source.value > 1) {
      newChords = splitChord(chord, chord.source.value)
      chords.splice(i, 1, ...newChords)
    }
  }

  for (let i = 0; i < chords.length; i++) {
    console.assert((chords[i].source.index + 1 === sc_data.relations[i].source
           && chords[i].target.index + 1 === sc_data.relations[i].target),
           "Copied relation data with different source or target value :(",
           chords[i])
    chords[i].type = sc_data.relations[i].type
    chords[i].description = sc_data.relations[i].description
    chords[i].confident = sc_data.relations[i].confident
  }

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
      .each(function(d, i) {
        d3.select(this).classed(getTypeName(d.type), true)
      })

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
      .text(d => {
        // If angle is in first half of circle (i.e. below pi radians), put 
        // the number at the start of the label, otherwise at the end
        if (d.angle < Math.PI) {
          return sc_data.changes[d.index].id + " " + sc_data.changes[d.index].name
        } else {
          return sc_data.changes[d.index].name + " " +  sc_data.changes[d.index].id
        }
      })

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

  const LEGEND_ITEMS = ["Feeding", "Counterfeeding", "Bleeding", 
                     "Counterbleeding", "Attestation", "Loanword", 
                     "Other"]

  const LB_HEIGHT = 15 + (15 * LEGEND_ITEMS.length)
  const LB_WIDTH = 135
  const LB_MARGIN_BOTTOM = 10
  const LB_X = -(SVG_WIDTH / 2)
  const LB_Y = SVG_HEIGHT / 2 - LB_MARGIN_BOTTOM - LB_HEIGHT

  let legend = svg
    .append("g")
    .attr("transform", `translate(${translateX},${translateY})`)

  let legendBox = legend
    .append("rect")
      .attr("class", "legend-box")
      .attr("x", LB_X)
      .attr("y", LB_Y)
      .attr("width", LB_WIDTH)
      .attr("height", LB_HEIGHT)
      .attr("rx", 8)

  let legendList = legend
    .selectAll()
    .data(LEGEND_ITEMS)
    .enter()
    .append("text")
      .attr("class", "legend-text")
      .attr("x", LB_X + 25)
      // Iterate through y-positions, +1 y-offset to align better with circles
      .attr("y", (d,i) => LB_Y + 1 + (i + 1) * 15)
      .text(d => d)
      .attr("text-anchor", "left")

  let legendSwatches = legend
    .selectAll()
    .data(LEGEND_ITEMS)
    .enter()
    .append("circle")
      .attr("cx", LB_X + 15)
      .attr("cy", (d,i) => LB_Y + (i + 1) * 15)
      .attr("r", 5)
      .attr("class", d => "swatch highlighted ".concat(d.toLowerCase()))

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
      hlIndices.add(mElement.index)

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
      hlIndices.add(mElement.index)

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
      d3.select("#sc-card-body").text(selected_sc.description)
      d3.select("#sc-card").classed("d-none", false)
      
      d3.select("#explainer-text").classed("d-none", true)
  
      examples
        .select(function() {return this.parentNode.parentNode})
        .filter((d, i) => d.hasOwnProperty(String(lockOriginIndex + 1)))
        .classed("d-none", false)
    })

    ringLabels
    .on("mouseover", (event, mElement) => {
      let ribbonsToHighlight = ribbons
        .filter(ribbon => (ribbon.source.index === mElement.index
                           || ribbon.target.index === mElement.index))
        .classed("highlighted", true)

      let hlData = ribbonsToHighlight.data()

      let hlIndices = new Set(hlData.map(ribbon => (
        [ribbon.source.index, ribbon.target.index]))
        .flat())
      hlIndices.add(mElement.index)

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
      hlIndices.add(mElement.index)

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
      d3.select("#sc-card-body").text(selected_sc.description)
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
      
      d3.select("#rel-card-list")
        .append("li")
          .classed("list-group-item", true)
          .text(mRibbon.description)

      d3.select("#second-sc-card-id")
        .text(sc_data["changes"][secondCardIndex]["id"])
      d3.select("#second-sc-card-header")
        .text(sc_data["changes"][secondCardIndex]["name"])
      d3.select("#second-sc-card-body")
        .text(sc_data["changes"][secondCardIndex]["description"])
      d3.select("#second-sc-card").classed("d-none", false)

      // Change visibilities and styles depending on confidence
      // Select <li>'s to change their styles as well
      descriptions = d3.selectAll(".list-group-item")
      if (mRibbon.confident) {
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
      // Limit how far in and out you can zoom
      .scaleExtent([0.1, 10])

      // Scale radius based on zoom factor and apply to elements
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
        translateX += dragEvent.dx
        translateY += dragEvent.dy
        diagram
          .attr("transform", `translate(${translateX},${translateY})`)
      })

    diagram.call(drag)

  // PNG DOWNLOAD FROM SVG
  // Built on http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177
  d3.select("#download-btn")
    .on("click", () => {
      // Scaling for higher resolution
      let scalingFactor = 2
      // Padding around size of <g>, because we center the circle, which means
      // some labels get cut off, because they're likely not symmetrically long
      let DL_IMG_PADDING = 600

      // Step 1. Adjust svg size according to longest label
      gRect = document.getElementById("main-grouping-el").getBoundingClientRect()
      gHeight = gRect.height + DL_IMG_PADDING
      gWidth = gRect.width + DL_IMG_PADDING
      svg
        .attr("height", gHeight)
        .attr("width", gWidth)

      // "Drag" the diagram to the right spot for drawing
      const oldTranslate = diagram.attr("transform")
      const oldTranslateX = translateX
      const oldTranslateY = translateY
      translateX = gWidth / 2
      translateY = gHeight / 2
      diagram.attr("transform", `translate(${translateX},${translateY})`)

      // Step 2. Extract external CSS styles
      // From https://stackoverflow.com/a/31949487
      // let styleDefs = "svg {background-color: white; transform: scale(2);}"
      let styleDefs = "svg {background-color: white}"
      let sheets = document.styleSheets
      for (const sheet of sheets) {
        let rules = sheet.cssRules
        for (const rule of rules) {
          if (rule.style) {
            styleDefs += rule.cssText
          }
        }
      }

      let styleEl = document.createElement('style')
      styleEl.setAttribute('type', 'text/css')
      styleEl.innerHTML = styleDefs;

      let defs = document.createElement('defs')
      defs.appendChild(styleEl)
      styledSVG = svg.node().cloneNode(deep=true)
      styledSVG.insertBefore(defs, styledSVG.firstChild)

      // Step 3. Create SVG string
      let svgString = new XMLSerializer().serializeToString(styledSVG)
      // Fix root link without namespace, then fix Safari NS namespace
      svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink=')
      svgString = svgString.replace(/NS\d+:href/g, 'xlink:href')

      let canvas = document.createElement("canvas")
      let context = canvas.getContext("2d")
      canvas.width = gWidth * scalingFactor
      canvas.height = gHeight * scalingFactor

      // Step 4. Create data url from SVG string
      // unescape() is deprecated but decodeURIComponent causes an "invalid
      // string" error in btoa() which is not trivial to fix.
      let image = new Image()
      image.src = 'data:image/svg+xml;base64,' 
        + btoa(unescape(encodeURIComponent(svgString)))
      image.onload = function() {
        // Step 5. Draw image from url to canvas
        // context.clearRect(0, 0, gWidth * scalingFactor, 
        //   gHeight * scalingFactor)
        context.drawImage(image, 0, 0, gWidth * scalingFactor, 
          gHeight * scalingFactor)
        // Step 6. Download canvas
        // Polyfill from https://github.com/blueimp/JavaScript-Canvas-to-Blob
        canvas.toBlob(function(blob) {
          // Function from https://github.com/eligrey/FileSaver.js/
          saveAs(blob, 'Relative Chronology.png')
        })
      }
      // Step 7. Reset SVG size and diagram position
      svg
        .attr("height", SVG_HEIGHT)
        .attr("width", SVG_WIDTH)

      diagram.attr("transform", oldTranslate)
      translateX = oldTranslateX
      translateY = oldTranslateY
    })
})

d3.select("#drawer-btn")
  .on("click", () => {
    offcanvasDrawerObj.show()
  })
