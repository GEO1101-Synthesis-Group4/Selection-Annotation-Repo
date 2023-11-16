import * as gui from "./gui.js";



window.viewer = new Potree.Viewer(document.getElementById("potree_render_area"));
viewer.setEDLEnabled(true);
viewer.setFOV(70);
viewer.setPointBudget(1*1000*1000);
viewer.loadSettingsFromURL();
viewer.setDescription("");




loadData();
gui.loadGUI();



// Load point cloud data
function loadData(){
    let scene = viewer.scene;

    // let dataPathOfficial = "../data/AHN/C_51CN2_AHN3/metadata.json"
    // let dataNameOfficial = "AHN3";

    // let dataPathOfficial = "../data/AHN/tileconverted5/cloud.js"
    // let dataNameOfficial = "AHN2";

    let dataPathOfficial = "../Potree_1.7/pointclouds/lion_takanawa/cloud.js"
    let dataNameOfficial = "Lion";


    Potree.loadPointCloud(dataPathOfficial, dataNameOfficial, (data) => {
        scene.addPointCloud(data.pointcloud);
        // Set point cloud material
        let material = data.pointcloud.material;
        material.size = 1;
        material.color = new THREE.Color(0xFFFFFF);
        // material.pointSizeType = Potree.PointSizeType.ADAPTIVE;
        material.pointSizeType = Potree.PointSizeType.FIXED;
        // Make point cloud fit to screen
        viewer.fitToScreen();
    });
}