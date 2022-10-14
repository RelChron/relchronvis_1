// Draw interactive arc diagram
// Based on https://d3-graph-gallery.com/graph/arc_highlight.html

const CIRCLE_RADIUS = 6
const DIAG_ASPECT_RATIO = 2.25
const OUTER_WIDTH = document.getElementById("arc-diagram")
  .getBoundingClientRect().width
const OUTER_HEIGHT_UNLABELED = OUTER_WIDTH / DIAG_ASPECT_RATIO + CIRCLE_RADIUS
const LABEL_AREA_HEIGHT = OUTER_HEIGHT_UNLABELED / 3
const OUTER_HEIGHT = OUTER_HEIGHT_UNLABELED + LABEL_AREA_HEIGHT

const MARGIN = {TOP: CIRCLE_RADIUS, RIGHT: CIRCLE_RADIUS, BOTTOM: 0,
  LEFT: CIRCLE_RADIUS}
const INNER_WIDTH = OUTER_WIDTH - MARGIN.LEFT - MARGIN.RIGHT
const INNER_HEIGHT = OUTER_HEIGHT - MARGIN.TOP - MARGIN.BOTTOM
const GRAPH_BOTTOM_Y = INNER_HEIGHT - LABEL_AREA_HEIGHT

let offcanvasDrawerEl = document.getElementById("offcanvasRight")
let offcanvasDrawerObj = new bootstrap.Offcanvas(offcanvasDrawerEl)
let lockOriginNodeId = null

// SVG AND GROUPING ELEMENT SETUP
const svg = d3.select("#arc-diagram")
  .append("svg")
  .attr("width", OUTER_WIDTH)
  .attr("height", OUTER_HEIGHT)
    .append("g")
    .attr("transform", "translate(" + MARGIN.LEFT + "," + MARGIN.TOP + ")");

// EVERYTHING ELSE GOES IN THIS BRACKET WHICH LOADS DATA
// D3JS basics help: https://youtu.be/TOJ9yjvlapY, https://www.d3indepth.com
// Loading two files: https://stackoverflow.com/questions/70629019
Promise.all([
  d3.json("/sound_changes"),
  d3.json("/examples")
]).then(function([sc_data, example_data]) {
  let xScale = d3.scaleLinear()
    .domain([1, sc_data.changes.length])
    .range([0, INNER_WIDTH])

  let arcs = svg
    .selectAll("myArcs")
    .data(sc_data.relations)
    .enter()
    .append("path")
      .attr("id", (d, i) => "arc-" + i )
      .attr("d", function (relation) {
        start = xScale(relation.source)
        end = xScale(relation.target)
        return ["M", start, GRAPH_BOTTOM_Y,
          "A",
          (start - end)/2, ",",
          (start - end)/2, 0, 0, ",",
          start < end ? 1 : 0, end, ",", GRAPH_BOTTOM_Y]
          .join(' ');
      })

  svg.append("text").attr("id", "arc-labels")
  let arcLabels = d3.select("#arc-labels")
    .selectAll("myArcLabels")
    .data(sc_data.relations)
    .enter()
    .append("textPath")
      .attr("href", (d, i) => "#arc-" + i)
      .attr("startOffset", "50%")
      .html(relation => relation.d_reason)

  let nodes = svg
    .selectAll("myNodes")
    .data(sc_data.changes)
    .enter()
    .append("circle")
      .attr("cx", sc => xScale(sc.id))
      .attr("cy", GRAPH_BOTTOM_Y)
      .attr("r", CIRCLE_RADIUS)
      .attr("class", "highlighted")

  let nodeLabels = svg
    .selectAll("myNodeLabels")
    .data(sc_data.changes)
    .enter()
    .append("text")
      .attr("x", sc => xScale(sc.id))
      // It starts drawing in the middle of the circle
      .attr("y", GRAPH_BOTTOM_Y + CIRCLE_RADIUS + 2)
      .text(sc => `${sc.id} ${sc.name}`)
      .attr("class", "node-label")

  let examples = d3.select(".offcanvas-body")
    .selectAll("myExampleCards")
    .data(example_data)
    .enter()
    .append("div")
    .attr("class", "card example text-center text-dark bg-light")
      .append("div")
      .attr("class", "card-body")
      .text(data => data["russian"])

  // TODO: Make more efficient
  // Inspired by https://stackoverflow.com/a/27723725
  function truncate() {
    let element = d3.select(this)
    let elHeight = element.node().getBBox().height
    let elText = element.text();
    while (elHeight + 10 > LABEL_AREA_HEIGHT && elText.length > 0) {
        elText = elText.slice(0, -1);
        element.text(elText + '...');
        elHeight = element.node().getBBox().height;
    }
  }

  nodeLabels.each(truncate)

  let nodeTooltip = d3.select("#node-tooltip")

  // MOUSE INTERACTIONS
  nodes
  .on("mouseover", (event, m_node) => {
    let mArcs = arcs
      // If function returns false, element is filtered out of selection
      .filter(arc => arc.source === m_node.id || arc.target === m_node.id)
      .classed("highlighted", true)

    let mArcsData = mArcs.data()
    
    // Get ids to be highlighted from arc data
    let highlight_ids = new Set(mArcsData.map(arc => [arc.source, arc.target]).flat())
    
    // Pass to nodes and nodeLabels
    nodes
      .filter(node => highlight_ids.has(node.id))
      .classed("highlighted", true)

    nodeLabels
      .filter((d, i) => highlight_ids.has(i + 1))
      .classed("highlighted", true)

    // Sort, to draw highlighted arcs on top (z-index doesn't work inside svg)
    // From https://stackoverflow.com/a/13794019
    arcs
      .sort(arc => {
        if (arc.source === m_node.id || arc.target === m_node.id) {
          return 1;   // Bring to top
        } else {
          return -1;  // Send to bottom
        }
      })

    arcLabels
      .filter(rel => rel.source === m_node.id || rel.target === m_node.id)
      .classed("highlighted", true)

    nodeTooltip
      .html(m_node.name)
      .classed("highlighted", true)
  })
  .on("mousemove", (event, m_node) => {
    nodeTooltip
      .style("left", event.x + "px")
      .style("top", event.y + 30 + "px")
  })
  .on("mouseout", () => {
    for (const selection of [nodes, nodeLabels, arcs, arcLabels, nodeTooltip]) {
      selection.classed("highlighted", false)
    }
  })
  .on("dblclick", function(event, m_node) {
    // Same as mouseover, but we set things to "locked" (or toggle lock off)
    // NB: Selection with "this" only works with non-arrow function def
    let nodeIsOrigin = d3.select(this).classed("lock-origin")
    
    for (const selection of [nodes, nodeLabels, arcs, arcLabels]) {
      selection.classed("locked", false)
      selection.classed("lock-origin", false)
    }

    d3.selectAll(".card").classed("highlighted", false)
    d3.selectAll(".example").classed("shown", false)

    // If lock origin clicked, just turn everything off. Else, toggle lock on
    // for the appropriate elements (with all the code below)
    if (nodeIsOrigin) {return}

    // Only double-clicking the lock origin should toggle the lock fully off
    d3.select(this).classed("lock-origin", true)
    lockOriginNodeId = d3.select(this).data()[0]["id"]
    console.log(lockOriginNodeId)

    let mArcs = arcs
      // If function returns false, element is filtered out of selection
      .filter(arc => arc.source === m_node.id || arc.target === m_node.id)
      .classed("locked", true)

    let mArcsData = mArcs.data()
    
    // Get ids to be highlighted from arc data
    let highlight_ids = new Set(mArcsData.map(arc => [arc.source, arc.target]).flat())
    
    // Pass to nodes and nodeLabels
    nodes
      .filter(node => highlight_ids.has(node.id))
      .classed("locked", true)

    nodeLabels
      .filter((d, i) => highlight_ids.has(i + 1))
      .classed("locked", true)

    // Sort, to draw highlighted arcs on top (z-index doesn't work inside svg)
    // From https://stackoverflow.com/a/13794019
    arcs
      .sort(arc => {
        if (arc.source === m_node.id || arc.target === m_node.id) {
          return 1;   // Bring to top
        } else {
          return -1;  // Send to bottom
        }
      })

    arcLabels
      .filter(rel => rel.source === m_node.id || rel.target === m_node.id)
      .classed("locked", true)

    d3.select("#sc-card-id").text(m_node.id)
    d3.select("#sc-card-header").text(m_node.name)
    d3.select("#sc-card-body").text(m_node.descr)
    d3.select("#sc-card").classed("highlighted", true)
    
    offcanvasDrawerObj.show()
    examples
      // Arrow functions don't work when "this" is involved
      .select(function() {return this.parentNode})
      .filter((d, i) => d.hasOwnProperty(m_node.id))
      .classed("shown", true)
  })

  arcLabels
  .on("click", function(event, m_arc) {
    let relCardIsOpen = d3.select(this).classed("rel-card-open")

    arcLabels.classed("rel-card-open", false)
    d3.select("#rel-card").classed("highlighted", false)
    d3.select("#second-sc-card").classed("highlighted", false)

    if (relCardIsOpen) {return}
    
    let header_string = m_arc.source + " vor " + m_arc.target + " wegen " 
    + m_arc.d_reason + ":"
    
    // Select source or target change, depending on arc direction
    // -1 because the array is 0-indexed, but IDs are 1-indexed
    secondCardIndex = m_arc.target - 1
    firstCardIndex = Number(d3.select("#sc-card-id").text()) - 1
    if (firstCardIndex === secondCardIndex) {
      secondCardIndex = m_arc.source - 1
    }
    
    d3.select(this).classed("rel-card-open", true)
    d3.select("#rel-card-header").text(header_string)
    d3.select("#rel-card").classed("highlighted", true)
    d3.select("#second-sc-card-id")
      .text(sc_data["changes"][secondCardIndex]["id"])
    d3.select("#second-sc-card-header")
      .text(sc_data["changes"][secondCardIndex]["name"])
    d3.select("#second-sc-card-body")
      .text(sc_data["changes"][secondCardIndex]["descr"])
    d3.select("#second-sc-card").classed("highlighted", true)
  })

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
      .html(`PSl. ${m_example["proto_slavic"]} `)

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

        // TODO: Simplify by changing how bolding works for element 0
        if (sc_id === idToBold) {
          boldLastThree = true
        }

        if (boldLastThree === true) {
          cElements = d3.selectAll(".chronology-el")
          nOfElements = cElements.size()
          console.log(nOfElements)

          cElements
            .filter((d, i) => i >= nOfElements - 3)
            .classed("highlighted", "true")

          boldLastThree = false
        }
    }

    box.append("span")
      .attr("class", "chronology-el")
      .html(">")

    box.append("span")
      .attr("class", "chronology-el")
      .html(`Modern Russian: ${m_example["russian"]} / ` + 
       `${m_example["russian_alt"]}`)

    offcanvasDrawerObj.hide()
    d3.select(this).classed("open", true)
    d3.select("#chron-close-btn").classed("highlighted", true)
  })

  d3.select("#chron-close-btn")
  .on("click", () => {
    examples.classed("open", false)
    d3.select("#example-chronology").html("")
    // TODO Maybe rename all those "highlighted" properties, might be confusing
    d3.select("#chron-close-btn").classed("highlighted", false)
  })

  // SEMANTIC ZOOM BEHAVIOR
  let zoom = d3.zoom()
    // Limit scale and allow pan only inside diagram bounds
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [OUTER_WIDTH, OUTER_HEIGHT]])

    .on("zoom", zoomEvent => {
      transform = zoomEvent.transform
      let newScale = transform.rescaleX(xScale);

      // Set new x positions from new scale
      nodes.attr("cx", sc => newScale(sc.id))
      nodeLabels.attr("x", sc => newScale(sc.id))

      // Redraw arcs based on new scale
      arcs
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
          .join(' ');             
        })
      
      nodeTooltip.classed("highlighted", false)
    })
  d3.select('svg').call(zoom)
    // Prevent default double click zoom
    .on("dblclick.zoom", null)
})
