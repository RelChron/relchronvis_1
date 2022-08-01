const init = () => {
    // merge json data
    let data = mergeData(wandel_data, wandel_definitions);
    //save model to local storage
    saveModel(data, LOCAL_KEY_STATIC, "Diachrone Lautlehre des Russischen")
    // render dropdown
    renderRestrictionDropdown("#restriction-selector", data.length)
    // load model 
    loadModel(LOCAL_KEY_STATIC)
    // add event listeners
    registerEventListener()
}