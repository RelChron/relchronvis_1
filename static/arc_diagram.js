// Draw and manage interactive arc diagram, sidebar and examples
// Based on https://d3-graph-gallery.com/graph/arc_highlight.html

const SVG_WIDTH = document.getElementById("arc-diagram")
    .getBoundingClientRect().width
const SVG_HEIGHT = document.getElementById("arc-diagram")
    .getBoundingClientRect().height

const CIRCLE_RADIUS = 6
// There's some extra margin to account for text with "p"s or "q"s
const MARGIN = {TOP: 0, RIGHT: CIRCLE_RADIUS + 5, BOTTOM: 0,
  LEFT: CIRCLE_RADIUS + 5}

const INNER_HEIGHT = SVG_HEIGHT - MARGIN.TOP - MARGIN.BOTTOM
const GRAPH_BOTTOM_Y = INNER_HEIGHT * 7 / 10

const INNER_WIDTH = SVG_WIDTH - MARGIN.LEFT - MARGIN.RIGHT

let lockOriginNodeId = null

// SVG AND GROUPING ELEMENT SETUP
const svg = d3.select("#arc-diagram")
  .append("svg")
  .attr("xmlns", "http://www.w3.org/2000/svg")
  .attr("xlink", "http://www.w3.org/1999/xlink")
  .attr("width", SVG_WIDTH)
  .attr("height", SVG_HEIGHT)

const diagram = svg.append("g")
  .attr("transform", "translate(" + MARGIN.LEFT + "," + MARGIN.TOP + ")")

// EVERYTHING ELSE GOES IN THIS BRACKET WHICH LOADS DATA
// D3JS basics help: https://youtu.be/TOJ9yjvlapY, https://www.d3indepth.com
// Loading two files: https://stackoverflow.com/questions/70629019
Promise.all([
  d3.json(`/sc_data?lang=${language}`),
  d3.json(`/examples?lang=${language}`),
]).then(function([sc_data, example_data]) {
  // Catch errors
  for (const returnedData of [sc_data, example_data]) {
    if (returnedData.hasOwnProperty("error")) {
      addErrorCard(returnedData["error"])
    }
  }

  let xScale = d3.scaleLinear()
    .domain([1, sc_data.changes.length])
    .range([0, INNER_WIDTH])

  // Fuse relations together for this diagram
  let lastRelation = null
  let processedRelations = []
  for (const relation of sc_data.relations) {
    // Prepare the first item
    if (lastRelation == null) {
      relation.description = [relation.description]
      lastRelation = structuredClone(relation)
      processedRelations.push(relation)
      continue
    }
    // If we find a double
    if (relation.source == lastRelation.source 
        && relation.target == lastRelation.target) {
      // Combine the two relations into one
      relation.type = [lastRelation.type, relation.type]
      relation.description = [lastRelation.description[0], relation.description]
      relation.combined = true
      console.log(relation)
      processedRelations.pop()
      processedRelations.push(relation)
    } else {
      // Else, just adapt the description format so it fits
      relation.description = [relation.description]
      processedRelations.push(relation)
    }
    lastRelation = structuredClone(relation)
  }

  console.log("Here's the processed relations")
  console.log(processedRelations)

  let arcs = diagram
    .append("g")
    .attr("id", "arcs")
    .selectAll("myArcs")
    .data(processedRelations)
    .enter()
		.append("g")
		.classed("arc", true)

	arcs
		.append("path")
		.classed("arc", true)
			.attr("d", function (relation) {
				start = xScale(relation.source)
				end = xScale(relation.target)
				return ["M", start, GRAPH_BOTTOM_Y,
					"A",
					(start - end)/2, ",",
					(start - end)/2, 0, 0, ",",
					start < end ? 1 : 0, end, ",", GRAPH_BOTTOM_Y]
					.join(' ')
			})
		.each(function(d, i) {
			// Get e.g. "feeding" from d.type "F"
			className = getTypeName(d.type)

			// Set up combined arcs for relations with multiple possible relations
			if (d.combined) {
				className = " comb-part-1"
			}

			d3.select(this).classed(className, true)
		})

	arcs
		.filter(relation => relation.combined)
		.each(function(d, i) {
			className0 = getTypeName(d.type[0])
			className1 = getTypeName(d.type[1])
			d3.select(this.firstChild)
				.classed(className0, true)
					.clone(deep=true)
					.classed(className0, false)
					.classed("comb-part-1", false)
					.classed(className1, true)
					.classed("comb-part-2", true)
		})

  arcs
    .filter(arc => arc.confident === false)
    .classed("dashed", true)

  let filterOptionEl = d3.select("#filter-ids")
  let nodes = diagram
    .selectAll("myNodes")
    .data(sc_data.changes)
    .enter()
    .each(sc => {
      if (sc.id) {
        filterOptionEl.append("option").text(sc.id)
      }
    })
    .append("circle")
      .attr("cx", sc => xScale(sc.id))
      .attr("cy", GRAPH_BOTTOM_Y)
      .attr("r", CIRCLE_RADIUS)
      .attr("class", "active")

  let nodeLabels = diagram
    .selectAll("myNodeLabels")
    .data(sc_data.changes)
    .enter()
    .append("text")
      .attr("x", sc => xScale(sc.id))
      // It starts drawing in the middle of the circle
      .attr("y", GRAPH_BOTTOM_Y + CIRCLE_RADIUS + 2)
      .text(sc => `${sc.id} ${sc.name}`)
      .attr("class", "node-label active")
      .attr("transform", sc => {
        return "rotate(90," 
          + xScale(sc.id) + "," 
          + (GRAPH_BOTTOM_Y + CIRCLE_RADIUS + 2) + ")"
          + "translate(0, 6)";
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
  

  let nodeTooltip = d3.select("#node-tooltip")

  // LEGEND BOX (LB)
  // const LEGEND_ITEMS = ["Feeding", "Counterfeeding", "Bleeding", 
  //                    "Counterbleeding", "Manuscript", "Loanword", 
  //                    "Simplicity", "Plausibility", "Naturalness"]

  const LEGEND_ITEMS = ["Feeding", "Counterfeeding", "Bleeding", 
                     "Counterbleeding", "Manuscript", "Loanword", 
                     "Other"]

  const LB_HEIGHT = 15 + (15 * LEGEND_ITEMS.length)
  const LB_WIDTH = 135
  const LB_X = -CIRCLE_RADIUS - 5
  const LB_Y = 40

  let legend = svg
    .append("g")
    .attr("transform", "translate(" + MARGIN.LEFT + "," + MARGIN.TOP + ")")

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
      .style("alignment-baseline", "middle")

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
  nodes
  .on("mouseover", (event, m_node) => {
    let mArcs = arcs
      // If function returns false, element is removed
      .filter(arc => arc.source === m_node.id || arc.target === m_node.id)
      .classed("highlighted", true)

    let mArcsData = mArcs.data()
    
    // Get ids to be highlighted from arc data
    let highlight_ids = new Set(mArcsData.map(arc => [arc.source, arc.target]).flat())
    highlight_ids.add(m_node.id)
    
    // Pass to nodes and nodeLabels
    nodes
      .filter(node => highlight_ids.has(node.id))
      .filter(".active")
      .classed("highlighted", true)

    nodeLabels
      .filter((d, i) => highlight_ids.has(i + 1))
      .filter(".active")
      .classed("highlighted", true)

    // Bring highlighted arcs to front
    arcs
      .filter(arc => (
        arc.source === m_node.id 
        || arc.target === m_node.id
        || arc.source === lockOriginNodeId
        || arc.target === lockOriginNodeId))
      .raise()

    nodeTooltip
      .html(m_node.name)
      .classed("invisible", false)
  })
  .on("mousemove", (event, m_node) => {
    nodeTooltip
      .style("left", event.x + "px")
      .style("top", event.y + 30 + "px")
  })
  .on("mouseout", (event, m_node) => {
    for (const selection of [nodes, nodeLabels, arcs]) {
      selection.classed("highlighted", false)
    }
    nodeTooltip.classed("invisible", true)
    // Bring locked arcs to front
    arcs
      .filter(arc => (
        arc.source === lockOriginNodeId 
        || arc.target === lockOriginNodeId))
      .raise()
  })
  .on("dblclick", function(event, m_node) {
    // Same as mouseover, but we set things to "locked" (or toggle lock off)
    // NB: Selection with "this" only works with non-arrow function def
    let nodeIsOrigin = d3.select(this).classed("lock-origin")
    
    for (const selection of [nodes, nodeLabels, arcs]) {
      selection.classed("locked", false)
      selection.classed("lock-origin", false)
    }

    d3.selectAll(".card").classed("d-none", true)
    d3.select("#explainer-text").classed("d-none", false)
    d3.selectAll(".bg-danger").classed("d-none", false)

    // Reset example chronology
    examples.classed("open", false)
    d3.select("#example-chronology").html("")
    d3.select("#chron-close-btn").classed("invisible", true)

    // If lock origin clicked, just turn everything off. Else, toggle lock on
    // for the appropriate elements (with all the code below)
    if (nodeIsOrigin) {return}

    // Only double-clicking the lock origin should toggle the lock fully off
    d3.select(this).classed("lock-origin", true)
    lockOriginNodeId = d3.select(this).data()[0]["id"]

    let mArcs = arcs
      // If function returns false, element is filtered out of selection
      .filter(arc => arc.source === m_node.id || arc.target === m_node.id)
      .classed("locked", true)

    let mArcsData = mArcs.data()
    
    // Get ids to be highlighted from arc data
    let highlight_ids = new Set(mArcsData.map(arc => [arc.source, arc.target]).flat())
    highlight_ids.add(m_node.id)
    
    // Pass to nodes and nodeLabels
    nodes
      .filter(node => highlight_ids.has(node.id))
      .filter(".active")
      .classed("locked", true)

    nodeLabels
      .filter((d, i) => highlight_ids.has(i + 1))
      .filter(".active")
      .classed("locked", true)

    // Bring highlighted arcs to front
    arcs
      .filter(arc => (
        arc.source === m_node.id 
        || arc.target === m_node.id
        || arc.source === lockOriginNodeId
        || arc.target === lockOriginNodeId))
      .raise()

    d3.select("#sc-card-id").text(m_node.id)
    d3.select("#sc-card-header").text(m_node.name)
    d3.select("#sc-card-body").text(m_node.description)
    d3.select("#sc-card").classed("d-none", false)
    
    d3.select("#explainer-text").classed("d-none", true)

    examples
      .select(function() {return this.parentNode.parentNode})
      .filter((d, i) => d.hasOwnProperty(m_node.id))
      .classed("d-none", false)
  })

  arcs
  .on("click", function(event, m_arc) {
    let arcIsLocked = d3.select(this).classed("locked")
    if (!arcIsLocked) {return}

    let relCardIsOpen = d3.select(this).classed("rel-card-open")
    arcs.classed("rel-card-open", false)
    d3.select("#rel-card").classed("d-none", true)
    d3.select("#second-sc-card").classed("d-none", true)

    // Remove description elements from relation card
    d3.selectAll(".list-group-item").remove()

    if (relCardIsOpen) {return}
    
    let header = `${m_arc.source} before ${m_arc.target} `
    // Type may be more than one
    if (Array.isArray(m_arc.type)) {
      header += `because of ${m_arc.type[0]} / ${m_arc.type[1]}`
    } else {
      header += `because of ${m_arc.type}`
    }
    
    
    // Select source or target change, depending on arc direction
    // -1 because the array is 0-indexed, but IDs are 1-indexed
    secondCardIndex = m_arc.target - 1
    firstCardIndex = Number(d3.select("#sc-card-id").text()) - 1
    if (firstCardIndex === secondCardIndex) {
      secondCardIndex = m_arc.source - 1
    }
    
    d3.select(this).classed("rel-card-open", true)
    relCard = d3.select("#rel-card").classed("d-none", false)
    
    for (const description of m_arc.description) {
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
      .text(sc_data["changes"][secondCardIndex]["description"])
    d3.select("#second-sc-card").classed("d-none", false)

    // Change visibilities and styles depending on confidence
    // Select <li>'s to change their styles as well
    descriptions = d3.selectAll(".list-group-item")
    if (m_arc.confident) {
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
  .on("click", function(event, m_example) {
    idToBold = String(lockOriginNodeId)
    let boldLastThree = false
    let exampleIsOpen = d3.select(this).classed("open")
    examples.classed("open", false)
    // Clear info box, and remember element
    box = d3.select("#example-chronology").html("")
    if (exampleIsOpen) {return}    

    box.append("span")
      .attr("class", "chronology-el")
      // oldestVariety (and newest) is passed into html script tag by flask
      .html(`${oldestVariety} ${m_example[oldestVariety]} `)

    if (Object.keys(m_example)[0] === idToBold) {
      boldLastThree = true
    }

    for (const sc_id in m_example) {
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
        .html(` ${m_example[sc_id]} `)

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
      .html(`${newestVariety} ${m_example[newestVariety]}`)

    offcanvasDrawerObj.hide()
    d3.select(this).classed("open", true)
    d3.select("#chron-close-btn").classed("invisible", false)
  })

  // BUTTONS
  d3.select("#chron-close-btn")
  .on("click", () => {
    examples.classed("open", false)
    d3.select("#example-chronology").html("")
    d3.select("#chron-close-btn").classed("invisible", true)
  })

  d3.select("#drawer-btn")
  .on("click", () => {
    offcanvasDrawerObj.show()
  })

  // SEMANTIC ZOOM BEHAVIOR
  let zoom = d3.zoom()
    // Limit scale and allow pan only inside diagram bounds
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [SVG_WIDTH, SVG_HEIGHT]])

    .on("zoom", zoomEvent => {
      transform = zoomEvent.transform
      let newScale = transform.rescaleX(xScale)

      // Set new x positions from new scale
      nodes.attr("cx", sc => newScale(sc.id))
      nodeLabels
        .attr("x", sc => newScale(sc.id))
        .attr("transform", sc => {
          return "rotate(90," 
            + newScale(sc.id) + "," 
            + (GRAPH_BOTTOM_Y + CIRCLE_RADIUS + 2) + ")"
            + "translate(0, 6)";
        })

      // Redraw arcs based on new scale
      arcs
        .selectAll("path")
        .attr("d", function (relation) {
          // Get previous arc y radius, it stays constant
          const d_string = d3.select(this).attr("d")
          const ry = d_string.split(" ")[6]
          start = newScale(relation.source)
          end = newScale(relation.target)

          // The commas are sacred, do not touch
          return [
            "M",                    // MoveTo 
            start,                  // Starting x
            GRAPH_BOTTOM_Y,         // Starting y
            "A",                    // Elliptical Arc Curve
            (start - end)/2, ",",   // rx
            ry,                     // ry (from above)
            0,                      // angle
            0, ",",                 // large-arc-flag
            start < end ? 1 : 0,    // sweep-flag
            end, ",",               // Finishing x
            GRAPH_BOTTOM_Y          // Finishing y
          ]       
          .join(' ')           
        })
      
      nodeTooltip.classed("invisible", true)
    })
  svg.call(zoom)
    // Prevent default double click zoom
    .on("dblclick.zoom", null)
})

// PNG DOWNLOAD FROM SVG
// Built on http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177
d3.select("#download-btn")
  .on("click", () => {
    let scalingFactor = 2
    // Step 1. Make names full length and adjust svg size
    let longest_sc_name = 0
    nodeLabels = d3.selectAll(".node-label")
      .each(function(sc) {
        let element = d3.select(this)
        element.text(`${sc.id}  ${sc.name}`)
        let elHeight = element.node().getBBox().height
        if (elHeight > longest_sc_name) {
          longest_sc_name = elHeight
        }
      })

    // Adjust svg height for full names
    let full_height = SVG_HEIGHT + longest_sc_name
    svg.attr("height", full_height)
    // svg.attr("height", svg.attr("height") * 2)
    // svg.attr("width", svg.attr("width") * 2)

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

    // Reset the svg on the actual page
    svg.attr("height", SVG_HEIGHT)

    // Step 3. Create SVG string
    let svgString = new XMLSerializer().serializeToString(styledSVG)
    // Fix root link without namespace, then fix Safari NS namespace
    svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink=')
    svgString = svgString.replace(/NS\d+:href/g, 'xlink:href')

    let canvas = document.createElement("canvas")
    let context = canvas.getContext("2d")
    canvas.width = svg.attr("width") * scalingFactor
    canvas.height = full_height * scalingFactor

    // Step 4. Create data url from SVG string
    // unescape() is deprecated but decodeURIComponent causes an "invalid
    // string" error in btoa() which is not trivial to fix.
    let image = new Image()
    image.src = 'data:image/svg+xml;base64,' 
      + btoa(unescape(encodeURIComponent(svgString)))
    image.onload = function() {
      // Step 5. Draw image from url to canvas
      context.clearRect(0, 0, svg.attr("width") * scalingFactor, 
        full_height * scalingFactor)
      context.drawImage(image, 0, 0, svg.attr("width") * scalingFactor, 
        full_height * scalingFactor)
      // Step 6. Download canvas
      // Polyfill from https://github.com/blueimp/JavaScript-Canvas-to-Blob
      canvas.toBlob(function(blob) {
        // Function from https://github.com/eligrey/FileSaver.js/
        saveAs(blob, 'Relative Chronology.png')
      })
    }
  })

let labelsVisible = true

d3.select("#toggle-label-btn")
  .on("click", function(event, button) {
    if (labelsVisible) {
      d3.selectAll(".node-label")
        .each(function() {
          d3.select(this).text("")
        })
      labelsVisible = false
      d3.select(this).text("Show Labels")
    } else {
      d3.selectAll(".node-label")
        .each(function(sc) {
          d3.select(this).text(`${sc.id}  ${sc.name}`)
        })
      labelsVisible = true
      d3.select(this).text("Hide Labels")
    }
  })

d3.select("#apply-btn")
  .on("click", () => {
    // Get form data
    let selectedEls = document.getElementById("filter-ids").selectedOptions
    let selectedIDs = Array.from(selectedEls).map(({ value }) => Number(value))
    let showInArcs = document.getElementById("in-check").checked
    let showOutArcs = document.getElementById("out-check").checked
    let showOnlyConf = document.getElementById("conf-check").checked

    // Set all the elements to unfiltered (inactive) state
    let nodes = d3.selectAll("circle")
      // pe-none is a bootstrap utility that sets {pointer-event: none}
      .classed("pe-none", true)
      .classed("active", false)
    let nodeLabels = d3.selectAll(".node-label")
      .classed("invisible", true)
      .classed("active", false)
    let arcs = d3.selectAll(".arc")
      .classed("invisible", true)

    for (const selection of [nodes, nodeLabels, arcs]) {
      selection.classed("locked", false)
      selection.classed("lock-origin", false)
    }
    d3.selectAll(".card").classed("d-none", true)
    d3.select("#explainer-text").classed("d-none", false)
    d3.selectAll(".bg-danger").classed("d-none", false)

    let filtNodes = nodes
      .filter(sc => selectedIDs.includes(sc.id))
      .classed("pe-none", false)
      .classed("active", true)

    nodeLabels
      .filter(sc => selectedIDs.includes(sc.id))
      .classed("active", true)
      .classed("invisible", false)

    // Find out which nodes get touched by arcs of selected sound changes
    let touchedIDs = new Set()
    filtNodes.each(sc => {
      let filtArcs = arcs
        .filter(arc => (
          (arc.source === sc.id) && showOutArcs
          || (arc.target === sc.id) && showInArcs))
        // If only confidents, filter out the others via data; else no filter
        .filter(rel => showOnlyConf ? rel.confident : true)
        .classed("invisible", false)
    
      let currentTouchedIDs = new Set(filtArcs.data()
        .map(arc => [arc.source, arc.target]).flat())
      touchedIDs = new Set([...touchedIDs, ...currentTouchedIDs])
    })

    nodeLabels
      .filter(sc => touchedIDs.has(sc.id))
      .classed("invisible", false)
    nodes
      .filter(sc => touchedIDs.has(sc.id))
      .classed("pe-none", false)
    
    if (showOnlyConf) {
      arcs.filter(".dashed").classed("invisible", true)
    }
    
  })

d3.select("#reset-btn")
  .on("click", () => {
    let nodes = d3.selectAll("circle")
      // pe = pointer events (bootstrap class)
      .classed("pe-none", false)
      .classed("active", true)
    let nodeLabels = d3.selectAll(".node-label")
      .classed("invisible", false)
      .classed("active", true)
    let arcs = d3.selectAll(".arc")
      .classed("invisible", false)

    for (const selection of [nodes, nodeLabels, arcs]) {
      selection.classed("locked", false)
      selection.classed("lock-origin", false)
    }
    d3.selectAll(".card").classed("d-none", true)
    d3.select("#explainer-text").classed("d-none", false)
    d3.selectAll(".bg-danger").classed("d-none", false)
  })
  