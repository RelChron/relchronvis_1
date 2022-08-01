window.onload =  function () {
    console.log("+++++ on load excel to json ++++++")
    document.getElementById('upload').addEventListener('change', handleFileSelect, false);
};

function ExcelToJSON(){

    this.parseExcel = (file) => {

        const reader = new FileReader();
        //console.log(file)

        reader.onload = function (e) {
            var data = e.target.result;
            try {
                var workbook = XLSX.read(data, {
                                    type: 'binary'
                                });
                // console.log(workbook)
                workbook.SheetNames.forEach( (sheetName)  => {

                    let XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                    let data = XL_row_object;
                    //console.log(data);
                    // reset UI
                    reset(LOCAL_KEY_DYNAMIC);
                    // create model
                    let excelData = data
                    const modelName = file.name + " : " + sheetName;
                    if (excelData[0][0] === "Number of datings") {
                        // special exel format
                        excelData = remapExcelData(excelData)
                    }
                    //console.log("excelData:", excelData)
                    // render form elements
                    renderFormElementsFromData(excelData)
                    // store model
                    saveModel(excelData, LOCAL_KEY_DYNAMIC, modelName)
                    // load model
                    loadModel(LOCAL_KEY_DYNAMIC)
                }) 
            } catch (e) {
                console.log(e)
                if (String(e.message).indexOf("Unsupported file") > -1){
                    alert("Only Excel (xls or xlsx) files are supported")
                }
            }
        };

        reader.onerror = function (e) {
            console.log(e);
        };

        reader.readAsBinaryString(file);
        
    };
};


function remapExcelData(model){
    //console.log("+++++ remap excel data +++++")
    function getIndexByName(name, data) {
        //console.log("+++++ get index by name ++++", name, data )
        for (let [key, value] of Object.entries(data)) {
            if(key === name){
                return value;
            }
        }
        return "unknown";
    }

    function getNameByIndex(index, data) {
        //console.log("+++++ get name by index ++++", index, data )
        for (let [key, value] of Object.entries(data)) {
            if (Number(value) === Number(index)) {
                return key;
            }
        }
        return "";
    }
    
    let data = [];
    const nodes = model.filter((item, index) => index > 0 ? item : false);
    const names = model[0];

    nodes.map( (item,index) => {

        let element = {}

        for (let [key, value] of Object.entries(item)) {
            //console.log("***** ", key, value)
            if(key === ""){
                element.id = Number(value);
            }else if (key === "0"){
                element.relationCount = Number(value)+1
            }else{
                if (isNaN(value)){
                    element.name = key;
                    element[getIndexByName(key, names)] = value;
                }
            }
        }

        element.date = index + 1;
        element.name = getNameByIndex(element.id, names)
        element.definition = "";
        //element.color = "#F66900";

        data.push(element);
    })
    //console.log("rendered:", data)
    return data
}

function handleFileSelect(event){
    //console.log("+++++ handle file select +++++", event)
    var files = event.target.files; // FileList object
    //console.log(files)
    var xl2json = new ExcelToJSON();
        xl2json.parseExcel(files[0]);
}