// Flask passes data into template, which sets the variable

let chart = d3.chart.dependencyWheel();
d3.select('#chart_placeholder')
.datum(data)
.call(chart);