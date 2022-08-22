// Draw interactable and zoomable arc diagram
// Based on https://d3-graph-gallery.com/graph/arc_highlight.html

// Get current diagram (div) width and size chart and margins accordingly
let curDiagWidth = document
  .getElementById("arc_diagram")
  .getBoundingClientRect().width
let curDiagHeight = curDiagWidth / 2
const margin = {top: 20, right: 30, bottom: 20, left: 30}
const width = curDiagWidth - margin.left - margin.right
const height = curDiagHeight - margin.top - margin.bottom

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
    .selectAll("myarcs")
    .data(data.relations)
    .enter()
    .append("path")
    .attr("d", function (relation) {
      // X position of start node on the X axis
      start = xScale(relation.source)
      // X position of end node
      end = xScale(relation.target)
      // The arc starts at the coordinate 
      // x=start, y=height-30 (where the starting node is)
      // This means we're gonna build an elliptical arc
      return ["M", start, height-30,
        "A",
        // Next 2 lines are the coordinates of the inflexion point.
        // Height of this point is proportional with start - end distance
        (start - end)/2, ",",
        (start - end)/2, 0, 0, ",",
        // We always want the arc on top. So if end is before start, 
        // putting 0 here turn the arc upside down.
        start < end ? 1 : 0, end, ",", height-30]
        .join(' ');
    })

  // Nodes
  let nodes = svg
    // Make elements called mynodes, this doesn't appear in the final html
    .selectAll("mynodes")
    // Bind this selection to the data (data.nodes)
    .data(data.changes)
    // Create new elements (?) now that we bound data
    // Enter holds info about the "missing elements"
    .enter()
    // Add actual html for each "mynode" element
    .append("circle")
      // Get cx by passing sc.id into the scale function pointScale()
      // I think the node variable holds a node object for each mynode element
      .attr("cx", sc => xScale(sc.id))
      .attr("cy", height-30)
      .attr("r", 8)
      .attr("class", "highlighted")

  // Highlight single node and its arcs on mouseover
  nodes
  .on("mouseover", function(event, node){
    nodes.classed("highlighted", false)
    d3.select(this).classed("highlighted", true)
    arcs
      // If function returns false, element is filtered out of selection
      .filter(arc => arc.source === node.id || arc.target === node.id)
      .classed("highlighted", true)
  })
  .on("mouseout", function(event,d){
    nodes.classed("highlighted", true)
    arcs.classed("highlighted", false)
  })

  // Semantic zoom behavior
  function handleZoom(zoomEvent) {
    transform = zoomEvent.transform
    let newScale = transform.rescaleX(xScale);

    // Get new x positions from new scale
    nodes.attr("cx", sc => newScale(sc.id))

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
          height-30,              // Starting y
          "A",                    // Elliptical Arc Curve
          (start - end)/2, ",",   // rx
          ry,                     // ry
          0,                      // angle
          0, ",",                 // large-arc-flag
          start < end ? 1 : 0,    // sweep-flag
          end, ",",               // Finishing x
          height-30               // Finishing y
        ]       
        .join(' ');             
      })
  }

  // These lines are necessary for zoom to work
  let zoom = d3.zoom().on('zoom', handleZoom);
  d3.select('svg').call(zoom);
})
