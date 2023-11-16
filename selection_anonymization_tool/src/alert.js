import {downloadData, storageData} from "./gui.js";



export function windowAlert(text) {
    const alert = document.getElementById("alert-windows");
    const textElement = document.getElementById("alert-text");
    textElement.textContent = text;
    showAlert();
    closeAlert();

    function showAlert() {
        alert.style.display = "block";
        setTimeout(() => {
            alert.style.transform = "translate(-50%, 0%)";
        }, 250);
    }
      
    function closeAlert() {
        setTimeout(() => {
            alert.style.transform = "translate(-50%, -110%)";
        }, 2250);
        setTimeout(() => {
            alert.style.display = "none";
        }, 2500);
    }
}


function windowInput() {
    return new Promise((resolve, reject) => {
        const alert = document.getElementById("input-windows");
        const input = document.getElementById("user-input");
        const button = document.getElementById("submit-button");
        showAlert();

        function showAlert() {
            alert.style.display = "block";
            setTimeout(() => {
                alert.style.transform = "translate(-50%, 0%)";
            }, 250);
        }

        button.addEventListener("click", function() {
            resolve(input.value);

            setTimeout(() => {
                alert.style.transform = "translate(-50%, -110%)";
            }, 250);
            setTimeout(() => {
                alert.style.display = "none";
            }, 1250);
        }, {once: true});
    });
}


export async function getUserInput() {
    try {
        const userInput = await windowInput();
        if (userInput === "" || userInput === null) {
            windowAlert("Name cannot be empty.");
            getUserInput();
        } else {
            windowAlert("Saved successfully.");
            return userInput;
        }
    } catch (error) {
        windowAlert("An error occurred:", error);
    }
}


export function cleanInput() {
    const input = document.getElementById("user-input");
    input.value = "";
}


export function getColor() {
    const textElement = document.getElementById("color-text");
    return textElement.textContent;
}


export function exportWindow() {
    const alert = document.getElementById("export-windows");
    const download = document.getElementById("download-button");
    // const storage = document.getElementById("storage-button");
    const cancel = document.getElementById("cancel-button");
    showAlert();

    function showAlert() {
        alert.style.display = "block";
        setTimeout(() => {
            alert.style.transform = "translate(-50%, 0%)";
        }, 250);
    }

    download.addEventListener("click", function() {
        downloadData();

        setTimeout(() => {
            alert.style.transform = "translate(-50%, -110%)";
        }, 250);
        setTimeout(() => {
            alert.style.display = "none";
        }, 1250);
    }, {once: true});

    // storage.addEventListener("click", function() {
    //     storageData();

    //     setTimeout(() => {
    //         alert.style.transform = "translate(-50%, -110%)";
    //     }, 250);
    //     setTimeout(() => {
    //         alert.style.display = "none";
    //     }, 1250);
    // }, {once: true});

    cancel.addEventListener("click", function() {
        setTimeout(() => {
            alert.style.transform = "translate(-50%, -110%)";
        }, 250);
        setTimeout(() => {
            alert.style.display = "none";
        }, 1250);
    }, {once: true});
}
