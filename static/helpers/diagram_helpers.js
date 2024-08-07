// Helpers and basic functionality taht applies to all diagrams

function addErrorCard(errorText) {
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

function splitChord(chord, howManyChords) {
  outChords = []

  let oldSourceStartAngle = chord.source.startAngle
  let oldSourceEndAngle = chord.source.endAngle
  let oldTargetStartAngle = chord.target.startAngle
  let oldTargetEndAngle = chord.target.endAngle

  let sourceStep = (oldSourceEndAngle - oldSourceStartAngle) / howManyChords
  let targetStep = (oldTargetEndAngle - oldTargetStartAngle) / howManyChords

  for (let i = 0; i < howManyChords; i++) {
    outChord = structuredClone(chord)

    // For example, of original start was 0 and end was 6, and we want to
    // split into 3 new chords, this will result in these pairs of angles: 
    // i=0: (0, 2), i=1: (2, 4), i=2 (4, 6)
    outChord.source.startAngle = oldSourceStartAngle + (sourceStep * i)
    outChord.source.endAngle = oldSourceStartAngle + (sourceStep * (i + 1))

    outChord.target.startAngle = oldTargetStartAngle + (targetStep * i)
    outChord.target.endAngle = oldTargetStartAngle + (targetStep * (i + 1))

    outChord.source.value = 1
    outChord.target.value = 1
    outChord.isNew = true

    outChords.push(outChord)
  }

  return outChords
}

// Display possible errors in left sidebar
if (serverResponse.hasOwnProperty("error")) {
  // the template receives the server response and sets serverResponse
  addErrorCard(serverResponse["error"])
}

// Listen for home button clicks
const homeButton = document.getElementById("home-btn")
homeButton.addEventListener("click", () => window.open("/", "_self"))

// Listen for button clicks to change to chord diagram
const toChordButton = document.getElementById("to-chord-btn")
if (toChordButton) {
  let urlToOpen = "/chord_diagram?lang=" + language
  toChordButton.addEventListener("click", () => window.open(urlToOpen, "_self"))
}

// Listen for button clicks to change to arc diagram
const toArcButton = document.getElementById("to-arc-btn")
if (toArcButton) {
  urlToOpen = "/arc_diagram?lang=" + language
  toArcButton.addEventListener("click", () => window.open(urlToOpen, "_self"))
}

// Prepare hidden drawer element from bootstrap
const offcanvasDrawerEl = document.getElementById("offcanvasRight")
const offcanvasDrawerObj = new bootstrap.Offcanvas(offcanvasDrawerEl)

// Show modal on load
let instructionsGiven = sessionStorage.getItem("instructionsGiven")
if (!instructionsGiven) {
  const modalObj = new bootstrap.Modal("#instructions-modal")
  modalObj.show()
  sessionStorage.setItem("instructionsGiven", true);
}

// Example: take "F", return "feeding"
function getTypeName(code) {
  if (code === "F") {
    typeName = "feeding"
  } else if (code === "CF") {
    typeName = "counterfeeding"
  } else if (code === "B") {
    typeName = "bleeding"
  } else if (code === "CB") {
    typeName = "counterbleeding"
  } else if (code === "A") {
    typeName = "attestation"
  } else if (code === "LW") {
    typeName = "loanword"
  } else if (code === "N") {
    typeName = "naturalness"
  } else if (code === "S") {
    typeName = "simplicity"
  } else if (code === "P") {
    typeName = "plausibility"
  } else {
    typeName = "other"
  }

  return typeName
}

