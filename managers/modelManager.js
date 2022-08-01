const loadModel = (key) => {
    //console.log("+++++ load model +++++")
    //console.log("+++++ load model +++++", key)
    FrozenID = null
    $(".tooltip, .fade, .top, .in").remove()
    loadTimeKnots(getDataFilter(), key, maxCount)
    //console.log("+++++ model loaded ++++++")
    if (document.querySelector(".btn-chart") !== null){
        document.querySelector(".btn-chart").innerHTML = "Dependency wheel"
    }
}

const loadTimeKnots = (config, key, maxCount) => {
    //console.log("+++++ loadTimeKnots +++++" , key)
    //console.log(config, key, maxCount)
    let param = getDataFilter();
    if (config != null) {
        param = config
    }
    // get stored data
    let data = JSON.parse(localStorage.getItem(key))

    //console.log("data to load:",data)

    if(data !== null){
        if (key === LOCAL_KEY_DYNAMIC) {
            //console.log(JSON.parse(localStorage.getItem(key)), transformFormDataToJSON())
            const storedData = data;
            const currentData = transformFormDataToJSON()
            //console.log(JSON.stringify(storedData.data) === JSON.stringify(currentData), storedData.name === $('#timeknots-session-name').val())
            //console.log(storedData.name, " === " + $('#timeknots-session-name').val())
            // save model if data has been changed
            if (JSON.stringify(storedData.data) !== JSON.stringify(currentData) || storedData.name !== $('#timeknots-session-name').val()) {
                data = saveModel(currentData, key, $('#timeknots-session-name').val())
            }
        }
        // set UI
        setSetModelMetadataToUI(data)
        /// draw model
        drawModel(param, data.data, maxCount)
        // resize title
        autoExpand(document.querySelector('#timeknots-session-name'))

    }else{
        // get data from form elements
        data = transformFormDataToJSON()
        /// draw model
        drawModel(param, data, data.length)
        // save model 
        saveModel(data, LOCAL_KEY_DYNAMIC)

    }
    // zoom model 
    zoomModel();
}

const drawModel = (config, data, maxCount) => {
    //console.log("+++++ draw timeknots +++++", data)
    TimeKnots.draw("#timeline",
        config,
        data,
        {
            horizontalLayout: true,
            height: MAX_HEIGHT_TIMELINE,
            width: MAX_WIDTH_TIMELINE,
            showLabels: false,
            maxCount: maxCount
        }
    );
}

const zoomModel = (s) => {
    //console.log("+++++ zoom  +++++", s);

    const nodeLength = (document.querySelectorAll("circle").length + 1);
    const timelineWidth = MAX_WIDTH_TIMELINE / maxCount * nodeLength;

    scale = Math.min(window.innerWidth / timelineWidth, window.innerHeight / MAX_HEIGHT_TIMELINE);

    if(!isNaN(s)){
        scale = s
    }

    //console.log(scale, window.innerHeight / MAX_HEIGHT_TIMELINE, window.innerWidth / timelineWidth)

    TimeKnots.zoomIt(scale);
}

const createModel = (data, name) => {
    //console.log("+++++ create model +++++", $('#timeknots-session-name').val(), name)
    let model = {}
        model.name = name === undefined ? $('#timeknots-session-name').val() : name;
        model.data = data
        model.date = new Date().toString()

    setSetModelMetadataToUI(model)

    return model
}

const clearModel = (key) => {
    //console.log("+++++ clear +++++")
    if (confirm("Das Modell zurücksetzen?")) {
        $(".tooltip, .fade, .top, .in").remove()
        $(".tooltip-replacer").remove()
        $(".relation-info").remove()
        reset(key);
        init();
    }
}

const saveModel = (data, key , name) =>{
    //console.log("+++++save model +++++")
    // create model
    const model = createModel(data, name)
    // save to local storage
    localStorage.setItem(key, JSON.stringify(model))
    //console.log("+++++ model saved +++++", JSON.parse(localStorage.getItem(key)))
    return model;
}

const transformFormDataToJSON = () => {
    //console.log("+++++ load and transform data from input fields to JSON +++++");

    let data = [];
    const nodes = $("#form").find(".form-group-node");
    //console.log(nodes)
    nodes.map(i => {
        const currentIndex = i+1
        const node = nodes[i]
        const types = $(node).find('.form-group-type');

        let element = {}
            element.name = $(node).find('input[name="name"]').val();
            element.date = currentIndex;
            element.id = currentIndex;
            element.definition = $(node).find('input[name="definition"]').val();
            /*element.color = "#F66900";
            element.radius = 15;
            element.lineWidth = 4;
            element.background = "white";
            element.horizontalLayout = true;*/

        types.map(j => {
            //console.log("create relation and types")
            const item = types[j];
            const type = $(item).find('input[name="type"]').val();
            const relation = $(item).find('input[name="relation"]').val();
            relation.split(',').map(iii => {
                element[iii] = type;
            })
            //console.log(item, type, relation)
        })
        //console.log(node, element,types)
        data.push(element);
    })
    //console.log(data)
    return data;
}

const ajustName = (name) =>{
    return name !== undefined ? name.replace("Linguistik:", '').replace(/^[ ]/, "").replace("\w+\s+"):""
}

const mergeData = (nodes, names) => {
    //console.log("+++++ merge data +++++")
    let data = [];
    nodes.map((item, index) => {
        let element = {}
            element.name = ajustName(item.name)
            element.date = index + 1;
            element.id = index + 1;
            element.definition = names[index].name;
        //console.log(item, index, types)  
        for (let [key, value] of Object.entries(item)) {
            //console.log("***** ", key, value)
            if (!isNaN(Number(key))) {
                //console.log("JA ist nummer", key)
                if (value !== null) {
                    element[key] = value
                }
            }
        }
        data.push(element);
    })
    //console.log(data)
    return data;
}

const renderFormElementsFromData = (data) => {
    //console.log("+++++ render timeknotes from local data +++++", data);
    if (data !== undefined ) {

        if(typeof data === "string"){
            data = JSON.parse(data)
        }
        //console.log("DATA: ", data)

        // set model name
        $('#timeknots-session-name').val(data.name)

        setSetModelMetadataToUI(data)

        data.map((item, i) => {
            const node = addNode()
            //console.log(node, i, item.date)
            //console.log(item)
            // set node name
            $(node).find('input[name="name"]').val(ajustName(item.name));
            $(node).find('input[name="definition"]').val(item.definition);

            for (let [key, value] of Object.entries(item)) {
                //console.log("***** ", key, value)
                if (!isNaN(Number(key))) {

                    const getCurrentNameElement = (value) => {
                        for (var x = 0; x < $(node).find('input[name="type"]').length; x++) {
                            if (value === $($(node).find('input[name="type"]')[x]).val()) {
                                return $($(node).find('input[name="type"]')[x])[0]
                            }
                        }
                    }

                    const currentTypeId = "#" + $(getCurrentNameElement(value)).parent().parent().attr('id');

                    if ($(currentTypeId).find('input[name="type"]').val() === undefined) {
                        // add new type name element
                        const t = addType(node)
                        // set type name
                        t.find('input[name="type"]').val(value);
                        t.find('input[name="relation"]').val(key);
                    } else {
                        // append value to existing type name element
                        if (item[key] === value) {
                            $(currentTypeId).find('input[name="relation"]').val($(currentTypeId).find('input[name="relation"]').val() + "," + key)
                            //console.log("APPEND to", value, currentTypeId )
                        }
                    }
                }
            }
        })
    }
}

const setSetModelMetadataToUI = (data) => {
    $('#timeknots-session-name').val(data.name)
    if (data.date != "") {
        //<span class=\"meta-name\">" + data.name + "</span> 
        $('#current-timeknot').html("<span class=\"meta-date\">Zuletzt lokal gespeichert am: " + getGermanFormattedDate(data.date) + "</span>")
    }
}

const findKeyByIndex = (item, index) => {
    let result = 0
    Object.keys(item).map((key) => {
        if (!isNaN(Number(key))) {
            if (Number(key) === index) {
                //console.log(Number(key), index, "jetzt eintragen")
                result = 1
            }
        }
    })
    return result
}

const convertDataForDependencyWeel = (d) => {
    let data = {}
        data.packageNames = []
        data.matrix = []
    d.map((item) => {
        //console.log(item, Object.keys(item), d.length )
        data.packageNames.push(item.name)
        let t = []
        for (let index = 0; index < d.length; index++) {
            //console.log(localData.data[index])
            //console.log(findKeyByIndex(item, index+1), index+1)
            t.push(findKeyByIndex(item, index))
        }
        data.matrix.push(t)
    })
    return data;
}

const loadDependencyWeel = () => {
    //console.log("+++++ loadDependencyWeel +++++")
    const localData = JSON.parse(localStorage.getItem(LOCAL_KEY_DYNAMIC))
    //console.log(localData, localData.data)
    const checks = getDataFilter();
    // filter data 
    localData.data.map((elem, index) => {
        const currentCircleId = index+1;
        //console.log(elem, currentCircleId)

        if (checks.safe){
            // delete the object
            Object.keys(elem)
                .filter(key => String(elem[key]).substr(-1) === "?")
                .forEach(key => delete elem[key]);

            // make a copy of the object
            /*const filtered = Object.keys(elem)
            .filter(key => String(elem[key]).substr(-1) === "?")
            .reduce((obj, key) => {
                return {
                    ...obj,
                    [key]: elem[key]
                };
            }, {});
            console.log(filtered)   */
        }

        // filter selected nodes
        if (checks.only_out_in.length > 0 ) {

            if (checks.show_out && !checks.show_in) {
                //console.log("show only out relations", elem)
                Object.keys(elem)
                    .filter(key => !isNaN(key) && !checks.only_out_in.includes(currentCircleId))
                    .forEach(key => delete elem[key]);

            } else if (!checks.show_out && checks.show_in) {
                //console.log("show only in relations", elem, !checks.only_out_in.includes(currentCircleId))
                Object.keys(elem)
                    .filter(key => !isNaN(key) && !checks.only_out_in.includes(Number(key)))
                    .forEach(key => delete elem[key])

            } else if (checks.show_out && checks.show_in) {
                //console.log("show in and out relations", elem)
                Object.keys(elem)
                    .filter(key => !isNaN(key) && !checks.only_out_in.includes(Number(key)) && !checks.only_out_in.includes(currentCircleId))
                    .forEach(key => delete elem[key]);
                    
            }
        }

    })
    //console.log(localData)

    let data = convertDataForDependencyWeel(localData.data)
    //console.log(data)

    var chart = d3.chart.dependencyWheel()
        .width(MAX_WIDTH_TIMELINE/2) // also used for height, since the wheel is in a a square
        .margin(500)   // used to display package names
        .padding(.06) // separating groups in the wheel;

    d3.select('#timeline')
        .datum(data)
        .call(chart);
    // zoom chart
    zoomModel(0.5)

    // set chart toggle button name
    document.querySelector(".btn-chart").innerHTML = "Timeknots"
}

const toggleChart = () => {
    //console.log("+++++ toggle chart +++++")
    if (document.querySelector("#" + SVG_ID).getAttribute("class") === DEPENDENCY_WEEL_CLASS_NAME){
        loadModel(LOCAL_KEY_DYNAMIC)
    } else {
        loadDependencyWeel()
    }
}