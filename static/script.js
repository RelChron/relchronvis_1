// Draw interactive arc diagram
// Based on https://d3-graph-gallery.com/graph/arc_highlight.html

const CIRCLE_RADIUS = 6
const DIAG_ASPECT_RATIO = 2.25
const OUTER_WIDTH = document.getElementById("arc_diagram")
  .getBoundingClientRect().width
const OUTER_HEIGHT_UNLABELED = OUTER_WIDTH / DIAG_ASPECT_RATIO + CIRCLE_RADIUS
const LABEL_AREA_HEIGHT = OUTER_HEIGHT_UNLABELED / 3
const OUTER_HEIGHT = OUTER_HEIGHT_UNLABELED + LABEL_AREA_HEIGHT

const MARGIN = {TOP: CIRCLE_RADIUS, RIGHT: CIRCLE_RADIUS, BOTTOM: 0,
  LEFT: CIRCLE_RADIUS}
const INNER_WIDTH = OUTER_WIDTH - MARGIN.LEFT - MARGIN.RIGHT
const INNER_HEIGHT = OUTER_HEIGHT - MARGIN.TOP - MARGIN.BOTTOM
const GRAPH_BOTTOM_Y = INNER_HEIGHT - LABEL_AREA_HEIGHT

// SVG AND GROUPING ELEMENT SETUP
const svg = d3.select("#arc_diagram")
  .append("svg")
    .attr("width", OUTER_WIDTH)
    .attr("height", OUTER_HEIGHT)
  .append("g")
    .attr("transform", "translate(" + MARGIN.LEFT + "," + MARGIN.TOP + ")");

// EVERYTHING ELSE GOES IN THIS BRACKET WHICH LOADS DATA
// D3JS basics help: https://youtu.be/TOJ9yjvlapY, https://www.d3indepth.com
d3.json("/sound_changes").then(function(data) {
  let xScale = d3.scaleLinear()
    .domain([1, data.changes.length])
    .range([0, INNER_WIDTH])

  let arcs = svg
    .selectAll("myArcs")
    .data(data.relations)
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
    .data(data.relations)
    .enter()
    .append("textPath")
      .attr("href", (d, i) => "#arc-" + i)
      .attr("startOffset", "50%")
      .html(relation => relation.d_reason)

  let nodes = svg
    .selectAll("myNodes")
    .data(data.changes)
    .enter()
    .append("circle")
      .attr("cx", sc => xScale(sc.id))
      .attr("cy", GRAPH_BOTTOM_Y)
      .attr("r", CIRCLE_RADIUS)
      .attr("class", "highlighted")

  let nodeLabels = svg
      .selectAll("myNodeLabels")
      .data(data.changes)
      .enter()
      .append("text")
        .attr("x", sc => xScale(sc.id))
        // It starts drawing in the middle of the circle
        .attr("y", GRAPH_BOTTOM_Y + CIRCLE_RADIUS + 2)
        .text(sc => sc.name)
        .attr("class", "node-label")

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
    for (const selection of [nodes, arcs, nodeLabels, nodeTooltip, arcLabels]) {
      selection.classed("highlighted", false)
    }
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
  d3.select('svg').call(zoom);
})
