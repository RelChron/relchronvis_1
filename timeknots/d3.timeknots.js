// timeknots representation for the Lautwandel project of Florian Wandl, UZH
// created by Luca Salini, lucaelio.salini@uzh.ch

const getStrokeColor = (currentRelationId, index) => (currentRelationId < index) ? "#9c27b0;" : "#c0782b"
const getStrokeStylePath = (currentRelationId, index) => (currentRelationId < index) ? "fill:none; stroke:#9c27b0; stroke-width:2; opacity:0.4;" : "fill:none; stroke:#c0782b; stroke-width:2; opacity:0.4"
const getStrokeStylePathHover = (currentRelationId, index) => (currentRelationId < index) ? "fill:none; stroke:#9c27b0; stroke-width:4; opacity:1;" : "fill:none; stroke:#c0782b; stroke-width:4; opacity:1;"
const isRelationSecure = (label) => label.charAt(label.length - 1) == "?"


let TimeKnots = {
    zoomIt: function (zoomLevel) {
        //console.log("+++++ on zoom start +++++");
        let svg = d3.selectAll("svg");
        let width = document.getElementById("content-right").getBoundingClientRect().width
        width = window.innerWidth - width;
        let height = document.getElementById("content-right").getBoundingClientRect().height;
        height = height / 2 + document.querySelector("#content-right").getBoundingClientRect().y

        document.getElementById(SVG_ID).setAttribute("width", Math.floor(width));
        document.getElementById(SVG_ID).setAttribute("height", Math.floor(height));

        let zoom = d3.zoom()
            .scaleExtent([0.25, 1.75])
            .on("zoom", zoomed)
            .on("end", onZoomEnd);

        svg.call(zoom);
        svg.on("dragend", function () {
            console.log("dragged")
        })

        function onZoomEnd() {
            //console.log("+++++ on zoom end event +++++")
            triggerMouseenter()
        }

        function triggerMouseenter() {
            //console.log("+++++ dispatch mouseenter to frozen nodes +++++")
            TempFrozenID = FrozenID;
            FrozenID = 0;
            if (document.getElementById(TempFrozenID) !== null) {
                document.getElementById(TempFrozenID).dispatchEvent(new Event("mouseenter"))
            }
            FrozenID = TempFrozenID;
        }

        function transform() {
            let divider = 2.75;
            return d3.zoomIdentity
                .translate(width / divider, height / divider)
                .scale(zoomLevel)
                .translate(-width / divider, -height / divider);
        }

        function zoomed() {

            if (!zoomCurrentTransformation) {
                //console.log("INITIAL ZOOM")
                zoomCurrentTransformation = true;
            }

            let translateX = d3.event.transform.x;
            let translateY = d3.event.transform.y;
            let scale = d3.event.transform.k;
            let offsetHeight = document.getElementById("navbar").getBoundingClientRect().height + document.getElementById("content-right").getBoundingClientRect().x;
            //const nodeLength = (document.querySelectorAll("circle").length + 1);
            //console.log(nodeLength, offsetHeight, document.getElementById("content-right").getBoundingClientRect())
            //console.log(d3.event.transform, zoomCurrentTransformation)

            // recalc position 
            translateX = translateX / 2
            translateY += translateY + offsetHeight;

            if (svg.attr("class") === DEPENDENCY_WEEL_CLASS_NAME) {
                //console.log("+++++ zoomIt dependency weel ++++++")
                let node = document.querySelector("#" + SVG_ID)
                //const WIDTH = node.getBBox().width + IMAGE_MARGIN
                //const HEIGHT = node.getBBox().height + IMAGE_MARGIN
                let ajustWidth = ((node.getBBox().width + node.getBBox().x)) + IMAGE_MARGIN
                let ajustHeight = (node.getBBox().height + IMAGE_MARGIN) / 2
                //console.log(node, node.getBoundingClientRect(), node.getBBox(), ajustWidth, WIDTH)
                translateX += ajustWidth
                translateY += ajustHeight
            }

            if (translateX < 0) {
                //translateX = 0; // stick to left 
            }

            d3.select("g").attr('transform', `scale(${scale}) translate(${translateX}, ${translateY}) `);

            triggerMouseenter()
        };

        svg.transition()
            .delay(10)
            .duration(200)
            //.call(zoom.scaleBy, zoomLevel)
            .call(zoom.transform, transform)
            .on("end", function () {
                //console.log("+++++ on zoom end +++++") 
            });

        // disable doubleclick zoom
        svg.on("dblclick.zoom", null);
    },
    draw: function (id, checks, currentDataModel, options) {

        let cfg = {
            width: options.width,
            height: options.height,
            radius: 15,
            lineWidth: 4,
            color: "#999",
            background: "#FFF",
            dateFormat: "%Y/%m/%d %H:%M:%S",
            horizontalLayout: true,
            showLabels: false,
            labelFormat: "%Y/%m/%d %H:%M:%S",
            addNow: false,
            dateDimension: true,
            maxCount: options.maxCount,
            defaultColor: "#e7ab3c"
        };

        let currentRelationArray = [];

        //default configuration overrid
        if (options != undefined) {
            for (let i in options) {
                cfg[i] = options[i];
            }
        }

        let tip = d3.select("#tooltip1")
        if (document.querySelector("#tooltip1") === null) {
            tip = d3.select(id)
                .append('div')
                .attr("id", "tooltip1")
                .attr('class', "tooltip tooltip1")
        }

        let tip2 = d3.select("#tooltip2")
        if (document.querySelector("#tooltip2") === null) {
            tip2 = d3.select(id)
                .append('div')
                .attr("id", "tooltip2")
                .attr('class', "tooltip tooltip2")
        }

        // REMOVE EXISTING SVG ELEMENT
        if (document.querySelector("svg") !== null) {
            document.querySelector("svg").remove();
        }

        // SVG CONATINER AND ZOOM GROUP
        let svg = d3.select(id)
            .append('svg')
            .attr("id", "svg_timeline")
            .attr("class", "timeknots")
            .append("g")
            .attr("id", "zoom_me");

        // arrow definition
        svg.append("defs")
            .append("marker")
            .attr("id", "head")
            .attr("orient", "auto")
            .attr("markerWidth", 2)
            .attr("markerHeight", 4)
            .attr("refX", 10)
            .attr("refY", 1.5)
            .append("path")
            .attr("d", "M0,0 V4 L2,2 Z");

        //console.log("currentDataModel:",currentDataModel)
        let maxValue = 100;
        let minValue = 1;
        let margin = (d3.max(currentDataModel.map(function (d) { return d.radius })) || cfg.radius) * 1.5 + cfg.lineWidth;
        let step = (cfg.horizontalLayout) ? ((cfg.width - 2 * margin) / (maxValue - minValue)) : ((cfg.height - 2 * margin) / (maxValue - minValue));
        let series = [];
        if (maxValue == minValue) { step = 0; if (cfg.horizontalLayout) { margin = cfg.width / 2 } else { margin = cfg.height / 2 } }

        linePrevious = {
            x1: null,
            x2: null,
            y1: null,
            y2: null
        };

        // LINE
        svg.selectAll("line")
            .data(currentDataModel).enter().append("line")
            .attr("class", "timeline-line")
            .attr("x1", function (d) {
                let ret;
                let datum = (cfg.dateDimension) ? new Date(d.date).getTime() : d.value;
                ret = Math.floor(step * (datum - minValue) + margin + 30);
                return ret
            })
            .attr("x2", function (d) {
                if (linePrevious.x1 != null) {
                    return linePrevious.x1
                }
                let datum = (cfg.dateDimension) ? new Date(d.date).getTime() : d.value;
                let ret = Math.floor(step * (datum - minValue));
                return ret - 10;
                //original:
                //return Math.floor(cfg.width/2)
            })
            .attr("y1", function (d) {
                let ret;
                ret = Math.floor(cfg.height / 4);

                linePrevious.y1 = ret;
                return ret
            })
            .attr("y2", function (d) {
                if (linePrevious.y1 != null) {
                    return linePrevious.y1
                }
                return Math.floor(cfg.height / 4);
            })
            .style("stroke", function (d) {
                if (d.color != undefined) {
                    return d.color
                }
                if (d.series != undefined) {
                    if (series.indexOf(d.series) < 0) {
                        series.push(d.series);
                    }
                    return cfg.seriesColor(series.indexOf(d.series));
                }
                return cfg.color
            })
            .style("stroke-width", cfg.lineWidth)
            .style("opacity", 0.2);

        

        // CIRCLE
        svg.selectAll("circle")
            .data(currentDataModel).enter()
            .append("circle")
            .attr("class", "timeline-event")
            // prevent contextmenu from popping up
            //.attr("oncontextmenu", "return false;")
            .attr("id", (d) => d.id)
            .attr("r", (d) => d.radius !== undefined ? d.radius : cfg.radius)
            .style("stroke", (d) => d.color !== undefined ? d.color : cfg.color)
            .style("stroke-width", (d) => d.lineWidth !== undefined ? d.lineWidth : cfg.lineWidth)
            .style("fill", (d) => d.background !== undefined ? d.background : cfg.background)
            .attr("cy", function (d) {
                if (cfg.horizontalLayout) {
                    return Math.floor(cfg.height / 4)
                }
                let datum = (cfg.dateDimension) ? new Date(d.date).getTime() : d.value;
                return Math.floor(step * (datum - minValue) + margin)
            })
            .attr("cx", function (d) {
                if (cfg.horizontalLayout) {
                    let datum = (cfg.dateDimension) ? new Date(d.date).getTime() : d.value;
                    let x = Math.floor(step * (datum - minValue) + margin);
                    return x;
                }
                return Math.floor(cfg.width)
            })
            .on("mouseenter", function (d) {

                // show tooltips, but only if not frozen
                if (TempFrozenID !== d.id) {
                    tip.html("");
                    tip.append("div").style("float", "left").html((String(d.id) + ": " + ajustName(d.name)));
                    tip.transition()
                        .duration(100)
                        .style("opacity", .8);

                    tip2.html("");
                    tip2.append("div")
                        .style("float", "left");
                    tip2.transition()
                        .duration(100)
                        .style("opacity", 0.9);
                }

                // block non selected wandels
                const currentCircleIsInFilterSelected = checks.only_out_in.find(element => element === d.id);
                if (currentCircleIsInFilterSelected === undefined && (checks.show_in || checks.show_out)){
                    //console.log("prevent to hover")
                    return false;
                }



                // set style for circle on mouseover
                d3.select(this)
                    .style("fill", (d) => d.color !== undefined ? d.color : (d.definition === "") ? "rgba(0, 0, 0, 0.63)" : "#e7ab3c")
                    .transition()
                    .duration(100)
                    .attr("r", (d) => d.radius !== undefined ? Math.floor(d.radius * 1.5) : Math.floor(cfg.radius * 1.5));

                // show examples =========
                var examples = '';
                concat = '';
                counter = 0;
                max = 100;
                if (wandel_examples.length > 0) {
                    // append element or empty it
                    var example_element = document.getElementById("examples")
                    if (example_element) {
                        example_element.innerHTML = ''
                    } else {
                        div = document.createElement("div")
                        div.id = "examples"
                        div.className = "tooltip"
                        document.getElementById("content-right").appendChild(div)
                    }
                    // clear examples list
                    document.getElementById("to_chose").innerHTML = "";
                    root = ''
                    wandel_examples.forEach(element => {
                        for (let [word, wandel_example] of Object.entries(element)) {
                            if (wandel_example[d["id"]] != null) {
                                wandellength = Object.keys(wandel_example).length;
                                examples = examples.concat(concat, '<br/>');
                                counter++;
                                concat = '';
                                btn_id = word; // unique
                                concat_array = [];
                                for (ind = 1; ind < wandellength; ind++) {
                                    if (concat_array.length === 0) {
                                        concat_array.push(['ursl.: ', wandel_example['ursl']])
                                    } else if (concat_array !== [] && wandel_example[ind] != null) {
                                        if (ind === d['id']) {
                                            root = wandel_example[ind]
                                            concat_array.push([ind, wandel_example[ind]])
                                            // append examples to right side
                                            var btn = document.createElement("BUTTON");
                                            btn.innerHTML = word;
                                            btn.id = btn_id;
                                            btn.addEventListener("click",
                                                function show_examples() {
                                                    document.getElementById("examples").innerHTML = this.getAttribute("example");
                                                    document.getElementById("examples").style.opacity = 1;
                                                });
                                            btn.className += "btn btn-default btn-examples"
                                            document.getElementById("to_chose").appendChild(btn)
                                        } else {
                                            concat_array.push([ind, wandel_example[ind]])
                                        }
                                    }
                                }
                                concat_array.push(['> <sub>RUS</sub> ', wandel_example['rus'].slice(5).concat(' / ', word)])
                                if (root) {
                                    concat_string = ''
                                    concat_array.forEach((tuple, index) => {
                                        if (index === 0 && concat_array[index + 1] && concat_array[index + 1][0] === d["id"]) {
                                            // first element and before wandel
                                            concat_string = concat_string.concat(tuple[0], '<b>', tuple[1], '</b>')
                                        } else if (index === 0) {
                                            //first element and not before wandel
                                            concat_string = concat_string.concat(tuple[0], tuple[1])
                                        } else if (index === concat_string.length - 1) {
                                            // last element
                                            concat_string.concat(tuple[0], tuple[1])
                                        } else if (tuple[0] === d["id"]) {
                                            // wandel element
                                            concat_string = concat_string.concat('<b> > <sub>', String(tuple[0]), '</sub> ', tuple[1], '</b>')
                                        } else if (concat_array[index + 1] && concat_array[index + 1][0] === d["id"]) {
                                            // wandel before wandel
                                            concat_string = concat_string.concat(' > <b><sub>', String(tuple[0]), '</sub> ', tuple[1], '</b>')
                                        } else {
                                            // all other wandels
                                            concat_string = concat_string.concat(' > <sub>', String(tuple[0]), '</sub> ', tuple[1])
                                        }
                                    })
                                    document.getElementById(btn_id).setAttribute("example", concat_string)
                                } else {
                                    document.getElementById("to_chose").innerHTML = "Für diesen Wandel sind keine Beispiele vorhanden."
                                }
                            }
                        }
                        if (examples === '') {
                            examples = 'Keine Beispiele für diesen Wandel vorhanden.'
                        }
                        //document.getElementById("examples").innerHTML = examples;
                    });
                }
                const allCircles = document.querySelectorAll("circle");
                // set incoming path and node style (outgouing from hovered)
                currentDataModel.forEach(element => {
                    //console.log(element)
                    for (let [key, value] of Object.entries(element)) {
                        if (!isNaN(Number(key)) && isNaN(value)) {
                            if (Number(key) == Number(d["id"]) && (!checks.show_out || (checks.show_out && checks.show_in))) {
                                //console.log(Number(key) + "===" + Number(d["id"]))
                                const pathId = "p_" + element.id + "_" + d["id"];
                                //console.log(pathId)
                                let path = document.querySelector("#" + pathId);
                                // show tooltip and stroke bold
                                if (path !== null) {
                                    $('#' + pathId).tooltip('show');
                                    path.style.stroke = "#333";
                                    path.style.strokeWidth = "4"
                                    //console.log(document.querySelector('.tooltip').id)
                                }
                                for (let id = 0; id < allCircles.length; id++) {
                                    if (allCircles[id].getAttribute("id") == element.id) {
                                        let circ = allCircles[id];
                                            circ.style.fill = "#009951";

                                        let textId = 'def_' + String(id);
                                        
                                        // make name visible
                                        document.getElementById(textId).style.opacity = 1;
                                        document.getElementById(textId).style.fontWeight = "bold";

                                    }
                                }
                            }
                        }
                    }
                });

                // set outgoing path and node style (incoming to hovered)
                for (let [key, value] of Object.entries(d)) {
                    
                    if (!isNaN(Number(key)) && isNaN(value) && (!checks.show_in  || (checks.show_out && checks.show_in))) {
                        
                        // set vertical text for hovered circle
                        document.getElementById("def_" + (d["id"] - 1)).style.opacity = 1;

                        //console.log("***** ", key, value) 
                        const pathId = "p_" + d["id"] + "_" + key;
                        let path = document.querySelector("#" + pathId);
                        // hide tooltip and stroke boldness
                        if (path !== null) {
                            $('#' + pathId).tooltip('show');
                            path.style.stroke = "#333";
                            path.style.strokeWidth = "4"
                        }

                        // paint circles
                        for (let id = 0; id < allCircles.length; id++) {
                            if (allCircles[id].getAttribute("id") === key) {
                                let circ = allCircles[id];
                                    circ.style.fill = "#99004e";
                                let textId = 'def_' + String(id);
                                //console.log(textId,id,key)
                                    // make name visible
                                document.getElementById(textId).style.opacity = 1;
                                document.getElementById(textId).style.fontWeight = "bold";
                            }
                        }
                    }
                }

                //console.log("mouseenter", getNodesFromCurrentNode(d), d.id)

            })
            .on("mouseout", function (d) {

                const currentCircleIsInFilterSelected = checks.only_out_in.find(element => element === d.id);
                if (currentCircleIsInFilterSelected === undefined && (checks.show_in || checks.show_out)) {
                    //console.log("prevent to mouse out")
                    return false;
                }

                //console.log("++++ circle mouse out +++++",d)
                // hide tooltips
                tip.transition()
                    .duration(100)
                    .style("opacity", 0);

                tip2.transition()
                    .duration(100);

                // check if doubleclick wa son this circle
                if (FrozenID !== d["id"] && !FrozenOthers.includes(d["id"])) {
                    // set style for circle on mouseout
                    d3.select(this)
                        .style("fill", (d) => d.background !== undefined ? d.background : cfg.background)
                        .transition()
                        .duration(100)
                        .attr("r", (d) => d.radius !== undefined ? d.radius : cfg.radius);

                    const allCircles = document.querySelectorAll("circle");
                    // set default incoming path and node style
                    currentDataModel.forEach(element => {
                        //console.log(element)
                        let entriesIn = Object.entries(element);
                        for (let [key, value] of entriesIn) {
                            if (!isNaN(Number(key)) && isNaN(value)) {
                                if (Number(key) == Number(d["id"]) && element.id !== Number(FrozenID) && !FrozenOthers.includes(key)) {
                                    //console.log(Number(key) + "===" + Number(d["id"]))
                                    const pathId = "p_" + element.id + "_" + d["id"];
                                    //console.log(pathId)
                                    let path = document.querySelector("#" + pathId);
                                    //console.log(path, pathId, d)
                                    if (path !== null) {
                                        $('#' + pathId).tooltip('hide');
                                        path.style.stroke = "#c0782b";
                                        path.style.strokeWidth = "2"
                                        //console.log("path", path, pathId, d)
                                    }
                                    for (let id = 0; id < allCircles.length; id++) {
                                        if (allCircles[id].getAttribute("id") == element.id) {
                                            let circ = allCircles[id]
                                            circ.style.fill = "#FFF"

                                            // make name invisible
                                            const currentCircleRelationIsInFilterSelected = currentRelationArray.find(e => e === (element.id));
                                            //console.log("incoming", currentCircleRelationIsInFilterSelected,element.id, currentRelationArray)
                                            if ((!checks.all_names && (!checks.show_out && !checks.show_in)) && currentCircleRelationIsInFilterSelected === undefined) {
                                                document.getElementById('def_' + String(id)).style.opacity = 0;
                                            }
                                            document.getElementById('def_' + String(id)).style.fontWeight = "normal";
                                        }
                                    }
                                }
                                for (let id = 0; id < allCircles.length; id++) {
                                    if (allCircles[id].getAttribute("id") == element.id) {
                                        // make name invisible
                                        const currentCircleRelationIsInFilterSelected = currentRelationArray.find(e => e === (element.id + 1));
                                        //console.log("incoming", currentCircleRelationIsInFilterSelected,element.id+1, currentRelationArray)
                                        if ((!checks.all_names && (!checks.show_out && !checks.show_in)) && currentCircleRelationIsInFilterSelected === true) {
                                            document.getElementById('def_' + String(id)).style.opacity = 0;
                                        }
                                    }
                                }
                            }
                        }
                    });
                    const entriesOut = Object.entries(d);
                    // set outgoing path and node style
                    for (let [key, value] of entriesOut) {
                        if (!isNaN(Number(key)) && isNaN(value) && Number(key) !== Number(FrozenID) && !FrozenOthers.includes(key)) {
                            //console.log("***** ", key, value)
                            const pathId = "p_" + d["id"] + "_" + key;
                            let path = document.querySelector("#" + pathId);
                            //console.log(path);
                            if (path !== null) {
                                $("#" + pathId).tooltip('hide');
                                path.style.stroke = "#c0782b";
                                path.style.strokeWidth = "2"
                            }
                            //console.log("path-id:", pathId, path)
                            for (let id = 1; id < allCircles.length; id++) {
                                if (allCircles[id].getAttribute("id") === key) {
                                    let circ = allCircles[id]
                                    circ.style.fill = "#FFF";

                                    // make name invisible
                                    const currentCircleRelationIsInFilterSelected = currentRelationArray.find(element => element === (id+1));
                                    //console.log("outping", currentCircleRelationIsInFilterSelected, id+1, currentRelationArray)
                                    if ((!checks.all_names && (!checks.show_out || !checks.show_in)) && currentCircleRelationIsInFilterSelected === undefined) {
                                        document.getElementById('def_' + String(id)).style.opacity = 0;
                                    }
                                    document.getElementById('def_' + String(id)).style.fontWeight = "normal";
                                }
                            }
                            if (currentCircleIsInFilterSelected === undefined && (!checks.all_names && !checks.show_out && !checks.show_in)){
                                // hide vertical text for hovered circle
                                document.getElementById('def_' + (d["id"] - 1)).style.opacity = 0;
                            }
                            
                        }
                    }
                }

                //console.log("mouseout FrozenID:", FrozenID)
                if (FrozenID !== null) {
                    if (document.getElementById(FrozenID) !== null) {
                        document.getElementById(FrozenID).dispatchEvent(new Event("mouseenter"));
                    }
                    if (getNodesFromCurrentNode(d).includes(Number(FrozenID - 1))) {
                        //console.log("Frozen id found", FrozenID, d.id);
                        if (document.getElementById(FrozenID) !== null) {
                            document.getElementById(FrozenID).dispatchEvent(new Event("mouseenter"))
                        }
                    }
                }

            })
            // set var to freeze circles
            .on("dblclick", function (d) {

                // block non selected wandels
                const currentCircleIsInFilterSelected = checks.only_out_in.find(element => element === d.id);
                if (currentCircleIsInFilterSelected === undefined && (checks.show_in || checks.show_out)){
                    //console.log("prevent to hover")
                    return false;
                }

                //remove tooltips, since they are moved
                tip.transition()
                    .duration(100)
                    .style("opacity", 0);

                document.querySelector(".tooltip2").classList.remove('tooltip2-active')
                // remove additional info on relation
                if (document.getElementById("relation-info")) {
                    document.getElementById("relation-info").remove()
                }
                if (document.querySelector(".tooltip-replacer")) {
                    let elem = document.querySelector(".tooltip-replacer")
                    elem.parentNode.removeChild(elem)
                }
                // trigger the mouseenter event to refresh elements on zoom and move
                if (FrozenID === Number(d["id"])) {
                    FrozenID = 0;
                    // show tooltip again
                    document.getElementById("tooltip1").style.display = "block"
                } else {
                    if (FrozenID !== null && FrozenID !== 0) {
                        var temp = FrozenID;
                        var tempothers = FrozenOthers;
                        FrozenID = 0;
                        FrozenOthers = []
                        document.getElementById(temp).dispatchEvent(new Event("mouseout"));
                        //tempothernode
                        if (document.getElementById(tempothers) !== null) {
                            document.getElementById(tempothers)[0].dispatchEvent(new Event("mouseout"));
                            FrozenOthers = tempothers
                        }

                    }
                    FrozenID = Number(d["id"]);

                    // replacement of name and definition tooltip
                    var node = document.createElement("div")
                    var newline = document.createElement("br")
                    var bold = document.createElement("b")
                    var name = document.createTextNode(String(d.id).concat(":", d.name))
                    var definition = document.createTextNode(d.definition)
                    node.id = "tooltip-replacer".concat("-", String(d.id))
                    node.className = "tooltip-replacer"
                    bold.appendChild(name)
                    node.appendChild(bold)
                    node.appendChild(newline)
                    node.appendChild(definition)

                    document.getElementById("content-left").appendChild(node)

                    // remove tooltip which is displayed left
                    document.getElementById("tooltip1").style.display = "none"

                }
                let tooltips = document.querySelectorAll(".tooltip.fade.top.in");
                //console.log(tooltips)
                tooltips.forEach(function (currentValue, currentIndex, listObj) {
                    currentValue.setAttribute("onclick", "onToolTipClick('" + currentValue.childNodes[1].innerHTML + "')")
                }
                );

                return false
            })
            // show tooltip2 on cycle click
            .on("click", function (event) {
                let tooltip2 = document.querySelector(".tooltip2");
                let active = false;
                //console.log(event)
                if (event.definition !== "") {
                    active = true;
                    tooltip2.innerHTML = event.definition
                }
                if (!tooltip2.classList.contains("tooltip2-active") && active) {
                    tooltip2.classList.add('tooltip2-active');
                }
            })
            .each(function (elem, index) {

                const currentCircleId = index + 1;
                // show all names of the Wandel at once
                let pattern = "\w+\s+";
                let name = currentDataModel[index].name.replace(pattern);

                // show all names
                let textId = "def_" + String(index);
                let labelId = String(currentCircleId);
                let labelName = (currentCircleId) < 10 ? '0' + String(currentCircleId) : String(currentCircleId);

                svg.append("text")
                    .attr("x", this.getAttribute("cx"))
                    .attr("y", 0)
                    .attr("id", "def_" + String(index))
                    .attr("text-anchor", "middle")
                    .attr("class", "label-vertical ")
                    .text(labelName + ": " + String(name));

                document.getElementById(textId).style.writingMode = "vertical-rl";
                document.getElementById(textId).style.alignItems = "center";
                document.getElementById(textId).style.fontFamily = "Arial, Helvetica, sans-serif";
                document.getElementById(textId).setAttribute("y", - Math.floor(document.getElementById(textId).getBoundingClientRect().y));
                document.getElementById(textId).style.transform = 'translateY(' + Math.floor(document.getElementById(labelId).getBoundingClientRect().y + LABEL_VERTICAL_OFFSET) + 'px)';
                document.getElementById(textId).style.opacity = 0;

                if (checks.all_names) {
                    document.getElementById(textId).style.opacity = 1;
                }
                
                
                const circleLength = svg.selectAll("circle")._groups[0].length;
                //console.log("circle ++++++++++++++++++++++++++++++++++ id:", currentCircleId, circleLength , svg.selectAll("circle")._groups[0].length, svg.selectAll("circle"))
                for (let currentRelationId = 1; currentRelationId <= circleLength; currentRelationId++) {

                    
                    //console.log(currentRelationId, elem, elem[currentRelationId])
                    if (typeof elem[currentRelationId] === "string") {
                        //console.log("circle id:", currentCircleId ,"has relation to id:", currentRelationId, elem[currentRelationId])
                        let top = this.getAttribute("cy");
                        let left = this.getAttribute("cx");
                        let goalleft = document.getElementById(currentRelationId).getAttribute("cx");

                        // remove the unsure relations
                        if (checks.safe === 1 && elem[currentRelationId].substr(-1) == "?") {
                            continue;
                        }
                        // filter selected nodes
                        if (checks.only_out_in.length > 0) {
                            if (checks.show_out && !checks.show_in && !checks.only_out_in.includes(currentCircleId)) {
                                continue;
                            } else if (!checks.show_out && checks.show_in && !checks.only_out_in.includes(currentRelationId)) {
                                continue;
                            } else if (checks.show_out && checks.show_in && !checks.only_out_in.includes(currentRelationId) && !checks.only_out_in.includes(currentCircleId)) {
                                continue;
                            }
                        }

                        if (currentRelationId >= currentCircleId) {
                            top -= 13
                        } else {
                            top -= -13
                        }
                        
                        if ((checks.show_in || checks.show_out) && currentCircleId === (index + 1)) {
                            currentRelationArray.push(currentRelationId)
                            document.getElementById(textId).style.opacity = 1;
                        }

                        // ARC PATH APPEND
                        svg.append("path")
                            .attr("d", ['M', left, top,         // the arc starts at the coordinate x=start, y=height-30 (where the starting node is)
                                'A',                            // This means we're gonna build an elliptical arc
                                (left - goalleft) / 2, ',',       // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
                                (left - goalleft) / 2, 0, 0, ',',
                                1, goalleft, ',', top]          // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
                                .join(' '))
                            .attr("data-middletop", String(parseInt(top) - 30))
                            .attr("data-middleleft", String((parseInt(left) + parseInt(goalleft)) / 2))
                            .attr("style", getStrokeStylePath(currentRelationId, currentCircleId)) //isRelationSecure(elem[currentRelationId]) ? "fill:none;stroke:#DFDFDF;stroke-width:2;opacity:0.8;" : getStrokeStylePath(currentRelationId, currentCircleId))
                            .attr("stroke-dasharray", () => isRelationSecure(elem[currentRelationId]) ? "5,2" : "")
                            //.attr("marker-end", "url(#head)") // add arrow at the end of the path
                            .attr("type", String(elem[currentRelationId]))
                            .attr('data-toggle', "tooltip")
                            .attr("title", currentCircleId + " vor " + currentRelationId + " wegen " + String(elem[currentRelationId]))
                            .attr("goal", currentRelationId)
                            .attr("id", "p_" + (index + 1) + "_" + currentRelationId)
                            .attr("class", "path")
                            .on("mouseenter", function (d) {
                                //console.log("on mouse enter path", currentCircleId, currentRelationId);
                                let goal = this.getAttribute("goal");
                                // type tooltip

                                /*                                let tip_path = d3.select("#tooltip_path")
                                                                if (document.querySelector("#tooltip_path")  === null) {
                                                                    tip = d3.select(id)
                                                                        .append('div')
                                                                        .attr("id", "tooltip_path")
                                                                        .attr('class', "tooltip tooltip1 tooltip_path")
                                
                                                                tip_path.html("");
                                                                tip_path.append("div").style("float", "left").html(currentCircleId + " vor " + goal + " wegen " + String(elem[goal]));
                                                                tip_path.transition()
                                                                    .duration(100)
                                                                    .style("opacity", .99);*/
                                // set path style hover
                                this.setAttribute("style", getStrokeStylePathHover(goal, index + 1))
                            })
                            .on("mouseleave", function () {

                                let goal = this.getAttribute("goal");
                                /*                                tip_path.transition()
                                                                    .duration(100)
                                                                    .style("opacity", 0);*/
                                // set path style
                                this.setAttribute("style", getStrokeStylePath(goal, index + 1));

                                if (FrozenID !== null) {
                                    if (document.getElementById(FrozenID) !== null){
                                       document.getElementById(FrozenID).dispatchEvent(new Event("mouseenter")); 
                                    }
                                }

                            });
                    }
                }
            });
        
        // show all vertical text onfilter
        if ((checks.show_in || checks.show_out) && currentRelationArray.length) {
            currentRelationArray.forEach(function(value){
                let textId = "def_" + (value-1)
                document.getElementById(textId).style.opacity = 1;
            })
        }


        // show tooltip on mousemove
        svg.on("mousemove", function (event) {
                //console.log("+++++ on mousemove SVG +++++");
                // name tip
                setTooltipPosition()
            })
            .on("mouseout", function (event) {
                document.querySelector(".tooltip2").classList.remove('tooltip2-active')

            });

        $("[data-toggle=tooltip]").tooltip({
            title: 'test',
            container: 'body',
            placement: 'auto'
        });

        var setTooltipPosition = function () {
            tipPixels = parseInt(tip.style("height").replace("px", ""));
            tiptop = (tipPixels / 2) * 1.2;

            let tooltipTopPosition = Math.floor(d3.event.pageY - tipPixels - margin + 20 + tiptop);
            let tooltipLeftPosition = Math.floor((d3.event.pageX - document.getElementById("content-right").getBoundingClientRect().x) - parseInt(tip.style("width")) - 5);
            let tooltipLeftPosition2 = Math.floor((d3.event.pageX - document.getElementById("content-right").getBoundingClientRect().x) + 5);

            tip.style("top", (tooltipTopPosition) + "px")
                .style("left", tooltipLeftPosition + "px");

            tip2.style("top", tooltipTopPosition + "px")
                .style("left", tooltipLeftPosition2 + "px")

        };

        var getNodesFromCurrentNode = function (d) {
            //console.log("+++++ getNodesFromCurrentNode +++++", d)
            let result = [];
            if (d === null) {
                return result;
            }
            const allCircles = document.querySelectorAll("circle");
            // set incoming path and node style
            currentDataModel.forEach(element => {
                //console.log(element)
                let entriesIn = Object.entries(element);
                for (let [key, value] of entriesIn) {
                    if (!isNaN(Number(key)) && isNaN(value)) {
                        if (Number(key) == Number(d["id"])) {
                            for (let id = 0; id < allCircles.length; id++) {
                                if (allCircles[id].getAttribute("id") == element.id) {
                                    //console.log("APPEND INCOMING NODE", id)
                                    result.push(id);
                                }
                            }
                        }
                    }
                }
            });
            const entriesOut = Object.entries(d);
            // set outgoing path and node style
            for (let [key, value] of entriesOut) {
                if (!isNaN(Number(key)) && isNaN(value)) {
                    // paint circles
                    for (let id = 0; id < allCircles.length; id++) {
                        if (allCircles[id].getAttribute("id") === key) {
                            //console.log("APPEND OUTGOING NODE", id)
                            result.push(id);
                        }
                    }
                }
            }
            //console.log("node list:", result)
            return result;
        }
    }
};
