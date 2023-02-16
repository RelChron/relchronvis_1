// Get json data from server and feed into chart
// Documentation see static/d3.dependencyWheel.js

fetch("/dw_data")
.then(response => response.json())
.then(json => {
    console.log("Fetched data:")
    console.log(json)

    let chart = d3.chart.dependencyWheel();
    d3.select('#chart_placeholder')
    .datum(json)
    .call(chart);
});