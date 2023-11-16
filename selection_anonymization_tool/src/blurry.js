import * as tool from "./tools.js";
import * as alert from "./alert.js";



let handleKeyB_down_Blurry, handleKeyB_up_Blurry, handleMouseDownBlurry, handleMouseMoveBlurry, handleMouseUpBlurry;
let selected3DPoints = [];
let BlurrySelectedPoints;


// Blurry selection
export function blurrySelection(gridSize, blurryIntensity, blurryColorMode, blurryColor, blurryOffsetMode) {
    console.log(blurryColorMode);

    let isDrawing = false;

    let lassoVertices = [];
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00, // Set line color to red
        linewidth: 2,
        side: THREE.DoubleSide
    });
    const lasso = new THREE.Line(lineGeometry, lineMaterial);

    const PointGeometry = new THREE.BufferGeometry();
    let PointMaterial;
    if (blurryColorMode === "random") {
        PointMaterial = new THREE.PointsMaterial({
            size: 8,
            vertexColors: THREE.VertexColors,
            sizeAttenuation: false
        });
    } else if (blurryColorMode === "consistent") {
        PointMaterial = new THREE.PointsMaterial({
            size: 8,
            color: blurryColor,
            sizeAttenuation: false
        });
    }

    BlurrySelectedPoints = new THREE.Points(PointGeometry, PointMaterial);
    
    let remove3DPoints = [];

    let mouseTrajectory = [];
    let pointCloud = viewer.scene.pointclouds[0];

    // Functions for the listen of key B
    let isBKeyPressed = false;
    handleKeyB_down_Blurry = function(event) {
        if (event.key === "B" || event.keyCode === 66) {
            isBKeyPressed = true;
        }
    }
    handleKeyB_up_Blurry = function(event) {
        if (event.key === "B" || event.keyCode === 66) {
            isBKeyPressed = false;
        }
    }

    // Functions for the above eventListeners
    handleMouseDownBlurry = function(event) {
        if (!event.shiftKey && isBKeyPressed && event.button === 1) { // B + Middle button => draw lasso shape / select points / add points
            isDrawing = true;

            lassoVertices = [];
            viewer.scene.scene.add(lasso);

            mouseTrajectory = [];
        } else if (event.shiftKey && isBKeyPressed && event.button === 1) { // Shift + B + Middle button => remove points
            isDrawing = true;
            remove3DPoints = [];
            
            lassoVertices = [];
            viewer.scene.scene.add(lasso);
            mouseTrajectory = [];
        }
    }

    handleMouseMoveBlurry = function(event) {
        if (isDrawing) {
            const vertices = get3DPoint_V1(event);
            if (vertices) {
                lassoVertices.push(vertices.point3D);
                mouseTrajectory.push(vertices.mouse);
                update3DLine();
            }
        }
    }

    handleMouseUpBlurry = function(event) {
        if (!event.shiftKey && isBKeyPressed && event.button === 1) { // B + Middle button => select / add points
            isDrawing = false;
            lassoVertices.push(lassoVertices[0]);
            update3DLine();

            mouseTrajectory = tool.removeDuplicatePoints(mouseTrajectory)
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
                update3DPoints();
                
                viewer.scene.scene.add(BlurrySelectedPoints);
            }

            setTimeout(cleanLine, 200);

        } else if (event.shiftKey && isBKeyPressed && event.button === 1) { // Shift + B + Middle button => remove points
            isDrawing = false;
            lassoVertices.push(lassoVertices[0]);
            update3DLine();

            mouseTrajectory = tool.removeDuplicatePoints(mouseTrajectory)
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
            if (remove3DPoints.length > 0) {
                remove3DPoints = tool.removeDuplicatePoints(remove3DPoints);
                selected3DPoints = tool.removePoints(selected3DPoints, remove3DPoints);
                update3DPoints();
                
                viewer.scene.scene.add(BlurrySelectedPoints);
            }

            setTimeout(cleanLine, 200);
        }
    }
    
    viewer.renderer.domElement.addEventListener("keydown", handleKeyB_down_Blurry);
    viewer.renderer.domElement.addEventListener("keyup", handleKeyB_up_Blurry);
    viewer.renderer.domElement.addEventListener("mousedown", handleMouseDownBlurry);
    viewer.renderer.domElement.addEventListener("mousemove", handleMouseMoveBlurry);
    viewer.renderer.domElement.addEventListener("mouseup", handleMouseUpBlurry);


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
        const numPoints = selected3DPoints.length;
        const boundingBox = pointCloud.boundingBox;
        const boundingBoxSize = boundingBox.getSize(new THREE.Vector3());
        const offset_x = calculateOffset(boundingBoxSize.x);
        const offset_y = calculateOffset(boundingBoxSize.y);
        const offset_z = calculateOffset(boundingBoxSize.z);

        const positions = [];
        const colors = [];

        if (blurryColorMode === "consistent" && !blurryOffsetMode) {
            for (let i = 0; i < numPoints; i++) {
                positions[i * 3] = selected3DPoints[i].position.x;
                positions[i * 3 + 1] = selected3DPoints[i].position.y;
                positions[i * 3 + 2] = selected3DPoints[i].position.z;
            }
        } else if (blurryColorMode === "random" && !blurryOffsetMode) {
            for (let i = 0; i < numPoints; i++) {
                positions[i * 3] = selected3DPoints[i].position.x;
                positions[i * 3 + 1] = selected3DPoints[i].position.y;
                positions[i * 3 + 2] = selected3DPoints[i].position.z;

                // Random color
                let r = Math.random();
                let g = Math.random();
                let b = Math.random();
                colors[3 * i] = r;
                colors[3 * i + 1] = g;
                colors[3 * i + 2] = b;
                PointGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
            }
        } else if (blurryColorMode === "consistent" && blurryOffsetMode) {
            for (let i = 0; i < numPoints; i++) {
                // Random offset
                positions[i * 3] = selected3DPoints[i].position.x + offset_x;
                positions[i * 3 + 1] = selected3DPoints[i].position.y + offset_y;
                positions[i * 3 + 2] = selected3DPoints[i].position.z + offset_z;
            }
        } else if (blurryColorMode === "random" && blurryOffsetMode) {
            for (let i = 0; i < numPoints; i++) {
                // Random offset
                positions[i * 3] = selected3DPoints[i].position.x + offset_x;
                positions[i * 3 + 1] = selected3DPoints[i].position.y + offset_y;
                positions[i * 3 + 2] = selected3DPoints[i].position.z + offset_z;

                // Random color
                let r = Math.random();
                let g = Math.random();
                let b = Math.random();
                colors[3 * i] = r;
                colors[3 * i + 1] = g;
                colors[3 * i + 2] = b;
                PointGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
            }
        }

        PointGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        PointGeometry.computeBoundingSphere();

    }

    function getRaysInsideLasso() {

        let rays = [];
        const boundingBox = new THREE.Box2().setFromPoints(mouseTrajectory);
        const size = boundingBox.getSize(new THREE.Vector2());
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

    function calculateOffset(boundingBoxSize) {
        const offsetFactor = 0.001 + 0.0055556 * (blurryIntensity - 0.1);
        const randomFactor = (tool.gaussianRandom() * 0.5 + 0.5) * tool.randomSign();
        const offset = (offsetFactor * boundingBoxSize) + randomFactor * offsetFactor * boundingBoxSize;

        return offset;
    }

    function cleanLine() {
        viewer.scene.scene.remove(lasso);
    }
}


// Remove blurry event listeners
export function removeBlurryEventListeners() {
    viewer.renderer.domElement.removeEventListener("keydown", handleKeyB_down_Blurry);
    viewer.renderer.domElement.removeEventListener("keyup", handleKeyB_up_Blurry);
    viewer.renderer.domElement.removeEventListener("mousedown", handleMouseDownBlurry);
    viewer.renderer.domElement.removeEventListener("mousemove", handleMouseMoveBlurry);
    viewer.renderer.domElement.removeEventListener("mouseup", handleMouseUpBlurry);
}


// Remove blurred points
export function removeBlurredPoints(hasAlert=true) {
    selected3DPoints = [];
    viewer.scene.scene.remove(BlurrySelectedPoints);
    if (hasAlert)
        alert.windowAlert("Blurry points are removed.");
}