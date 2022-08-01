const softmax = (arr) =>{
    return arr.map(function (value, index) {
        return Math.exp(value) / arr.map(function (y /*value*/) { return Math.exp(y) }).reduce(function (a, b) { return a + b })
    })
}

const range = (size, startAt) => {
    return Array.apply(null, Array(size)).map(function (_, i) { return i + startAt; });
}

const getRandomColor = () => {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

const makeid = (length) => {
    
    if (MOCKUP_DATA){
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    
    return "";
    
}

const randomNumberList = () => {
    if (MOCKUP_DATA){
       var arr = [];
        for (var i = 0; i < 5; i++) {
            arr.push(Math.floor(Math.random() * 20) + 1)
        }
        var str = "";
        for (var i = 0; i < 5; i++) {
            str += (i > 0) ? "," + arr[i] : "" + arr[i];

        }
        return str; 
    }
    return "";
}

const getGermanFormattedDate = (date) => {
    var event = new Date(date);
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    return event.toLocaleDateString('de-DE', options)
}

const getKeyByValue = (object, value) => {
    for (var prop in object) {
        if (object.hasOwnProperty(prop)) {
            if (object[prop] === value)
                return prop;
        }
    }
} 

const getDropdownValues = (elementId) => {
    var x = document.getElementById(elementId);

    var arr = [];
    if (x.options[0].selected) {
        return [];
    }
    for (var i = 0; i < x.options.length; i++) {
        if (x.options[i].selected) {
            arr.push(i);
        }
    }
    return arr;
}

const getTransformations = (elementId) => {
    let style = window.getComputedStyle(document.getElementById(elementId));
    let matrix = new WebKitCSSMatrix(style.webkitTransform);
    // console.log(matrix);
    return {
        'translateX: ': matrix.e,
        'translateY: ': matrix.f,
        'scale: ': matrix.d
    }
}

const autoExpand = (field) => {
    //console.log(field)
    // Reset field height
    field.style.height = '20px';
    // Get the computed styles for the element
    var computed = window.getComputedStyle(field);
    let sh = field.scrollHeight
    // Calculate the height
    var height = sh
        //+ parseInt(computed.getPropertyValue('border-top-width'), 10)
        //+ parseInt(computed.getPropertyValue('padding-top'), 10)
        //+ parseInt(computed.getPropertyValue('padding-bottom'), 10)
        //+ parseInt(computed.getPropertyValue('border-bottom-width'), 10);

    //console.log(field.scrollHeight)
    //console.log(height, parseInt(computed.getPropertyValue('border-top-width'), 10))
    
    field.style.height = (height) + 'px';
};
