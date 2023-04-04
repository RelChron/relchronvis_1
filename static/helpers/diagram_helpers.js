// Helpers and basic functionality taht applies to all diagrams

// Inspired by https://stackoverflow.com/a/27723725
function truncate() {
  let element = d3.select(this)
  let elHeight = element.node().getBBox().height
  let elText = element.text()
  while (elHeight + 10 > LABEL_AREA_HEIGHT && elText.length > 0) {
      elText = elText.slice(0, -1)
      element.text(elText + '...')
      elHeight = element.node().getBBox().height
  }
}

function addErrorCard(errorText) {
  console.log("This is an addErrorCard errorText:")
  console.log(errorText)
  let sidebar = d3.select("#sidebar-contents")
  let errorCard = sidebar
    .append("div")
    .classed("card bg-danger text-white", true)
  
  if (errorText.length === 2) {
    // Standard error with error type and description
    errorCard
    .append("div")
    .classed("card-header", true)
    .text(errorText[0])
  
    errorCard
      .append("div")
      .classed("card-body", true)
      .text(errorText[1])
  } else {
    // This should fire when the error is just a string
    errorCard
      .append("div")
      .classed("card-body", true)
      .text(errorText)
  }
}

// Display possible errors in left sidebar
if (serverResponse.hasOwnProperty("error")) {
  // the template receives the server response and sets serverResponse
  addErrorCard(serverResponse["error"])
}

// Listen for home button clicks
const homeButton = document.getElementById("home-btn")
homeButton.addEventListener("click", () => window.open("/", "_self"))

// Prepare hidden drawer element from bootstrap
let offcanvasDrawerEl = document.getElementById("offcanvasRight")
let offcanvasDrawerObj = new bootstrap.Offcanvas(offcanvasDrawerEl)