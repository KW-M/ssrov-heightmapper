var camera, scene, renderer;
var plane, ground;
var materialHeight, materialSea, textureGround;
var controls;
var planeflip = -Math.PI / 2;
var clock = new THREE.Clock();
init();

function init() {
    var textureLoader = new THREE.TextureLoader();
    textureGround = textureLoader.load("./groundTexture.jpg");
    textureGround.repeat.set(4, 4);
    textureGround.wrapS = textureGround.wrapT = THREE.RepeatWrapping;
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0xffffff, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize, false);
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x00264d, 0.12, 1000);
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3;
    camera.position.y = 3;
    camera.rotation.z = 90;
    ambientLight = new THREE.AmbientLight(0x333333); // 0.2
    light = new THREE.DirectionalLight(0xFFFFFF, 0.75);
    scene.add(ambientLight);
    console.log(light);
    light.rotation.y = 0.025;
    light.rotation.y = 0.025;
    light.rotation.y = 0.025;
    scene.add(light);
    controls = new THREE.FirstPersonControls(camera);
    controls.movementSpeed = 1;
    controls.lookSpeed = 0.1;
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

    var dataHeight = 1;
    var dataWidth = 1;
    var dataArray = [];
    var maxHeight = 0,
        minHeight = 1000;
    var text = $('#new_data').val() || '1.5,1,1,1\n1,1,1,1\n1,1,1,1\n1,1,1,1\n1,1,1,1\n1,1,1,1\n1,1,1,1';
    var columns = text.split("\n");
    dataWidth = columns.length;
    for (var g = 0; g < columns.length; g++) {
        var values = columns[g].split(",");
        if (values.length > dataHeight) {
            dataHeight = values.length;
        }
        for (var b = 0; b < values.length; b++) {
            if (values[b] > dataHeight) {
                maxHeight = values[b];
            }
            if (values[b] < dataHeight) {
                minHeight = values[b];
            }
        }
    }
    var heightFactor;
    if (maxHeight - minHeight > 8) {
        heightFactor = 8 / (maxHeight - minHeight);
    }
    for (var e = 0; e < columns.length; e++) {
        var values2 = columns[e].split(",");
        if (values2.length != dataHeight) {
            var catchup = dataHeight - values2.length;
            for (var f = 0; f < catchup; f++) {
                values2 = values2.concat([0]);
            }
        }
        dataArray = dataArray.concat(values2);
        for (var c = 0; c < dataArray.length; c++) {
            dataArray[c] = dataArray[c] * heightFactor || dataArray[c];
            //dataArray[c] = dataArray[c] - minHeight;
        }
    }
    var reverse = document.getElementById("reverse_data").checked;
    if (reverse === true) {
        planeflip = Math.PI / 2;
    } else {
        planeflip = -Math.PI / 2;
    }
    console.log(dataArray);
    console.log(dataHeight);
    console.log(dataWidth);
    ground = new THREE.PlaneBufferGeometry(dataHeight, dataWidth, dataHeight - 1, dataWidth - 1);
    ground.dynamic = true;
    console.log(ground);
    var counter = 2;
    for (var i = 0; i < dataArray.length; i++) {
        console.log(dataArray[i]);
        ground.attributes.position.array[counter] = Number(dataArray[i]);
        counter = counter + 3;
    }
    ground.verticesNeedUpdate = true;
    ground.__dirtyNormals = true;
    var Shader = THREE.ShaderLib.standard;
    var uniforms = THREE.UniformsUtils.clone(Shader.uniforms);
    console.log(uniforms);
    
    console.log(Shader.vertexShader);
    console.log(Shader.fragmentShader);
    uniforms.diffuseOriginal = uniforms.diffuse;
    uniforms.reflectivity.value = 0.7;
    uniforms.roughness.value = 0.6;
    materialPhong = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById("vert").textContent,
        fragmentShader: document.getElementById("frag").textContent,
        side: THREE.DoubleSide,
        lights:true,
        //fog: true,
        shading: THREE.SmoothShading,
    });
    materialHeight = new THREE.ShaderMaterial({
        vertexShader: document.getElementById("vert").textContent,
        fragmentShader: document.getElementById("frag").textContent,
        side: THREE.DoubleSide,
        lights: true
    });
    materialSea = new THREE.MeshPhongMaterial({
        shininess: 3,
        color: 0x00264d,
        specular: 0x0099cc,
        shading: THREE.SmoothShading,
        map: textureGround,
        side: THREE.DoubleSide
    });
    material = new THREE.MeshBasicMaterial({
        wireframe: true,
    });
    ground.computeVertexNormals();
    ground.computeFaceNormals();
    if (scene.children[2] !== undefined) {
        console.log(scene.children[2]);
        scene.remove(scene.children[2]);
        $("#dialog").toggle("slow");
    }
    console.log(ground);

    plane = new THREE.Mesh(ground, materialPhong);
    console.log(planeflip);
    plane.rotation.x = planeflip;
    plane.name = 'ground';
    scene.add(plane);
    console.log(scene);
    resetCamera();
}

function showDialog() {
    console.log('showing');
    $("#dialog").toggle("slow");
    $("#new_data").val('');
}

function toggleColors() {
    if ($('#vis_type')[0].checked === true) {
        scene.fog = new THREE.FogExp2(0x001933, 0.2, 1000);
        plane.material = materialSea;
    } else {
        scene.fog = new THREE.FogExp2(0x00264d, 0, 1000);
        plane.material = materialHeight;
    }

}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function resetCamera() {

    console.log(controls);
    controls.object.position.x = 0;
    controls.object.position.y = 3;
    controls.object.position.z = -1;
    controls.object.rotation.y = 0; // Rotates Yaw Object
    console.log(controls.object);
}

function render() {
    //console.log(camera.rotation);

    controls.update(clock.getDelta());
    renderer.render(scene, camera);
}