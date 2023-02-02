let data = {
    packageNames: ['Main', 'A', 'B'],
    matrix: [[0, 1, 1], // Main depends on A and B
            [0, 0, 1], // A depends on B
            [0, 0, 0]] // B doesn't depend on A or Main
};

let chart = d3.chart.dependencyWheel();
    d3.select('#chart_placeholder')
    .datum(data)
    .call(chart);
