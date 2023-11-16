import * as lasso from "./lasso.js";
import * as blurry from "./blurry.js";
import * as alert from "./alert.js";



let LassoToolMode = false;
let GridSize = 10; // unit: pixel on screen; default value: 10, it is suitable for the majority of cases
let withAlert, keepSelection;

let BlurryToolMode = false;
let BlurryColorMode = "consistent"; // default value: consistent
let BlurryColor = "#000000"; // default value: black
let BlurryOffsetMode = false;
let BlurryIntensity = 0.5; // default value: 0.5

let SavedPointsSets = {};


// Load GUI
export function loadGUI(){
    viewer.loadGUI(() => {
        viewer.setLanguage("en");
        viewer.toggleSidebar();

        let versionSection = $(`
        <h3 id="menu_version" class="accordion-header ui-widget"><span>Project</span></h3>
        <div class="accordion-content ui-widget pv-menu-list"></div>
        `);
        let versionContent = versionSection.last();
        versionContent.html(`
        <!-- <p style="margin-top: -15px; text-align: center; font-size: 15px"><br><b><font color=yellow>Last modified: 2023.11.1</font></b></p> -->
        <p style="margin-top: -10px; margin-bottom: 15px; text-align: center; font-size: 15px"><br><font color=white>Group 4, Synthesis Project 2023</font></p>

        <!-- <div class="divider" style="margin-top: 10px; margin-bottom: 10px; font-size: 15px"><span>To do list</span></div>

        <ul style="margin-left: 0px">
            <li style="margin-top: 5px; margin-bottom: 10px">
                Get point clouds color from the original THREE.Points.
            </li>
            <li style="margin-top: 5px; margin-bottom: 10px">
                Forbid to set empty group name.
            </li>
            <li style="margin-top: 5px; margin-bottom: 10px">
                Improve the method of the blurring.
            </li>
            <li style="margin-top: 5px; margin-bottom: 10px">
                ......
            </li>
        </ul> -->
        `);

        let selectionSection = $(`
            <h3 id="menu_selection" class="accordion-header ui-widget"><span>Selection Tool</span></h3>
            <div class="accordion-content ui-widget pv-menu-list"></div>
        `);
        let selectionContent = selectionSection.last();
        selectionContent.html(`
            <li>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="margin-right: 10px;">
                        <input type="checkbox" id="lasso" name="lasso" value="lasso">
                        <label for="lasso">Lasso selection</label>
                    </div>
                </div>
            </li>
            <li>
                <div style="display: flex; justify-content: space-evenly; margin-top: 10px">
                    <div style="margin-right: 10px;">
                        <button style="cursor: pointer"; class="bounceButton" id="cleanSelectionButton">Clean selection</button>
                    </div>
                    <div>
                        <button style="cursor: pointer"; class="bounceButton" id="saveButton">Complete selection</button>
                    </div>
                </div>
            </li>

            <div style="display: flex; justify-content: center; align-items: center;">
                <div style="margin-top: 15px">Selected points: <span id="lblSelectedPoints" style="color: RGB(240, 140, 90)">0</span></div>
            </div>

            <div class="divider" style="margin-top: 15px; margin-bottom: 10px; font-size: 15px"><span>Operation instruction</span></div>

            <ul style="margin-left: 0px">
                <li>Select points / Add points:
                    <ul style="margin-left: -30px; margin-top: 5px; margin-bottom: 5px">
                        <b><font color=white>Hold scroll wheel</font></b>
                    </ul>
                </li>
                <li>Remove selected points partly:
                    <ul style="margin-left: -30px; margin-top: 5px; margin-bottom: 10px">
                    <b><font color=white>Shift + Hold scroll wheel</font></b>
                    </ul>
                </li>
            </ul>
    
            <div class="divider" style="margin-top: 15px; margin-bottom: 10px; font-size: 15px"><span>Selection parameters</span></div>
    
            <li>
                <span>Selection grid size</span>: <span id="lblLassoSensitivity">10</span><div id="sldLassoSensitivity"></div>
                <p><b><font color=white>Controls selection & blurry tools.</font></b></p>
                <p>For optical performance, set larger number when selecting large area.</p>
                <p>For selection accuracy, zoom in and set small number to refine the selection.</p>
            </li>

            <div class="divider" style="margin-top: 15px; margin-bottom: 10px; font-size: 15px"><span>Export selected groups</span></div>

            <div style="display: flex; justify-content: space-evenly; align-items: center;">
                <div>Selected groups: <span id="lblSelectedGroups" style="color: RGB(240, 140, 90)">0</span></div>
                <div>
                    <button style="cursor: pointer"; class="bounceButton" id="exportButton">Export</button>
                </div>
            </div>
        `);
    
        let blurrySection = $(`
            <h3 id="menu_blurry" class="accordion-header ui-widget"><span>Blurry Tool</span></h3>
            <div class="accordion-content ui-widget pv-menu-list"></div>
        `);
        let blurryContent = blurrySection.last();
        blurryContent.html(`
            <li>
                <div style="display: flex; justify-content: space-between;">
                    <div style="margin-right: 10px;">
                        <input type="checkbox" id="blurry" name="blurry" value="blurry" unchecked>
                        <label for="blurry">Blurry tool</label>
                    </div>
                    <div>
                        <button style="cursor: pointer"; class="bounceButton" id="cleanBlurryButton">Clean blurry</button>
                    </div>
                </div>
            </li>
    
            <div class="divider" style="margin-top: 10px; margin-bottom: 10px; font-size: 15px"><span>Operation instruction</span></div>
            
            <ul style="margin-left: 0px">
                <li>Select points / Add points:
                    <ul style="margin-left: -30px; margin-top: 5px; margin-bottom: 5px">
                        <b><font color=white>B + Hold scroll wheel</font></b>
                    </ul>
                </li>
                <li>Remove selected points partly:
                    <ul style="margin-left: -30px; margin-top: 5px; margin-bottom: 10px">
                    <b><font color=white>Shift + B + Hold scroll wheel</font></b>
                    </ul>
                </li>
            </ul>

            <div class="divider" style="margin-top: 15px; margin-bottom: 10px; font-size: 15px"><span>Blurring parameters</span></div>
            
            <ul style="margin-left: 0px">
                <li>
                    <div style="margin-top: 15px; margin-bottom: 15px">Set consistent blurry color (Default):
                        <div style="margin-top: 10px; margin-bottom: 15px; margin-left: 15px">    
                            <input type="text" id="custom-blurryColor">
                        </div>
                    </div>

                    <div style="margin-top: 15px; margin-bottom: 10px">Or random blurry color:
                        <div style="margin-top: 5px; margin-left: 15px">
                            <input type="checkbox" id="random-blurryColor" name="random-blurryColor" value="random-blurryColor" unchecked>
                            <label for="random-blurryColor">Random blurry color</label>
                        </div>
                    </div>
                </li>

                <li>
                    <div style="margin-bottom: 10px">
                        <input type="checkbox" id="random-blurryOffset" name="random-blurryOffset" value="random-blurryOffset" unchecked>
                        <label for="random-blurryOffset">Random spatial offset</label>
                    </div>

                    <div>
                        <span>Spatial offset intensity</span>: <span id="lblBlurryIntensity">0.5</span><div id="sldBlurryIntensity"></div>
                    </div>
                </li>
            </ul>
        `);
    
        // Add event listener to checkbox
        $(document).ready(function() {
            // jQuery 代码 jQuery code
            $("#lasso").change(function() {
                if (this.checked) {
                    let blurryButton = document.getElementById("blurry");
                    if (blurryButton.checked) {
                        blurryButton.checked = false;
                        BlurryToolMode = false;
                        updateBlurryToolMode(false);
                    }
                    LassoToolMode = true;
                } else {
                    LassoToolMode = false;
                }
                updateLassoToolMode(true);
            });

            $("#saveButton").click(function() {
                lasso.saveLassoSelectedPoints(SavedPointsSets);
            });

            $("#cleanSelectionButton").click(function() {
                lasso.removeLassoSelectedPoints(withAlert=true, keepSelection=false);
            });
    
            $("#sldLassoSensitivity").slider({
                value: 10, // Default value
                min: 5,
                max: 20,
                step: 1,
                slide: function(event, ui) {
                    $("#lblLassoSensitivity").text(ui.value);
                    GridSize = ui.value;
                    // reload lasso selection
                    lasso.removeLassoEventListeners();
                    lasso.removeLassoSelectedPoints(withAlert=false, keepSelection=true);
                    lasso.lassoSelection(GridSize);
                }
            });

            $("#exportButton").click(function() {
                if (Object.keys(SavedPointsSets).length === 0) {
                    alert.windowAlert("No group is selected.");
                } else {
                    alert.exportWindow();
                }
            });

            $("#blurry").change(function() {
                if (this.checked) {
                    let lassoButton = document.getElementById("lasso");
                    if (lassoButton.checked) {
                        lassoButton.checked = false;
                        LassoToolMode = false;
                        updateLassoToolMode(false);
                    }
                    BlurryToolMode = true;
                } else {
                    BlurryToolMode = false;
                }
                updateBlurryToolMode(true);
            });

            $("#cleanBlurryButton").click(function() {
                blurry.removeBlurredPoints();
            });

            $("#custom-blurryColor").spectrum({
                preferredFormat: "hex",
                showInput: true,
                color: "#000000",
            
                change: function(color) {
                    const hex = color.toHexString();
                    BlurryColor = hex;
                    alert.windowAlert("Set blurry color to " + hex + ".")
                    blurry.removeBlurredPoints(false);
                    updateBlurryToolMode(false);
                }
            });

            $("#random-blurryColor").change(function() {
                if (this.checked) {
                    BlurryColorMode = "random";
                    alert.windowAlert("Random blurry color is enabled.")
                    blurry.removeBlurredPoints(false);
                    updateBlurryToolMode(false);
                } else {
                    BlurryToolMode = "consistent";
                    alert.windowAlert("Random blurry color is disabled.")
                    blurry.removeBlurredPoints(false);
                    updateBlurryToolMode(false);
                }
            });

            $("#random-blurryOffset").change(function() {
                if (this.checked) {
                    BlurryOffsetMode = true;
                    alert.windowAlert("Random spatial offset is enabled.")
                    blurry.removeBlurredPoints(false);
                    updateBlurryToolMode(false);
                } else {
                    BlurryOffsetMode = false;
                    alert.windowAlert("Random spatial offset is disabled.")
                    blurry.removeBlurredPoints(false);
                    updateBlurryToolMode(false);
                }
            });

            $("#sldBlurryIntensity").slider({
                value: 0.5, // Default value
                min: 0.1,
                max: 1.0,
                step: 0.1,
                slide: function(event, ui) {
                    $("#lblBlurryIntensity").text(ui.value);
                    BlurryIntensity = ui.value;
                    blurry.removeBlurredPoints(false);
                    updateBlurryToolMode(false);
                }
            });
        });
        
        versionSection.first().click(() => versionContent.slideToggle());
        versionSection.insertBefore($("#menu_appearance"));

        selectionSection.first().click(() => selectionContent.slideToggle());
        selectionSection.insertBefore($("#menu_appearance"));

        blurrySection.first().click(() => blurryContent.slideToggle());
        blurrySection.insertBefore($("#menu_appearance"));
    });
}


function updateLassoToolMode(showAlert) {  
    if (LassoToolMode) {
        lasso.lassoSelection(GridSize);
        if (showAlert) {
            alert.windowAlert("Lasso selection is enabled.")
        }
    } else if (!LassoToolMode) {
        lasso.removeLassoSelectedPoints(withAlert=false, keepSelection=false);
        lasso.removeLassoEventListeners();
        if (showAlert) {
            alert.windowAlert("Lasso selection is disabled.")
        }
    }
}

function updateBlurryToolMode(showAlert) {
    if (BlurryToolMode) {
        blurry.blurrySelection(GridSize, BlurryIntensity, BlurryColorMode, BlurryColor, BlurryOffsetMode);
        if (showAlert) {
            alert.windowAlert("Blurry tool is enabled.")
        }
    } else if (!BlurryToolMode) {
        blurry.removeBlurredPoints();
        blurry.removeBlurryEventListeners();
        if (showAlert) {
            alert.windowAlert("Blurry tool is disabled.")
        }
    }
}


export function handleVisibleChange(event) {
    const checkBox = event.target;
    const userName = checkBox.id.split("-")[0];
    const points = SavedPointsSets[userName];
    if (checkBox.checked) {
        viewer.scene.scene.add(points);
    } else {
        viewer.scene.scene.remove(points);
    }
}


// Update stats
export function updatePointsStats(pointsList) {
    const textElement = document.getElementById("lblSelectedPoints");
    textElement.textContent = pointsList.length;
}

export function updateGroupStats(groupNumber) {
    const textElement = document.getElementById("lblSelectedGroups");
    textElement.textContent = groupNumber;
}


export function deleteRow(event) {
    const button = event.target;
    const userName = button.id.split("-")[0];
    
    let row = button.parentNode.parentNode;
    row.parentNode.removeChild(row);

    const points = SavedPointsSets[userName];
    viewer.scene.scene.remove(points);
    delete SavedPointsSets[userName];
    
    updateTable(SavedPointsSets);
    updateGroupStats(Object.keys(SavedPointsSets).length);
}


function updateTable(dictionary) {
    let tableBody = document.getElementById("tableBody");

    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }
    
    for (let key in dictionary) {
        lasso.toTableRow(dictionary, key);
    }
}


export function createCell(row, text, type="text", additionalData=null) {
    let cell = row.insertCell();
    switch (type) {
        case "text":
            cell.textContent = text;
            break;
        case "color":
            const colorBlock = document.createElement("div");
            colorBlock.style.width = "75px";
            colorBlock.style.height = "15px";
            colorBlock.style.backgroundColor = additionalData;
            cell.appendChild(colorBlock);
            break;
        case "checkbox":
            const checkBox = document.createElement("input");
            checkBox.type = "checkbox";
            checkBox.id = additionalData.id;
            checkBox.checked = additionalData.checked;
            checkBox.addEventListener("change", additionalData.changeHandler);
            cell.appendChild(checkBox);
            break;
        case "button":
            const button = document.createElement("button");
            button.id = additionalData.id;
            button.textContent = additionalData.text;
            button.addEventListener("click", additionalData.clickHandler);
            cell.appendChild(button);
            break;
        default:
            cell.textContent = text;
    }
}


export function downloadData() {
    const jsonData = JSON.stringify(SavedPointsSets);
    const blob = new Blob([jsonData], {type: "application/json"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    a.click();
}


export function storageData() {
    const jsonData = JSON.stringify(SavedPointsSets);
    localStorage.setItem("data", jsonData);
}