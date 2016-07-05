var camera, scene, renderer, controls;
var depthMaterial, depthTarget, composer;
var materialHeight, materialSea, textureGround;
var plane, ground;
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
    camera.position.z = 3;
    camera.position.y = 3;
    camera.rotation.z = 90;

//lights ---------------------------------------//
        hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.3 );
				hemiLight.color.setHSL( 0.6, 1, 0.6 );
				hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
				hemiLight.position.set( 0, 500, 0 );
				scene.add( hemiLight );
				
				dirLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
				dirLight.position.set( -1, 6, 2 );
				dirLight.position.multiplyScalar( 500 );

				dirLight.castShadow = true;
				dirLight.shadowMapWidth = 2048;
				dirLight.shadowMapHeight = 2048;
				var d = 50;
				dirLight.shadowCameraLeft = -d;
				dirLight.shadowCameraRight = d;
				dirLight.shadowCameraTop = d;
				dirLight.shadowCameraBottom = -d;
				dirLight.shadowCameraFar = 3500;
				scene.add( dirLight );

        ambientLight = new THREE.AmbientLight( 0x404040 , 0.2); // 0.2
        scene.add(ambientLight);
      
      //var spotLight = new THREE.SpotLight(0xffffff, 1, 200, 20, 10);
      //spotLight.position.set( 1, 1, 1);
      //spotLight.rotation.x = 1.025;
      //spotLight.rotation.y = 1.025;
      //spotLight.rotation.z = 1.025;
      
      //camera.add(spotLight);
      //scene.add( camera );
    
//First person controls---------------------------//
    controls = new THREE.FirstPersonControls(camera);
    controls.movementSpeed = 1;
    controls.lookSpeed = 0.1;

//Debugging---------------------------------------//
    console.log(camera); 
    //scene.add(new THREE.AxisHelper( 5 ));

// functions    
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
    var dataHeight = 1;
    var dataWidth = 1;
    var dataArray = [];
    var maxHeight = 0;
    var minHeight = 1000;
    var text = $('#new_data').val() || '1,2,3,4,5,6,6\n0,2,2,3,4,5,7\n2,0,2,2,3,5,5\n2,0,0,2,3,4,4\n3,3,0,0,3,4,4\n1,1,0,0,2,4,4';
    var columns = text.split("\n");
    dataWidth = columns.length;
    for (var g = 0; g < columns.length; g++) {
        var values = columns[g].split(",");
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
    var heightFactor = 5 / (maxHeight - minHeight);
    console.log((maxHeight - minHeight));
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
            dataArray[c] = dataArray[c] - minHeight;
            dataArray[c] = dataArray[c] * heightFactor;
            
        }
    }
    // var reverse = document.getElementById("reverse_data").checked;
    // if (reverse === true) {
    //     planeflip = Math.PI / 2;
    // } else {
    //     planeflip = -Math.PI / 2;
    // }
    console.log(dataArray);
    console.log(dataHeight);
    console.log(dataWidth);
    ground = new THREE.PlaneBufferGeometry(dataHeight, dataWidth, dataHeight - 1, dataWidth - 1);

    ground.dynamic = true;
    ground.castShadow = true;
    ground.receiveShadow = true;
    var counter = 2;
    for (var i = 0; i < dataArray.length; i++) {
        ground.attributes.position.array[counter] = Number(dataArray[i]);
        counter = counter + 3;
    }
    console.log(ground);


    
    ground.verticesNeedUpdate = true;
    ground.__dirtyNormals = true;
    
    // var modifier = new THREE.BufferSubdivisionModifier();
    // modifier.modify( ground );
    // //Apply the modifier to our cloned geometry.
    
    var uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.standard.uniforms);
    uniforms.diffuseOriginal = uniforms.diffuse;
    uniforms.reflectivity.value = 0.7;
    uniforms.roughness.value = 0.6;
    materialHeight = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById("vert").textContent,
        fragmentShader: document.getElementById("frag").textContent,
        side: THREE.DoubleSide,
        lights:true,
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
    ground.computeVertexNormals();
    ground.computeFaceNormals();
    console.log(scene);
    if (scene.children[3] !== undefined) {
        scene.remove(scene.children[3]);
        $("#dialog").toggle("slow");
    }
    console.log(ground);

    plane = new THREE.Mesh(ground, materialHeight);
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
        document.getElementsByTagName("canvas")[0].style = "background-color:#001933"
        plane.material = materialSea;
    } else {
        scene.fog = new THREE.FogExp2(0x00264d, 0, 1000);
        document.getElementsByTagName("canvas")[0].style = "background-color:#181818"
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