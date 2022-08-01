const init = () => {
    //console.log("+++++ init application +++++");
    let data = localStorage.getItem(LOCAL_KEY_DYNAMIC);
    //console.log("data in init(): " + data)
    if (data !== null) {
        //console.log("+++++ load timeknots from local storage", JSON.parse(data))
        // parse data to json object
        data = JSON.parse(data)
        if (data.data.length > 0){
            //console.log("+++++ data exists +++++", data.data.length)
            // set global max count            
            maxCount = data.data.length;
            // render form elements
            renderFormElementsFromData(data.data)
            // create restriction dropdown
            renderRestrictionDropdown("#restriction-selector", data.data.length);
            // set ui metadata
            setSetModelMetadataToUI(data)
        }else{
            // add first node element to form
            addNode();
            // create json from form elements and store it to the local storage
            transformFormDataToJSON()
        }
    } else {
        //console.log("+++++ load empty timeknots")
        // add first node element to form
        addNode();
        // create json from form elements and store it to the local storage
        transformFormDataToJSON()
    }
    // load model on init
    loadModel(LOCAL_KEY_DYNAMIC)
    // add listener 
    registerEventListener();
}

const hoverNode = (element) => {
    const currentId = Number(String(element.id).split('_')[1])
    //console.log("+++++ hovernode: ", element, currentId,$('#'+currentId).attr("style"))
    let currentStyle = $('#'+currentId).attr("style")
    let fillColor = "fill: rgb(255, 255, 255)";
    let hoverColor = "fill: rgba(255, 255, 255, 0.63)"
    if (currentStyle !== undefined && currentStyle.indexOf(fillColor) > -1){
        $('#' + currentId).attr("style", currentStyle.replace(fillColor,hoverColor))
        $('#' + currentId).attr("r", Math.floor(15 * 1.5));
    }else{
        if (currentStyle !== undefined){
            $('#' + currentId).attr("style", currentStyle.replace(hoverColor, fillColor))
            $('#' + currentId).attr("r", Math.floor(15 * 1));
        }
        
    }
}

const addNode = () => {
    //console.log("+++++ add new node +++++")
    const index = ($('.form-group-node').length + 1)
    const templateId = "node_" + index ;
    const tempate = `<div class="form-group-node row " id="` + templateId + `" onmouseover="hoverNode(this)" onmouseout="hoverNode(this)">
                        <div class="row form-group form-group-node-item form-group-node-item-title">
                            <div class="col-md-1 meta-index">`+index+`</div>
                            <div class="col-md-6">
                                <input class="form-control" name="name" placeholder="Name" type="text" required value="` + makeid(10) +`">
                            </div>
                            <div class="col-md-5 align-right">
                                <button class="btn btn-primary" onclick="addNode(); return false;">+ W</button>
                                <button class="btn btn-danger remove" onclick="removeNode(this); return false;">- W</button>
                            </div>
                        </div>
                        <div class="row form-group form-group-node-item">
                            <div class="col-md-10">
                                <input class="form-control" name="definition" placeholder="Definition" type="text" required value="` + makeid(50) +`">
                            </div>
                            <div class="col-md-2"><button class="btn btn-primary add" onclick="addType(this); return false;">+ R</button> </div>
                        </div>
                    </div>`
    $("#form").append(tempate);
    // set dropdown options
    renderRestrictionDropdown("#restriction-selector", $("#form").find(".form-group-node").length);

    return $('#'+templateId)
}

const removeNode = (element) => {
    if ($("#form").find(".form-group-node").length > 1){
        //console.log("+++++ remove node row +++++")
        const node = $(element).parent().parent().parent()[0];
        // remove node
        $(node).remove()
        // rename alle nodes and children id's
        renameNodes();
        // set dropdown options
        renderRestrictionDropdown("#restriction-selector", $("#form").find(".form-group-node").length);
        
        if (document.querySelector("svg") !== null) {
            // reload model after remove node
            //loadModel(LOCAL_KEY_DYNAMIC)
        }

    }else{
        confirm("Sie können den letzen Knoten nicht löschen.")
    }
}

const renameNodes = () => {
    const children = $("#form").find(".form-group-node");
    // rename children id's
    children.map(index => {
        children[index].id = "node_" + (index + 1);
        $(children[index]).find(".meta-index").html((index + 1))
        //console.log("RENAME NODES",children[index], $(children[index]).find(".meta-index"))
        renameTypes(children[index]);
    });
}

const addType = (source) => {
    //console.log("+++++ add new type +++++", source)
    if ($(source).is("button")){
        element = $(source).parent().parent().parent()[0];
    }else{
        element = $(source)[0]
    }
    const templateId = element.id + "_type_" + (element.children.length-1);
    //console.log("type parent", element, element.children.length, templateId)
    const tempate = `<div class="row form-group form-group-type" id="`+ templateId +`">
                        <div class="col-md-3">
                            <input class="form-control" name="type" placeholder="Type" type="text" required value="`+makeid(2)+`">
                        </div>
                        <div class="col-md-7">
                            <input class="form-control" name="relation" placeholder="Relations like 1,2,3,4,5" type="text" required value="`+ randomNumberList()+`">
                        </div>
                        <div class="col-md-1">
                            <button class="btn btn-danger" onclick="removeType(this); return false;">- R</button>
                        </div>
                    </div>`
    $(element).append(tempate);
    //console.log($('#' + templateId), document.querySelector('#' + templateId))
    return $('#'+ templateId);
}

const removeType = (element) => {
    //console.log("+++++ remove type row +++++")
    const type = element.closest(".form-group-type") // $(element).parent().parent()[0];
    const node = element.closest(".form-group-node") //$(type.id).parent().parent().parent()[0];
    //const type =  $(element).parent().parent()[0];
    //const node = $(type.id).parent().parent().parent()[0];
    //console.log(element.closest(".form-group-type"), $(element).parent().parent()[0])
    //console.log(element.closest(".form-group-node"), $(type.id).parent().parent().parent()[0])
    // remove children
    $(type).remove()
    // rename type id's
    renameTypes(node);
}

const renameTypes = (parent) => {
    //console.log("+++++ rename types id +++++", parent)
    //const children = parent.querySelectorAll(".form-group-type")
    const children = $(parent).find(".form-group-type");
    //console.log(children)
    // rename children id's
    children.map(index => {
        children[index].id = parent.id + "_type_" + (index + 1);
        //console.log(children[index])
    });
    
}