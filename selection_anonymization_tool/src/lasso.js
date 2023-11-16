import * as tool from "./tools.js";
import * as alert from "./alert.js";
import {handleVisibleChange, updatePointsStats, updateGroupStats, deleteRow, createCell} from "./gui.js";



let handleMouseDownLasso, handleMouseMoveLasso, handleMouseUpLasso;
let selected3DPoints = [];
let LassoSelectedPoints;


export function lassoSelection(gridSize) {
    // console.log("Selected points: ", selected3DPoints);
    // console.log("gridSize: ", gridSize);

    // Lasso selection
    let isDrawing = false;

    let lassoVertices = [];
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xff0000, // Set line color to red
        linewidth: 1,
        side: THREE.DoubleSide
    });
    const lasso = new THREE.Line(lineGeometry, lineMaterial);
    // const lineGeometry = new THREE.BufferGeometry();
    // const line = new THREE.MeshLine();
    // line.setGeometry(geometry);
    // const lineMaterial = new MeshLineMaterial({
    //     color: new THREE.Color(0xff0000),
    //     lineWidth: 600
    // });
    // const lasso = new THREE.Mesh(line.geometry, material);
    
    const PointGeometry = new THREE.BufferGeometry();
    const PointMaterial = new THREE.PointsMaterial({
        color: 0xffff00,
        size: 4,
        sizeAttenuation: false
    });
    LassoSelectedPoints = new THREE.Points(PointGeometry, PointMaterial);

    if (selected3DPoints.length > 0) {
        update3DPoints();
        viewer.scene.scene.add(LassoSelectedPoints);
    }

    let remove3DPoints = [];

    let mouseTrajectory = [];
    let pointCloud = viewer.scene.pointclouds[0];


    // Functions for the above eventListeners
    handleMouseDownLasso = function(event) {
        if (!event.shiftKey && event.button === 1) { // Middle button => draw lasso shape / select points / add points
            isDrawing = true;

            lassoVertices = [];
            viewer.scene.scene.add(lasso);

            mouseTrajectory = [];
        } else if (event.shiftKey && event.button === 1) { // Shift + Middle button => remove points
            isDrawing = true;
            remove3DPoints = [];
            
            lassoVertices = [];
            viewer.scene.scene.add(lasso);
            mouseTrajectory = [];
        }
    }

    handleMouseMoveLasso = function(event) {
        if (isDrawing) {
            const vertices = get3DPoint_V1(event);
            if (vertices) {
                lassoVertices.push(vertices.point3D);
                mouseTrajectory.push(vertices.mouse);
                update3DLine();
            }
        }
    }

    handleMouseUpLasso = function(event) {
        if (!event.shiftKey && event.button === 1) { // Middle button => select points or Ctrl + Middle button => select / add points
            isDrawing = false;
            lassoVertices.push(lassoVertices[0]);
            update3DLine();

            mouseTrajectory = tool.removeDuplicatePoints(mouseTrajectory)
            // console.log("Number of mouse trajectory points:", mouseTrajectory.length);
            const lassRays = getRaysInsideLasso();
            const raysFromMouse = lassRays.rays;
            
            for (let i = 0; i < raysFromMouse.length; i++) {
                const mouse = raysFromMouse[i];
                const intersectedPoint = get3DPoint_V2(mouse);
                if (intersectedPoint) {
                    for (let j = 0; j < intersectedPoint.length; j++)
                    selected3DPoints.push(intersectedPoint[j]);
                }
            }
            if (selected3DPoints.length > 0) {
                selected3DPoints = tool.removeDuplicatePoints(selected3DPoints);
                updatePointsStats(selected3DPoints);
                // console.log("Selected points: ", selected3DPoints);
                update3DPoints();
                viewer.scene.scene.add(LassoSelectedPoints);
            }

            setTimeout(cleanLine, 200);  // Remove line after 200ms
            // tool.getGridHelper(lassoVertices);

        } else if (event.shiftKey && event.button === 1) { // Shift + Middle button => remove points
            isDrawing = false;
            lassoVertices.push(lassoVertices[0]);
            update3DLine();

            mouseTrajectory = tool.removeDuplicatePoints(mouseTrajectory)
            // console.log("Number of mouse trajectory points:", mouseTrajectory.length);
            const lassRays = getRaysInsideLasso();
            const raysFromMouse = lassRays.rays;

            for (let i = 0; i < raysFromMouse.length; i++) {
                const mouse = raysFromMouse[i];
                const intersectedPoint = get3DPoint_V2(mouse);
                if (intersectedPoint) {
                    for (let j = 0; j < intersectedPoint.length; j++)
                        remove3DPoints.push(intersectedPoint[j]);
                }
            }
            remove3DPoints = tool.removeDuplicatePoints(remove3DPoints);
            selected3DPoints = tool.removePoints(selected3DPoints, remove3DPoints);
            updatePointsStats(selected3DPoints);
            // console.log("Left selected points: ", selected3DPoints);
            update3DPoints();
            viewer.scene.scene.add(LassoSelectedPoints);

            setTimeout(cleanLine, 200);  // Remove line after 200ms
        }
    }

    viewer.renderer.domElement.addEventListener("mousedown", handleMouseDownLasso);
    viewer.renderer.domElement.addEventListener("mousemove", handleMouseMoveLasso);
    viewer.renderer.domElement.addEventListener("mouseup", handleMouseUpLasso);


    // Version 1: the vertices of lasso shape are on the virtual plane (parallel to the screen)
    function get3DPoint_V1(event) {
        const rect = viewer.renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        const mouse = new THREE.Vector2(event.clientX, event.clientY);
        
        const camera = viewer.scene.getActiveCamera();
        const rayCaster = new THREE.Raycaster();
        rayCaster.setFromCamera(new THREE.Vector2(x, y), camera);

        const targetPoint = new THREE.Vector3(0, 0, -1).unproject(camera);
        const planeNormal = new THREE.Vector3().subVectors(targetPoint, camera.position).normalize();
        const planeDistance = camera.near * 5;
        const planePoint = camera.position.clone().add(planeNormal.clone().multiplyScalar(planeDistance));
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planePoint);

        const point3D = new THREE.Vector3();
        const isIntersecting = rayCaster.ray.intersectPlane(plane, point3D);

        return {point3D, mouse};
    }

    // Version 2: the vertices of lasso shape are on the 3D point cloud
    function get3DPoint_V2(mouse, min_length) {
        const rect = viewer.renderer.domElement.getBoundingClientRect();
        const x = ((mouse.x - rect.left) / rect.width) * 2 - 1;
        const y = -((mouse.y - rect.top) / rect.height) * 2 + 1;

        const camera = viewer.scene.getActiveCamera();
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
        const ray = raycaster.ray;

        let pickParams = {};
        pickParams.pickClipped = true;
        pickParams.x = mouse.x - rect.left;
        pickParams.y = rect.height - mouse.y;
        pickParams.all = true;
        pickParams.pickWindowSize = min_length;
        pickParams.gridSize = gridSize;

        const points_list = tool.pickPoint(pointCloud, viewer, camera, ray, pickParams);
        // console.log(points_list);

        return points_list;
    }

    function update3DLine() {
        const positions = [];
        for (let i = 0; i < lassoVertices.length; i++) {
            positions.push(lassoVertices[i].x, lassoVertices[i].y, lassoVertices[i].z);
        }
        lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        lineGeometry.computeBoundingSphere();
        lineGeometry.attributes.position.needsUpdate = true;
    }

    function update3DPoints() {
        const positions = [];
        for (let i = 0; i < selected3DPoints.length; i++) {
            positions[i * 3] = selected3DPoints[i].position.x;
            positions[i * 3 + 1] = selected3DPoints[i].position.y;
            positions[i * 3 + 2] = selected3DPoints[i].position.z;
        }
        PointGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        PointGeometry.computeBoundingSphere();
    }

    function getRaysInsideLasso() {
        // const gridSize = 10; // unit: pixel on screen
        let rays = [];
        const boundingBox = new THREE.Box2().setFromPoints(mouseTrajectory);
        // console.log("Bounding box:", boundingBox);
        const size = boundingBox.getSize(new THREE.Vector2());
        // console.log("Bounding box size:", size);
        const x_step = Math.ceil(size.x / gridSize);
        const y_step = Math.ceil(size.y / gridSize);

        for (let i = 0; i < x_step; i++) {
            for (let j = 0; j < y_step; j++) {
                const x = boundingBox.min.x + i * gridSize;
                const y = boundingBox.min.y + j * gridSize;
                const point = new THREE.Vector2(x, y);
                if (tool.isPointInsidePolygon(point, mouseTrajectory)) {
                    rays.push(point);
                }
            }
        }

        return {rays};
    }

    function cleanLine() {
        viewer.scene.scene.remove(lasso);
    }
}


// Remove lasso event listeners
export function removeLassoEventListeners() {
    viewer.renderer.domElement.removeEventListener("mousedown", handleMouseDownLasso);
    viewer.renderer.domElement.removeEventListener("mousemove", handleMouseMoveLasso);
    viewer.renderer.domElement.removeEventListener("mouseup", handleMouseUpLasso);
}


// Remove selected points
export function removeLassoSelectedPoints(withAlert, keepSelection) {
    if (selected3DPoints.length > 0) {
        if (keepSelection) {
            viewer.scene.scene.remove(LassoSelectedPoints);
            LassoSelectedPoints.geometry.dispose();
            LassoSelectedPoints.material.dispose();
            updatePointsStats(selected3DPoints);
        } else {
            selected3DPoints = [];
            viewer.scene.scene.remove(LassoSelectedPoints);
            LassoSelectedPoints.geometry.dispose();
            LassoSelectedPoints.material.dispose();
            updatePointsStats(selected3DPoints);
        }
        if (withAlert) {
            alert.windowAlert("All selected points are cleaned.");
        }
    } else {
        if (withAlert) {
            alert.windowAlert("No point is selected.");
        }
    }
    
}


// Save selected points
export async function saveLassoSelectedPoints(SavedPointsSets) {
    if (LassoSelectedPoints instanceof THREE.Points && LassoSelectedPoints.geometry.attributes.position instanceof THREE.BufferAttribute) {
        let userName = await alert.getUserInput();
        if (userName in SavedPointsSets) {
            alert.windowAlert("This name already exists.");
        } else {
            // deep copy
            const ectypeGeometry = LassoSelectedPoints.geometry.clone();
            const PointMaterial = new THREE.PointsMaterial({
                name: userName,
                color: alert.getColor(),
                size: 4,
                sizeAttenuation: false
            });
            const ectypePoints = new THREE.Points(ectypeGeometry, PointMaterial);
            SavedPointsSets[userName] = ectypePoints;

            updateGroupStats(Object.keys(SavedPointsSets).length);
            
            toTableRow(SavedPointsSets, userName);
            // console.log(ectypePoints.material.name);
            alert.cleanInput();
            removeLassoSelectedPoints(false, false);
            viewer.scene.scene.add(SavedPointsSets[userName])
        }
    } else {
        alert.windowAlert("No point is selected.");
    }
}


// ToTable
export function toTableRow(dictionary, userName) {
    let tableBody = document.getElementById("tableBody");
    let row = tableBody.insertRow();
    
    createCell(row, userName);
    createCell(row, dictionary[userName].geometry.attributes.position.count);
    
    console.log(dictionary[userName].material.color.getHexString());
    createCell(row, "", "color", "#" + dictionary[userName].material.color.getHexString());

    createCell(row, "", "checkbox", {
        id: `${userName}-checkbox`,
        checked: true,
        changeHandler: handleVisibleChange
    });

    createCell(row, "", "button", {
        id: `${userName}-button`,
        text: "Delete",
        clickHandler: deleteRow
    });

    
    setTimeout(() => {
        alert.windowAlert("Saved successfully.");
    }, 1000);
}


