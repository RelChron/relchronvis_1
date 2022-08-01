
const createImageToDownload = () => {
    // console.log("+++++ createImageToDownload() +++++")

    let node = document.getElementById("svg_timeline").cloneNode(true)
        node.setAttribute("id", "svg_clone")
        node.setAttribute("style", "background:#FFF;")
        node.firstChild.removeAttribute("transform")

    // set clone and calculate dimension
    let clone = document.querySelector("#clone").appendChild(node)

    const WIDTH = node.getBBox().width + IMAGE_MARGIN
    const HEIGHT = node.getBBox().height + IMAGE_MARGIN

    // set SVG width and height in pixel before serialize -> Firefox or IE cannot render image when the dimensions are set in %!
    clone.setAttribute('width', WIDTH);
    clone.setAttribute('height', HEIGHT);

    let x = clone.getBBox().x + (IMAGE_MARGIN / 2)
    let y = (-clone.getBBox().y + (IMAGE_MARGIN / 2))

    //console.log(clone.getBBox(), clone)
    
    if (document.querySelector("#" + SVG_ID).getAttribute("class") === DEPENDENCY_WEEL_CLASS_NAME) {
        //console.log("render dependency weel image")
        x = ((clone.getBBox().width / 2 - clone.getBBox().x) - WIDTH/2) + IMAGE_MARGIN
    } 

    clone.firstChild.setAttribute("transform", "translate(" + x + "," + y + ")")
    //console.log(clone.getBBox(), document.querySelector("#clone").firstChild, clone, node)
    //console.log(document.querySelector('input[name=download-image]:checked').value)
    const selectedDownloadType = document.querySelector('input[name=download-image]:checked').value;
    if (selectedDownloadType === "PNG"){
        createPNGImage()
    } else if (selectedDownloadType === "SVG"){
        createSVGByData()
    }
}

const createSVGByData = () => {
    //const node = document.querySelector("svg")
    let node = document.querySelector("#clone").firstChild

    const svgString = new XMLSerializer().serializeToString(node);
    const encoded = window.btoa(unescape(encodeURIComponent(svgString)))
    //console.log(encoded);
    
    //const decoded = decodeURIComponent(escape(window.atob(encoded)));
    //console.log(decoded);

    const WIDTH = node.getBBox().width + IMAGE_MARGIN
    const HEIGHT = node.getBBox().height + IMAGE_MARGIN
    
    const imgsrc = 'data:image/svg+xml;base64,' + encoded;
    const imgSVG = '<img width="' + WIDTH +'" height="' + HEIGHT +'" id="svgToDownload" src="' + imgsrc + '">';
    const filename = document.querySelector('#timeknots-session-name').value +".svg";

    document.querySelector("#svgImage").innerHTML = imgSVG
    
    //console.log(imgSVG)
    triggerDownload(imgsrc, filename);

    document.querySelector("#svgImage").innerHTML = "";
}

const createPNGImage = () =>{

    let node = document.querySelector("#clone").firstChild

    const WIDTH = node.getBBox().width + IMAGE_MARGIN
    const HEIGHT = node.getBBox().height + IMAGE_MARGIN
    // set SVG width and height in pixel before serialize -> Firefox or IE cannot render image when the dimensions are set in %!
    node.setAttribute('width', WIDTH);
    node.setAttribute('height', HEIGHT);

    const svgString = new XMLSerializer().serializeToString(node);
   
    const filename = document.querySelector('#timeknots-session-name').value + ".png";

    let canvas = document.getElementById("canvas");
        canvas.setAttribute("height", HEIGHT)
        canvas.setAttribute("width", WIDTH)
    
    const ctx = canvas.getContext("2d");
    const DOMURL = self.URL || self.webkitURL || self;
    const img = new Image();
    const svg = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8"
    });
    const url = DOMURL.createObjectURL(svg);
    img.onload = function () {
        //console.log("+++++ on image load +++++")
        ctx.drawImage(img, 0, 0);

        const imgURL = canvas.toDataURL("image/png", 1.0);

        triggerDownload(imgURL, filename)

        DOMURL.revokeObjectURL(imgURL);
        document.querySelector("#clone").innerHTML = "";
        
        /*let dlLink = document.createElement('a');
            dlLink.download = filename;
            dlLink.href = imgURL;
            dlLink.dataset.downloadurl = ["image/png", dlLink.download, dlLink.href].join(':');
            document.body.appendChild(dlLink);
            dlLink.click();

        setTimeout(function () {
            //console.log("++++ clear image data +++++")
            document.body.removeChild(dlLink);
            DOMURL.revokeObjectURL(imgURL);
            document.querySelector("#clone").innerHTML = "";
        }, 100);*/
    }
    img.src = url;
}

const triggerDownload = (imgURI, filename) => {
    //console.log("+++++ trigger download file +++++")
    const evt = new MouseEvent('click', {
        view: window,
        bubbles: false,
        cancelable: true
    });
    let a = document.createElement('a');
    a.setAttribute('download', filename);
    a.setAttribute('href', imgURI);
    a.setAttribute('target', '_blank');
    a.dispatchEvent(evt);
}