const MOCKUP_DATA = false;
const MAX_WIDTH_TIMELINE = 3840;
const MAX_HEIGHT_TIMELINE = 2160;
const LABEL_VERTICAL_OFFSET = 50;
const IMAGE_MARGIN = 100;
const HEADER_HEIGHT = () => (document.getElementById('content-header').getBoundingClientRect() != undefined) ? Math.floor(document.getElementById('content-header').getBoundingClientRect().height + document.getElementById('navbar').getBoundingClientRect().height + 20) : 50
const ZOOM_ME_ID = "zoom_me";
const SVG_ID = "svg_timeline";
const CONTENT_LEFT_ID = "content-left";
const CONTENT_RIGHT_ID = "content-right";
const LOCAL_KEY_STATIC = "timeknots-static";
const LOCAL_KEY_DYNAMIC = "timeknots-dynamic";
const DEPENDENCY_WEEL_CLASS_NAME = "dependency-wheel";

let FrozenID = null;
let TempFrozenID = null;
let FrozenOthers = [];

let maxCount = 72;
let resizeTimer = 0;
let selectBox = null;
let zoomCurrentTransformation = false;
// let storage = window.localStorage;

window.onload = () => {
    //console.log("+++++ on load +++++")
    if (typeof init === "function"){
        init();
    }
};

window.onresize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout( () => {
        //console.log("+++++ on resize end +++++");
        const filename = location.href.substring(location.href.lastIndexOf('/') + 1);
        let key = null;
        if(filename === "index.html" || filename === ""){
            key = LOCAL_KEY_STATIC
        }else if(filename === "generator.html"){
            key = LOCAL_KEY_DYNAMIC
        }
        //console.log(key)
        if(key !== null)
        {
            if (document.querySelector("#" + SVG_ID).getAttribute("class") === DEPENDENCY_WEEL_CLASS_NAME) {
                loadDependencyWeel()
            } else {
                loadModel(key)
            }
        }
        zoomCurrentTransformation = false;
    }, 250);
};

const reset = (key) => {
    // delete item from local storage
    if (localStorage.getItem(key) !== undefined) {
        localStorage.removeItem(key)
    }
    // clear
    $("#form").empty();
    $('.restriction-selector').empty();
    $('#timeknots-session-name').val("");
    // remove current timeline
    if (document.querySelector("svg") !== null){
        document.querySelector("svg").remove();
    }
};

const registerEventListener = () => {
    //console.log("+++++ register event listeners +++++")
    // upload field
    if (document.querySelector('#upload') !== null){
        //console.log("register upload")
        document.querySelector('#upload').addEventListener('change', handleFileSelect, false);
    }
    // model name field
    if (document.querySelector('#timeknots-session-name') !== null){
        //console.log("register title")
        document.addEventListener('input', function (event) {
            //console.log(event.target)
            if (event.target.tagName.toLowerCase() !== 'textarea') return;
            autoExpand(event.target);
        }, false);
    }
    // node filter dropdown
    if (document.querySelector(".restriction-selector") !== null){
        //console.log("register dropdown")
        document.querySelector(".restriction-selector").addEventListener("change", function (event) {
            //console.log(event.target.value);
            document.querySelector("#show_in").removeAttribute("disabled")
            document.querySelector("#show_out").removeAttribute("disabled")
        });
    }
};

const renderRestrictionDropdown = (parentSelector, length) => {
    //console.log("+++++ renderRestrictionDropdown +++++", length)
    //console.log(length, parentSelector)
    let parent = document.querySelector(parentSelector)

    // clear dropdown bevor render
    const rs = document.querySelector(".restriction-selector");
    //console.log("selector ",rs)
    if (rs !== null) {
        while (rs.firstChild) {
            rs.removeChild(rs.firstChild);
        }
    }

    if (parent !== null) {
        if (selectBox === null) {
            //console.log("+++++ add selectbox +++++")
            selectBox = document.createElement("select") //<select multiple class="form-control" id="only">
            selectBox.setAttribute("class", "form-control restriction-selector");
            selectBox.setAttribute("id", "only");
            selectBox.setAttribute("multiple", "true");
            parent.appendChild(selectBox)
        }

        let firstOption = document.createElement("option");
            firstOption.setAttribute("checked", "checked");
            firstOption.innerText = "Keine Einschränkung";
            firstOption.setAttribute("value", 0);
        //console.log("+++++ add first option +++++")
        selectBox.appendChild(firstOption)

        for (let index = 1; index <= length; index++) {
            //console.log("index", index, selectBox.options[index])
            if (selectBox.options[index] === undefined) {
                let option = document.createElement("option");
                option.innerText = index;
                option.setAttribute("value", index);
                selectBox.appendChild(option)
            }
        }
    }
};

const getDataFilter = () =>{

    let checkboxes = {
        other: 0,
        safe: 0,
        all_names: false,
        show_out: false,
        show_in: false,
        only_out_in:[]
    };
    // check values of checkboxes
    if (document.querySelector("#sure").checked) {
        checkboxes.safe = 1;
    }
    if (document.querySelector("#all_names").checked) {
        checkboxes.all_names = true;
    }
    if (document.querySelector("#show_out").checked) {
        checkboxes.show_out = true;
    } 
    if (document.querySelector("#show_in").checked) {
        checkboxes.show_in = true;
    }
/*    if (document.querySelector("#limit_ex").checked) {
        checkboxes.limit_ex = true;
    }*/
    // get multiple dropdown values
    checkboxes.only_out_in = getDropdownValues("only");
    return checkboxes;
};

const onToolTipClick = function(value) {
    // show additional infos on left side
    var node = document.createElement("div")
    var newline = document.createElement("br")
    var bold = document.createElement("b")
    var title = document.createTextNode(String(value) + ":")
    var addinfo = document.createTextNode(getRelationInfo(1, 2))
    node.id = "relation-info"
    node.className = "relation-info"
    bold.appendChild(title)
    node.appendChild(bold)
    node.appendChild(newline)
    node.appendChild(addinfo)
    replacer = document.getElementById("relation-info")
    if (replacer) {
        replacer.remove()
    }

    document.getElementById("content-left").appendChild(node)
}

function getRelationInfo(id1, id2) {
    let loremipsum = "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."
    return loremipsum
}