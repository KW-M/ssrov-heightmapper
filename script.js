var camera, scene, renderer, controls;
var plane, ground, heightModel, savedData = '1,2,3,4,5,6,6\n0,2,2,3,4,5,7\n2,0,2,2,3,5,5\n2,0,0,2,3,4,4\n3,3,0,0,3,4,4\n1,1,0,0,2,4,4';
var maxHeight;
var minHeight;
var depthMaterial, depthTarget, composer;
var materialHeight, materialSea, textureGround;
var optOpen = false, optReversed, optSmooth, optDimensions;
var planeflip = -Math.PI / 2;

var clock = new THREE.Clock();

window.addEventListener('resize', onWindowResize, false);

init();

function init() {
    //Renderer ---------------------------------------//
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0xffffff, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //Scene ---------------------------------------//
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x00264d, 0.12, 1000);

    //camera ---------------------------------------//
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-3.5, 9, -1.8);
    camera.lookAt(scene.position);

    //lights ---------------------------------------//
    hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.4);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 500, 0);
    scene.add(hemiLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(-1, 6, 2);
    dirLight.position.multiplyScalar(500);

    dirLight.castShadow = true;
    dirLight.shadowMapWidth = 2048;
    dirLight.shadowMapHeight = 2048;
    var d = 50;
    dirLight.shadowCameraLeft = -d;
    dirLight.shadowCameraRight = d;
    dirLight.shadowCameraTop = d;
    dirLight.shadowCameraBottom = -d;
    dirLight.shadowCameraFar = 3500;
    scene.add(dirLight);

    ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3); // 0.2
    scene.add(ambientLight);

    //First person controls ---------------------------//
    controls = new THREE.FirstPersonControls(camera);
    controls.movementSpeed = 1;
    controls.lookSpeed = 0.2;
    controls.activeLook = true;
    controls.lat = -63.4;
    controls.lon = 387;

    //textures ---------------------------//
    var textureLoader = new THREE.TextureLoader();
    textureGround = textureLoader.load("./groundTexture.jpg");
    textureGround.repeat.set(4, 4);
    textureGround.wrapS = textureGround.wrapT = THREE.RepeatWrapping;

    //materials ---------------------------//
    var uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.standard.uniforms);
    uniforms.diffuseOriginal = uniforms.diffuse;
    uniforms.reflectivity.value = 0.7;
    uniforms.roughness.value = 0.6;
    materialHeight = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById("vert").textContent,
        fragmentShader: document.getElementById("frag").textContent,
        side: THREE.DoubleSide,
        lights: true,
        //fog: true,
        shading: THREE.FlatShading,
    });
    materialSea = new THREE.MeshPhongMaterial({
        shininess: 3,
        color: 0x00264d,
        specular: 0x0099cc,
        shading: THREE.SmoothShading,
        map: textureGround,
        side: THREE.DoubleSide
    });
    wireframe = new THREE.MeshBasicMaterial({
        wireframe: true,
    });

    //Debugging ---------------------------------------//
    //scene.add(new THREE.AxisHelper( 10 ));

    // functions
    document.querySelector('canvas').addEventListener('mouseleave', function () {
        controls.enabled = false;
    })
    document.querySelector('canvas').addEventListener('mousedown', function (event) {
        controls.onMouseDown(event)
        console.log(controls)
    })
    document.querySelector('canvas').addEventListener('mouseup', function (event) {
        controls.onMouseUp(event)
        controls.enabled = !controls.enabled
    })
    window.addEventListener('keydown', function (event) {
        if (event.keyCode === 13) resetCamera();
    }, false);
    updateTerrain();
    animate();
}



function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
}

function updateTerrain() {
    console.log('updated');
    checkOptions();
    var dataHeight = 1;
    var dataWidth = 1;
    var dataArray = [];
    minHeight = 1000;
    maxHeight = 0;
    var text = $('#new_data').val() || savedData;
    savedData = text;
    var columns = text.split(optDelimiters.rows || "\n");
    console.log(columns);
    dataWidth = columns.length;
    for (var g = 0; g < columns.length; g++) {
        var values = columns[g].split(optDelimiters.columns || ",");
        if (values.length > dataHeight) {
            dataHeight = values.length;
        }
        for (var b = 0; b < values.length; b++) {
            if (values[b] > maxHeight) {
                maxHeight = values[b];
            }
            if (values[b] < minHeight) {
                minHeight = values[b];
            }
        }
    }
    updateScale();
    var heightFactor = 4 / (maxHeight - (minHeight));
    for (var e = 0; e < columns.length; e++) {
        var values2 = columns[e].split(optDelimiters.columns || ",");
        if (values2.length != dataHeight) {
            var catchup = dataHeight - values2.length;
            for (var f = 0; f < catchup; f++) {
                values2 = values2.concat([minHeight]);
            }
        }
        if (optOddFlip) {
            var isEven = e % 2;
            if (isEven !== 0) {
                values2.reverse();
            }
        }
        dataArray = dataArray.concat(values2);
    }
    for (var c = 0; c < dataArray.length; c++) {
        dataArray[c] = dataArray[c] - minHeight;
    }

    if (optDimensions.auto === true) {
        ground = new THREE.PlaneBufferGeometry(dataHeight, dataWidth, dataHeight - 1, dataWidth - 1);
    } else {
        ground = new THREE.PlaneBufferGeometry(optDimensions.height || dataHeight, optDimensions.width || dataWidth, dataHeight - 1, dataWidth - 1);
    }

    ground.dynamic = true;
    ground.castShadow = true;
    ground.receiveShadow = true;


    var counter = 2;//Since the buffer Geometry is one giant array, every third item (index 2) is the y value
    for (var i = 0; i < dataArray.length; i++) {
        ground.attributes.position.array[counter] = dataArray[i];
        counter = counter + 3;//Since the buffer Geometry is one giant array, every third item is the y value
    }

    ground.verticesNeedUpdate = true;
    ground.__dirtyNormals = true;

    ground.computeVertexNormals();
    ground.computeFaceNormals();

    heightModel = new THREE.Geometry().fromBufferGeometry(ground);


    if (optSmooth !== "") {
        var modifier = new THREE.SubdivisionModifier(optSmooth);
        modifier.modify(heightModel);
        //Apply the modifier to our geometry.
    }

    if ($('#vis_type')[0].checked === true) {
        plane = new THREE.Mesh(heightModel, materialSea);
    } else {
        plane = new THREE.Mesh(heightModel, materialHeight);
    }
    plane.rotation.x = -Math.PI / 2;
    if (optReversed === true) {
        plane.scale.z = -heightFactor;
        plane.position.y = plane.position.y + 4;
    } else {
        plane.scale.z = heightFactor;
    }

    plane.name = 'ground';
    if (scene.children[3] !== undefined) {
        scene.remove(scene.children[3]);
        $("#dialog").toggle("slow");
    }
    scene.add(plane);
    resetCamera();
}

function showDialog() {
    $("#dialog").toggle("slow");
    $("#new_data").val('');
}

function toggleColors() {
    if ($('#vis_type')[0].checked === true) {
        scene.fog = new THREE.FogExp2(0x001933, 0.2, 1000);
        document.getElementsByTagName("canvas")[0].style = "background-color:#001933";
        $('#height-scale').hide()
        plane.material = materialSea;
    } else {
        scene.fog = new THREE.FogExp2(0x00264d, 0, 1000);
        document.getElementsByTagName("canvas")[0].style = "background-color:#181818";
        $('#height-scale').show()
        plane.material = materialHeight;
    }

}
function toggleOptions() {
    if (optOpen === false) {
        optOpen = true;
        $("#options_area").addClass('open');
    } else {
        optOpen = false;
        $("#options_area").removeClass('open');
    }
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function resetCamera() {
    camera.position.set(-3.5, 9, -1.8);
    camera.lookAt(scene.position);
    controls.lat = -63.4;
    controls.lon = 387;
}

function render() {

    controls.update(clock.getDelta());
    renderer.render(scene, camera);
}

function checkOptions() {
    optDimensions = { height: document.getElementById("HeightV").value, width: document.getElementById("WidthV").value, auto: document.getElementById("auto_dimensions").checked };
    optDelimiters = { rows: document.getElementById("Delim_Row").value, columns: document.getElementById("Delim_Column").value };
    optReversed = document.getElementById("invert_data").checked;
    optOddFlip = document.getElementById("flip_rows").checked;
    optSmooth = document.getElementById("Smooth_Amount").value;

}

function updateScale() {
    var increment = (Number(maxHeight) - Number(minHeight)) / 9;
    var scaleValue;
    for (var m = 1; m < 10; m++) {
        scaleValue = Number(minHeight) + (Number(increment) * Number(m));
        console.log(maxHeight + "," + minHeight + "+" + increment + "X" + m + "=" + scaleValue);
        document.getElementById("height" + m).textContent = +((Math.round(scaleValue + "e+1") + "e-1"));
    }
}
