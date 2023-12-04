import * as THREE from "../../libs/three.js/build/three.module.js";

window.viewer = new Potree.Viewer(document.getElementById("potree_render_area"));

viewer.setEDLEnabled(true);
viewer.setFOV(60);
viewer.setPointBudget(5_000_000);
viewer.loadSettingsFromURL();

viewer.setDescription(`Point cloud courtesy of PG&E and <a href="https://opentopography.org/">Open Topography</a>.`);

// Global variables
let annotationToolMode = "None";
let toolMode = "None";
let canvasColourPickToolMode = "None";

viewer.loadGUI().then( () => {
    viewer.setLanguage('en');
    // $("#menu_filters").next().show();
    viewer.toggleSidebar();

    // by me inspired from shen
    let blurrySection = $(`
    <h3 id="menu_blurry" class="accordion-header ui-widget"><span>Blurry Tool</span></h3>
    <div class="accordion-content ui-widget pv-menu-list"></div>
    `);
    let blurryContent = blurrySection.last();
    blurryContent.html(`
        <p style="margin-top: -15px; margin-bottom: 15px; font-size: 20px"><br><b><font color=yellow>Last modified: 2023.10.25</font></b></p>

        <div class="divider"><span>--------</span></div>

        <li>
            <input type="checkbox" id="blurry" name="blurry" value="blurry" unchecked>
            <label for="blurry">Blurry tool</label>
            <div style="margin-top: 10px"><b><font color=red>(Always enabled, no function)</font></div>
        </li>

        <div class="divider" style="margin-top: 10px; margin-bottom: 10px; font-size: 15px"><span>Operation instruction</span></div>
        
        <ul style="list-style-type: disc">
            <li>Blurry points:
                <ul style="margin-left: -30px; margin-top: 5px; margin-bottom: 5px">
                    <b><font color=white>B + Middle button</font></b>
                </ul>
            </li>
        </ul>
    `);

    // Add event listener to checkbox
    $(document).ready(function() {
        // jQuery 代码 jQuery code
        $("#blurry").change(function() {
            if (this.checked) {
                toolMode = "blurry";
            } else {
                toolMode = "disableBlurry";
            }
            updateToolMode();
        });

    });
    
    blurrySection.first().click(() => blurryContent.slideToggle());
    blurrySection.insertBefore($('#menu_appearance'));

    // by me double; adopted from Shen
    let annotationSection = $(`
    <h3 id="menu_annotation" class="accordion-header ui-widget"><span>Text Annotation Tool</span></h3>
    <div class="accordion-content ui-widget pv-menu-list"></div>
    `);

    // position selection
    let posSelectionContent = annotationSection.last();
    posSelectionContent.html(`
    <li>
        <label for="positionInput">Position (X Y Z)</label>
        <input type="text" id="positionInput" name="positionInput" placeholder="100 100 100">
    </li>
    `);

    // title for annotation
    let titleInputContent = $("<div></div>");
    titleInputContent.html(`
        <li>
            <label for="titleInput">Title:</label>
            <textarea id="titleInput" name="titleInput" rows="2" placeholder="Enter your title here..."></textarea>
        </li>
    `);
    posSelectionContent.append(titleInputContent);

    // notes for annotation
    let notesInputContent = $("<div></div>");
    notesInputContent.html(`
        <li>
            <label for="notesInput">Notes:</label>
            <textarea id="notesInput" name="notesInput" rows="5" placeholder="Enter your content here..."></textarea>
        </li>
    `);
    posSelectionContent.append(notesInputContent);

    // save the annotation and close button
    let saveButtonContent = $("<div></div>");
    saveButtonContent.html(`
        <li>
            <button id="saveButton">Save</button>
            <button id="updateButton">Update</button>
        </li>
    `);
    posSelectionContent.append(saveButtonContent);

    // canvas colour picker
    let colourPickContent =  $("<div></div>");
    colourPickContent.html(`
        <li>
            <input type="checkbox" id="colourPick" name="colourPick" value="colourPick" unchecked>
            <label for="colourPick">Canvas colour</label>
        </li>
    `);
    posSelectionContent.append(colourPickContent);

    // text colour pick
    let textColourPickContent =  $("<div></div>");
    textColourPickContent.html(`
        <li>
            <input type="checkbox" id="textColourPick" name="textColourPick" value="textColourPick" unchecked>
            <label for="textColourPick">Text colour</label>
        </li>

    `);
    posSelectionContent.append(textColourPickContent);


    // canvas width and height
    let canvasSizeInputContent = $("<div></div>");
    canvasSizeInputContent.html(`
        <li>
            <label for="widthInput">Canvas Width:</label>
            <input type="range" id="widthInput" name="widthInput" value="100" min="0" max="500">
            <output id="widthOutput">100</output>
        </li>
        <li>
            <label for="heightInput">Canvas Height:</label>
            <input type="range" id="heightInput" name="heightInput" value="100" min="0" max="500">
            <output id="heightOutput">100</output>
        </li>
    `);
    posSelectionContent.append(canvasSizeInputContent);

    // font size -> notes
    let fontSizeContent = $("<div></div>");
    fontSizeContent.html(`
        <li>
            <label for="fontSizeInput">Font size:</label>
            <input type="range" id="fontSizeInput" name="fontSizeInput" value="3" min="0" max="15">
            <output id="fontSizeOutput">3</output>
        </li>
    `);
    posSelectionContent.append(fontSizeContent);


    // Title Font selection
    let titlefontDropdownContent = $("<div></div>");
    titlefontDropdownContent.html(`
        <li>
            <label for="titleDropdownSelect">Font:</label>
            <select id="titleDropdownSelect" name="titleDropdownSelect">
            <option value="gentilis_bold.typeface.json">Gentilis Bold</option>
            <option value="gentilis_regular.typeface.json">Gentilis Regular</option>
            <option value="helvetiker_bold.typeface.json">Helvetiker Bold</option>
            <option value="helvetiker_regular.typeface.json">Helvetiker Regular</option>
            <option value="optimer_bold.typeface.json">Optimer Bold</option>
            <option value="optimer_regular.typeface.json">Optimer Regular</option>
        </select>
        </li>
    `);
    posSelectionContent.append(titlefontDropdownContent);

    // Notes Font selection
    // let notesFontDropdownContent = $("<div></div>");
    // notesFontDropdownContent.html(`
    //     <li>
    //         <label for="notesDropdownSelect">Notes font:</label>
    //         <select id="notesDropdownSelect" name="notesDropdownSelect">
    //             <option value="gentilis_bold.typeface.json">Gentilis Bold</option>
    //             <option value="gentilis_regular.typeface.json">Gentilis Regular</option>
    //             <option value="helvetiker_bold.typeface.json">Helvetiker Bold</option>
    //             <option value="helvetiker_regular.typeface.json">Helvetiker Regular</option>
    //             <option value="optimer_bold.typeface.json">Optimer Bold</option>
    //             <option value="optimer_regular.typeface.json">Optimer Regular</option>
    //         </select>
    //     </li>
    // `);
    // posSelectionContent.append(notesFontDropdownContent);
    


    // transformation controls
    let transformationContent = $("<div></div>");
    transformationContent.html(`
        <h4>Plane Mesh Control</h4>

        <label for="translateX">Translate X:</label>
        <input type="range" id="translateX" name="translateX" value="0" min="-500" max="500" step="10">
        <output id="translateXOutput">0</output>

        <br>
        <label for="translateY">Translate Y:</label>
        <input type="range" id="translateY" name="translateY" value="0" min="-500" max="500" step="10">
        <output id="translateYOutput">0</output>

        <br>
        <label for="translateZ">Translate Z:</label>
        <input type="range" id="translateZ" name="translateZ" value="0" min="-500" max="500" step="10">
        <output id="translateZOutput">0</output>

        <br>
        <label for="rotateX">Rotate X:</label>
        <input type="range" id="rotateX" min="-180" max="180" step="1">
        <output id="rotateXOutput">0</output>

        <br>
        <label for="rotateY">Rotate Y:</label>
        <input type="range" id="rotateY" min="-180" max="180" step="1">
        <output id="rotateYOutput">0</output>

        <br>
        <label for="rotateZ">Rotate Z:</label>
        <input type="range" id="rotateZ" min="-180" max="180" step="1">
        <output id="rotateZOutput">0</output>

    `);
    posSelectionContent.append(transformationContent);


    // all the variables to be updated in the listeners
    let posX = 0;
    let posY= 0;
    let posZ = 0;
    let position = "";

    let title = "";
    let notes = "";

    // storing initial positions
    let initial_positions = [];

    let userDecision = "";
    let MeshsArray = [];
    let copyMeshsArray = [];
    let add_path = "../fonts/";

    let canvasColour = "#ffffff";
    let textColour = "#000000";

    let canvasWidth = 100;
    let canvasHeight = 100;
    let planeDims = [canvasWidth, canvasHeight];

    let addpath = '../fonts/';
    let titleFont = "";
    let notesFont = "";
    let titleFontPath = addpath + "gentilis_bold.typeface.json";
    let notesFontPath = addpath + "gentilis_bold.typeface.json";

    let fontSize = 3;

    var translateX = 0;
    var translateY = 0;
    var translateZ = 0;
    var rotateX = 0;
    var rotateY = 0;
    var rotateZ = 0;
    let titleNumLines = 0;
    let notesNumLines = 0;

    // Add event listeners for annotation tool
    $(document).ready(function() {

        // Position -> event listener
        $("#positionInput").on("change", function() {
            // Get the input value and split it into an array of values
            const inputText = $(this).val();
            const values = inputText.split(" ");
          
            if (values.length === 3) {
              // Ensure there are three values
              posX = parseFloat(values[0]);
              posY = parseFloat(values[1]);
              posZ = parseFloat(values[2]);
          
              // Do something with posX, posY, and posZ
              console.log("X:", posX, "Y:", posY, "Z:", posZ);
            } else {
              alert("Please enter three space-separated values (X Y Z).");
            }
        });
          
        // event listener for storing the title and notes
        $("#titleInput").on("input", function(){
            title = $(this).val();
            console.log("User's title: " + title);
        });
        $("#notesInput").on("input", function(){
            notes = $(this).val();
            console.log("Notes: " + notes);
        });

        // save button event listener
        $("#saveButton").click(function() {
            userDecision = "save";
            // You can perform the save action here or take any other action you need
            // planeDims = [100, 100];  // default plane dimensions
            let messageTitle = title;
            let messageNotes = notes;
            let defaultTitleFontPathParam = add_path + "gentilis_bold.typeface.json";  // default 
            let defaultNotesFontPathParam = add_path + "gentilis_regular.typeface.json";
            let defaultFontSize = 3;

            let defaultCanvasColour = "#ffffff";  // default white canvas
            let defaultTextColour = "#000000";  // default black text
            position = [posX, posY, posZ];
            MeshsArray = updateAnnotation(position, defaultCanvasColour, defaultTextColour,
                            planeDims, defaultFontSize, defaultTitleFontPathParam, 
                            messageTitle, messageNotes);
            // console.log("MeshsArray.length in save: ", MeshsArray.length)
            getMeshsArrayInfo(MeshsArray);
            // const copyMeshsArray = [...MeshsArray];
        });


        // Canvas colour -> event listener
        $("#colourPick").change(function() {
            if (this.checked) {
                canvasColourPickToolMode = "canvasColourPick";
                // alert("Annotation tool is ENABLED!");
                // Show the color picker when the checkbox is checked
                $("#colourPick").spectrum({
                    showPalette: true,
                    showPaletteOnly: true,
                    togglePaletteOnly: true,
                    togglePaletteMoreText: 'more',
                    togglePaletteLessText: 'less',
                    hideAfterPaletteSelect: true,
                    palette: [
                        ["#ff0000", "#00ff00", "#0000ff"], // Example palette colors
                        // Add more colors as needed
                    ],
                    change: function(color) {
                        // This function will be called when the color is changed
                        var canvasHexColor = color.toHexString(); // Get the chosen color's hex value
                        console.log("Chosen canvas Color: " + canvasHexColor);
    
                        // Save the hexColor to a variable or use it as needed in your code
                        canvasColour = canvasHexColor;
                    }
                });

                // changing the canvas colour here
                MeshsArray[0].material.color.set(canvasColour);
            } else {
                canvasColourPickToolMode = "disablecanvasColourPick";
                // alert("Annotation tool is DISABLED!");
                $("#colourPick").spectrum("destroy");

            }        
        });

        // text colour event listener
        $("#textColourPick").change(function() {
            if (this.checked) {
                // Show the color picker when the checkbox is checked
                $("#textColourPick").spectrum({
                    showPalette: true,
                    showPaletteOnly: true,
                    togglePaletteOnly: true,
                    togglePaletteMoreText: 'more',
                    togglePaletteLessText: 'less',
                    hideAfterPaletteSelect: true,
                    palette: [
                        ["#ff0000", "#00ff00", "#0000ff"], // Example palette colors
                        // Add more colors as needed
                    ],
                    change: function(color) {
                        // This function will be called when the color is changed
                        var textHexColor = color.toHexString(); // Get the chosen color's hex value
                        console.log("Chosen text Color: " + textHexColor);
    
                        // Save the hexColor to a variable or use it as needed in your code
                        textColour = textHexColor;
                    }
                });

                // changing the canvas colour here
                let n_T_lines = MeshsArray[1].length;  // num title lines
                let n_N_lines = MeshsArray[2].length;  // num notes lines
                for (let i = 0; i < n_T_lines; i++){
                    MeshsArray[1][i].material.color.set(textColour); // Change to green
                }
                for (let i = 0; i < n_N_lines; i++){
                    MeshsArray[2][i].material.color.set(textColour); // Change to green
                }

            } else {
                $("#textColourPick").spectrum("destroy");

            } 
        });


        // width and height -> event listener
        $("#widthInput").on("input", function(){
            canvasWidth = parseInt($(this).val());
            $("#widthOutput").text(canvasWidth);
            planeDims = [canvasWidth, canvasHeight];
            console.log("canvasWidth: ", canvasWidth);
            // updating the Meshes Array
            viewer.scene.scene.remove(MeshsArray[0]);
            for (let i = 0; i < MeshsArray[1].length; i++) {
                viewer.scene.scene.remove(MeshsArray[1][i]);
            }
            for (let i = 0; i < MeshsArray[2].length; i++) {
                viewer.scene.scene.remove(MeshsArray[2][i]);
            }
            MeshsArray = updateAnnotation(position, canvasColour, textColour,
                planeDims, fontSize, titleFontPath, 
                title, notes);
        });
        $("#heightInput").change(function(){
            canvasHeight = parseInt($(this).val());
            $("#heightOutput").text(canvasHeight);
            planeDims = [canvasWidth, canvasHeight];
            console.log("canvasHeight: ", canvasHeight);
            // updating the Meshes Array
            viewer.scene.scene.remove(MeshsArray[0]);
            for (let i = 0; i < MeshsArray[1].length; i++) {
                viewer.scene.scene.remove(MeshsArray[1][i]);
            }
            for (let i = 0; i < MeshsArray[2].length; i++) {
                viewer.scene.scene.remove(MeshsArray[2][i]);
            }
            MeshsArray = updateAnnotation(position, canvasColour, textColour,
                planeDims, fontSize, titleFontPath, 
                title, notes);
            
        });

        // fontsize -> event listener
        $("#fontSizeInput").change(function(){
            fontSize = parseInt($(this).val());
            $("#fontSizeOutput").text(fontSize);
            console.log("fontSize: ", fontSize);
			viewer.scene.scene.remove(MeshsArray[0]);
			for (let i = 0; i < MeshsArray[1].length; i++) {
                viewer.scene.scene.remove(MeshsArray[1][i]);
            }
            for (let i = 0; i < MeshsArray[2].length; i++) {
                viewer.scene.scene.remove(MeshsArray[2][i]);
            }
            MeshsArray = updateAnnotation(position, canvasColour, textColour,
                planeDims, fontSize, titleFontPath, 
                title, notes);

        });

         

        // event picker to store the font of title and notes
        $("#titleDropdownSelect").change(function() {
            titleFont = $(this).val();
            titleFontPath = addpath+titleFont;
            console.log("Selected title font: " + titleFontPath);
						// removing the previous text meshes
			viewer.scene.scene.remove(MeshsArray[0]);
			for (let i = 0; i < MeshsArray[1].length; i++) {
                viewer.scene.scene.remove(MeshsArray[1][i]);
            }
            for (let i = 0; i < MeshsArray[2].length; i++) {
                viewer.scene.scene.remove(MeshsArray[2][i]);
            }

			MeshsArray = updateAnnotation(position, canvasColour, textColour,
                planeDims, fontSize, titleFontPath, 
                title, notes);


        });
        // $("#notesDropdownSelect").change(function() {
        //     notesFont = $(this).val();
        //     notesFontPath = addpath+notesFont;
        //     console.log("Selected notes font: " + notesFontPath);
        // });

        // transformation -> event listener
        let delta = 0;
        let prevTX = 0;
        let prevTranslationVector = new THREE.Vector3(0, 0, 0);
        let prevRotationVector = new THREE.Vector3(0, 0, 0);
        $("#translateX, #translateY, #translateZ, #rotateX, #rotateY, #rotateZ").on("input", function() {
            translateX = parseFloat($("#translateX").val());
            translateY = parseFloat($("#translateY").val());
            translateZ = parseFloat($("#translateZ").val());
            rotateX = parseFloat($("#rotateX").val()) * (Math.PI / 180);
            rotateY = parseFloat($("#rotateY").val()) * (Math.PI / 180);
            rotateZ = parseFloat($("#rotateZ").val()) * (Math.PI / 180);
            console.log("MeshsArray.length: ", MeshsArray.length);
            console.log("copyMeshsArray.length: ", copyMeshsArray.length);
            console.log("MeshsArray from translate: ", MeshsArray);
            $("#translateXOutput").text(translateX);
            $("#translateYOutput").text(translateY);
            $("#translateZOutput").text(translateZ);
            $("#rotateXOutput").text(rotateX);
            $("#rotateYOutput").text(rotateY);
            $("#rotateZOutput").text(rotateZ);


            console.log("TRANSLATE/ROTATE: ", translateX, translateY, translateZ, rotateX, rotateY, rotateZ);
             
            // current positions
            let planeMeshPosition = new THREE.Vector3().copy(MeshsArray[0].position);
            let translationVector = new THREE.Vector3(translateX, translateY, translateZ);
            let fixedTranslation = new THREE.Vector3();
            fixedTranslation.add(translationVector);
            fixedTranslation.sub(prevTranslationVector);

            let rotationVector = new THREE.Vector3(rotateX, rotateY, rotateZ);
            let fixedRotation = new THREE.Vector3();
            fixedRotation.add(rotationVector);
            fixedRotation.sub(prevRotationVector);

            // map to see what moved
            const fixedRotationArrayMap = [fixedRotation.x, fixedRotation.y, fixedRotation.z];
            const triggerRotationMap = fixedRotationArrayMap.map(element => (element != 0 ? 1 : 0));
            console.log("TRIGGER ROTATION MAP: ", triggerRotationMap);

            // shifting the plane only
            let planePosition = MeshsArray[0].position;
            
            let MeshsArrayPositions = [];
            // MeshsArrayPositions.push(0);
            MeshsArrayPositions.push(planeMeshPosition);
            MeshsArrayPositions.push([]);
            for (let i=0; i<MeshsArray[1].length; i++) {
                // MeshsArrayPositions[1][i] = MeshsArray[1][i].position;
                MeshsArrayPositions[1][i] = new THREE.Vector3().copy(MeshsArray[1][i].position);
            }
            MeshsArrayPositions.push([]);
            for (let i=0; i<MeshsArray[2].length; i++) {
                // MeshsArrayPositions[2][i] = MeshsArray[2][i].position;
                MeshsArrayPositions[2][i] = new THREE.Vector3().copy(MeshsArray[2][i].position);
            }

            let justTranslation = fixedTranslation.x + fixedTranslation.y + fixedTranslation.z;
            let justRotation = fixedRotation.x + fixedRotation.y + fixedRotation.z;
            // shifting all the meshes -> mesh 0
            if (justTranslation != 0) {
                MeshsArray[0].position.copy(planeMeshPosition.add(fixedTranslation));
            } else {
                MeshsArray[0].rotation.set(rotateX, rotateY, rotateZ);
            }
            // shifting all the meshes -> 1
            let relativePosition = new THREE.Vector3();
            let newTraslatePos = new THREE.Vector3();
            for (let i = 0; i < MeshsArray[1].length; i++) {
                newTraslatePos = MeshsArrayPositions[1][i];
                if (justTranslation != 0) {
                    MeshsArray[1][i].position.copy(newTraslatePos.add(fixedTranslation));
                } else {
                    relativePosition.subVectors(newTraslatePos, planeMeshPosition);
                    // relativePosition.applyEuler(new THREE.Euler(rotateX, rotateY, rotateZ, 'XYZ'));
                    relativePosition.applyEuler(new THREE.Euler(fixedRotation.x, fixedRotation.y, fixedRotation.z, 'XYZ'));
                    // let destinationPosition = new THREE.Vector3();
                    let destinationPosition = new THREE.Vector3().copy(planeMeshPosition).add(relativePosition);
                    // destinationPosition.addVectors(planeMeshPosition, relativePosition);
                    
                    MeshsArray[1][i].position.copy(destinationPosition);
                    MeshsArray[1][i].rotation.set(rotateX, rotateY, rotateZ);
                }
            }

            // shifting all the meshes -> 2
            for (let i = 0; i < MeshsArray[2].length; i++) {
                newTraslatePos = MeshsArrayPositions[2][i];
                if (justTranslation != 0) {
                    MeshsArray[2][i].position.copy(newTraslatePos.add(fixedTranslation));
                } else {
                    relativePosition.subVectors(newTraslatePos, planeMeshPosition);
                    // relativePosition.applyEuler(new THREE.Euler(rotateX, rotateY, rotateZ, 'XYZ'));
                    relativePosition.applyEuler(new THREE.Euler(fixedRotation.x, fixedRotation.y, fixedRotation.z, 'XYZ'));
                    // let destinationPosition = new THREE.Vector3();
                    let destinationPosition = new THREE.Vector3().copy(planeMeshPosition).add(relativePosition);
                    // destinationPosition.addVectors(planeMeshPosition, relativePosition);
                    
                    MeshsArray[2][i].position.copy(destinationPosition);
                    // for the rotation of the text plane itself
                    // MeshsArray[1][i].position.copy(destinationPosition);
                    MeshsArray[2][i].rotation.set(rotateX, rotateY, rotateZ);
                }
            }


            // storing the this steps movement so that we can subtract this from next movement
            prevTranslationVector = new THREE.Vector3(translateX, translateY, translateZ);
            prevRotationVector = new THREE.Vector3(rotateX, rotateY, rotateZ);


			/////////////////////////////////////////////////////////////////
			const point1 = new THREE.Vector3(position[0], position[1], position[2]);  // Coordinates of the first point
			const point2 = new THREE.Vector3(position[0]+translateX, position[1]+translateY, position[2]+translateZ);  // Coordinates of the second point

			/////////////////////////////////////////////////////////////////

        });
          

        

    });
    
    annotationSection.first().click(() => annotationContent.slideToggle());
    annotationSection.insertBefore($('#menu_appearance'));


});


// get mesh information
function getMeshsArrayInfo(MeshsArray) {
    console.log("from function -> MeshsArray.length: ", MeshsArray.length);
    console.log("from function -> what is inside the array: ", MeshsArray)
}


// function for updating the actual annotation
function updateAnnotation(position, canvasColour, TextColour,
                            planeDims, 
                            FONTSIZE, TITLE_FONT, 
                            messageTitle, messageNotes) 
{
    const planeGeometry = new THREE.PlaneGeometry(planeDims[0], planeDims[1]);
    const planeMaterial = new THREE.MeshBasicMaterial({ 
        color: canvasColour, 
        side: THREE.DoubleSide,
        transparent: true, // Enable transparency
        opacity: 0.9, // Set the opacity level (0.5 means semi-transparent)
    }); // Green color
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.position.set(position[0], position[1], position[2]);
    viewer.scene.scene.add(planeMesh);

    // storing all the meshes
    let meshesArray = [];
    meshesArray.push(planeMesh);
    // adding text
    const loader = new THREE.FontLoader();

    // THIS IS FOR TITLE
    loader.load( 
        TITLE_FONT, 
        function ( font ) {
            const color = TextColour;
            // const message = "=== DEMO TEXT === abaracadabra alibaba simsim rain drops";
            const message = messageTitle;
            const maxWidth = planeMesh.geometry.parameters.width;
            const maxHeight = planeMesh.geometry.parameters.height;
            const fontSize = FONTSIZE+2;  // has to be user input
            // console.log("maxWidth: ", maxWidth);
            let [isTitle, num_title_lines, isNotes, num_notes_lines] = [1, 0, 0, 0];
            // console.log("NUMBER OF TITLE LINES BEFORE: ", num_title_lines);
            let blankArray = [];
            let titleTextArray = createTextWithWrap(font, fontSize, messageTitle, TextColour, planeMesh, blankArray);
            let notesTextArray = createTextWithWrap(font, fontSize, messageNotes, TextColour, planeMesh, titleTextArray);
            num_title_lines = titleTextArray.length;
            meshesArray.push(titleTextArray);
            meshesArray.push(notesTextArray);
        }, 
        undefined, 
        function (error) {
            console.error('Error loading font: ', error);
        }
    );



    return meshesArray;
}


Potree.loadPointCloud("http://5.9.65.151/mschuetz/potree/resources/pointclouds/opentopography/CA13_1.4/cloud.js", "CA13", function(e){
    viewer.scene.addPointCloud(e.pointcloud);
    e.pointcloud.position.z = 0;
    let material = e.pointcloud.material;
    material.size = 0.8;
    material.pointSizeType = Potree.PointSizeType.ADAPTIVE;
    material.activeAttributeName = "rgba";
    
    viewer.scene.view.setView(
        [694517.403, 3899262.595, 10642.698],
        [694878.410, 3916332.067, 14.497],
    );
});


function createTextWithWrap(font, fontSize, text, textColour, annotPlaneMesh, titleArraysMesh) {
    const maxWidth = annotPlaneMesh.geometry.parameters.width;
    const maxHeight = annotPlaneMesh.geometry.parameters.height;
    const planeCenter = annotPlaneMesh.position;
    const FontSize = fontSize;
    const words = text.split(' ');
    let currentLine = '';
    let lines = [];

    let textMeshs_array = [];

    // Iterate through the words and wrap the text
    for (const word of words) {
        const testLine = currentLine + word + ' ';
        const { width, height } = calculateTextWidth(testLine, font, FontSize);

        if (width > maxWidth) {
            lines.push(currentLine);
            currentLine = word + ' ';
        } else {
            currentLine = testLine;
        }
    }

    lines.push(currentLine);  // adding the last line
    // console.log("lines: ", lines);
    let yOffset = 0.01*maxHeight;

    // creating textGeometry and Mesh for each line
    for (const line of lines) {
        const { width,  height} = calculateTextWidth(line, font, FontSize);
        const textGeometry = new THREE.TextGeometry(line, {
            font: font,
            size: FontSize,
            height: 0.5
        });

        // const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const textMaterial = new THREE.MeshBasicMaterial({ color: textColour });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        const text_xPos = planeCenter.x-maxWidth/2 + 0.05;
        yOffset = titleArraysMesh.length * 1.2* (fontSize+2) 
                    + textMeshs_array.length * (1.2*fontSize);
        const text_yPos = planeCenter.y +(maxHeight/2)- 1.1*fontSize-yOffset;

        const text_zPos = planeCenter.z;
        textMesh.position.set(text_xPos, text_yPos, text_zPos);
        // yOffset += 1.2*fontSize; // move to the next line
        

        textMeshs_array.push(textMesh);
        viewer.scene.scene.add(textMesh);
    }
    
    return textMeshs_array;
}

function calculateTextWidth(text, font, fontSize) {
    const textGeometry = new THREE.TextGeometry(text, {
        font: font,
        size: fontSize,
        height: 1
    });

    const boundingBox = new THREE.Box3().setFromObject(new THREE.Mesh(textGeometry));
    const width = boundingBox.max.x - boundingBox.min.x;
    const height = boundingBox.max.y - boundingBox.min.y;

    return { width, height};
}
