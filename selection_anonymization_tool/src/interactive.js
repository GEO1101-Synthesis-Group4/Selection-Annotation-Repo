document.querySelector(".layer-toggler").addEventListener("click", function() {
    const layers = document.querySelector(".layers");
    layers.classList.toggle("expanded");
});


$("#custom-color").spectrum({
    preferredFormat: "hex",
    showInput: true,
    color: "#ff0000",

    change: function(color) {
        const hex = color.toHexString();
        const textElement = document.getElementById("color-text");
        textElement.textContent = hex;
    }
});


exportButton = document.getElementById("download-button");
exportButton.addEventListener("click", function() {

});