// Draw interactive arc diagram
// Based on https://d3-graph-gallery.com/graph/arc_highlight.html
const CIRCLE_RADIUS = 6
// Calculated from finished graph
const GRAPH_ASPECT_RATIO = 2.2

// Get current diagram (div) width and size chart and margins accordingly
let curDiagWidth = document
  .getElementById("arc_diagram")
  .getBoundingClientRect()
  .width
let curDiagHeight = curDiagWidth / GRAPH_ASPECT_RATIO + CIRCLE_RADIUS
// Add a third of self for nodeLabels
let labelAreaHeight = curDiagHeight / 3
curDiagHeight = curDiagHeight + labelAreaHeight

const margin = {top: CIRCLE_RADIUS, right: CIRCLE_RADIUS, bottom: 0, left: CIRCLE_RADIUS}
const width = curDiagWidth - margin.left - margin.right
const height = curDiagHeight - margin.top - margin.bottom

// Offset level of nodes by the space needed for nodeLabels
const GRAPH_BOTTOM_Y = height - labelAreaHeight

// Debug
console.log("curDiagWidth:", curDiagWidth)
console.log("curDiagHeight:", curDiagHeight)
console.log("labelAreaHeight:", labelAreaHeight)
console.log("GRAPH_BOTTOM_Y:", GRAPH_BOTTOM_Y)


// Append the svg object to the body of the page
const svg = d3.select("#arc_diagram")
  .append("svg")
    .attr("width", curDiagWidth)
    .attr("height", curDiagHeight)
  // g is a grouping element that inherits properties to children
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.json("/sound_changes").then(function(data) {
  // Scale
  let xScale = d3.scaleLinear()
    .domain([1, data.changes.length])
    .range([0, width])

  // Arcs
  let arcs = svg
    .selectAll("myArcs")
    .data(data.relations)
    .enter()
    .append("path")
      .attr("id", (d, i) => "arc-" + i )
      .attr("d", function (relation) {
        // X position of start node on the X axis
        start = xScale(relation.source)
        // X position of end node
        end = xScale(relation.target)
        // The arc starts at the coordinate 
        // x=start, y=height-30 (where the starting node is)
        // This means we're gonna build an elliptical arc
        return ["M", start, GRAPH_BOTTOM_Y,
          "A",
          // Next 2 lines are the coordinates of the inflexion point.
          // Height of this point is proportional with start - end distance
          (start - end)/2, ",",
          (start - end)/2, 0, 0, ",",
          // We always want the arc on top. So if end is before start, 
          // putting 0 here turn the arc upside down.
          start < end ? 1 : 0, end, ",", GRAPH_BOTTOM_Y]
          .join(' ');
    })

  // Arc Labels
  svg.append("text").attr("id", "arc-labels")

  let arcLabels = d3.select("#arc-labels")
    .selectAll("myArcLabels")
    .data(data.relations)
    .enter()
    .append("textPath")
      .attr("href", (d, i) => "#arc-" + i)
      .attr("startOffset", "50%")
      .html(relation => relation.d_reason)

  // Nodes
  let nodes = svg
    .selectAll("myNodes")
    .data(data.changes)
    .enter()
    .append("circle")
      .attr("cx", sc => xScale(sc.id))
      .attr("cy", GRAPH_BOTTOM_Y)
      .attr("r", CIRCLE_RADIUS)
      .attr("class", "highlighted")

  // Node Labels
  let nodeLabels = svg
      .selectAll("myNodeLabels")
      .data(data.changes)
      .enter()
      .append("text")
        .attr("x", sc => xScale(sc.id))
        // It starts drawing in the middle of the circle
        .attr("y", GRAPH_BOTTOM_Y + CIRCLE_RADIUS + 2)
        .text(sc => sc.name)
        .attr("class", "label")

  // TODO: Make more efficient
  // Inspired by https://stackoverflow.com/a/27723725
  function truncate() {
    let element = d3.select(this)
    let elHeight = element.node().getBBox().height
    let elText = element.text();
    while (elHeight + 10 > labelAreaHeight && elText.length > 0) {
        elText = elText.slice(0, -1);
        element.text(elText + '...');
        elHeight = element.node().getBBox().height;
    }
  }

  nodeLabels.each(truncate)

  let nodeTooltip = d3.select("#node-tooltip")

  // Mouse interactions
  nodes
  .on("mouseover", function(event, m_node){
    nodes.classed("highlighted", false)
    
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
      // Removed (d, i) from input, not sure why it doesn't break stuff?
      .filter(i => highlight_ids.has(i + 1))
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

    nodeTooltip
      .html(m_node.name)
      .classed("highlighted", true)

    arcLabels
      .filter(rel => rel.source === m_node.id || rel.target === m_node.id)
      .classed("highlighted", true)
  })
  .on("mousemove", function(event, m_node){
    nodeTooltip
      .style("left", event.x + "px")
      .style("top", event.y + 30 + "px")
  })
  .on("mouseout", function(){
    nodes.classed("highlighted", true)
    arcs.classed("highlighted", false)
    nodeLabels.classed("highlighted", false)
    nodeTooltip.classed("highlighted", false)
    arcLabels.classed("highlighted", false)
  })

  // Zoom behavior (semantic zoom)
  let zoom = d3.zoom()
    .scaleExtent([1, 10])
    // Allow pan only inside diagram bounds
    .translateExtent([[0, 0], [curDiagWidth, curDiagHeight]])

    // The meat of the zoom behavior
    .on("zoom", zoomEvent => {
      transform = zoomEvent.transform
      let newScale = transform.rescaleX(xScale);

      // Get new x positions from new scale
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
            ry,                     // ry
            0,                      // angle
            0, ",",                 // large-arc-flag
            start < end ? 1 : 0,    // sweep-flag
            end, ",",               // Finishing x
            GRAPH_BOTTOM_Y          // Finishing y
          ]       
          .join(' ');             
        })
      
      // Hide node_tip when zooming
      nodeTooltip.classed("highlighted", false)
    })
  d3.select('svg').call(zoom);
})
