/**
 * Created by Pater on 4/3/2017.
 */

var scoliosisApp = function () {

    var view = this;

    view.dicomShift = new THREE.Vector3(500,0,10);

    view.waistOffset = -30;

    view.dicoms = [];

    view.guiScan = new dat.GUI();

    view.actionRecorder = new actionRecorder(view);

    view.guiScan.add(view,'export').name('export OBJ');

    view.meshModifier = new meshModifier(view);

    view.timer = 0;

    view.wrapSurface = new wrapSurface({

        nurbsSurfaceSetting:{

            U: 40, // 80
            V: 25, // 50
            height:480,
            offset: 0,
            center: [0,0,0]

        }

    });

    view.surfaceMorph = new surfaceMorph({

        controlCurves: ['src/models/curve1.txt','src/models/curve2.txt'],

        quad: true,

        actionRecorder: view.actionRecorder,

        app: view

    });



    view.stage = 0;

    view.dragInFile();

    view.loadBrace();

    view.addGuild();

    view.setupTransformControl();

    view.setupCamera();

    //view.importScan('src/models/KB3217.obj');
    //view.importScan('src/models/body_reduced.obj');
    //view.importScan('src/models/correctedScan.obj');



};

scoliosisApp.prototype.setupCamera = function () {

    var view = this;

    view.cameraParam = {


        position: 'perspective',

        updatePosition: function () {

            camera = orthographic;

            if(view.cameraParam.position == 'left') camera.position.set(-800,0,0);
            if(view.cameraParam.position == 'right') camera.position.set(800,0,0);

            if(view.cameraParam.position == 'top') camera.position.set(0,800,0);
            if(view.cameraParam.position == 'bottom') camera.position.set(0,-800,0);

            if(view.cameraParam.position == 'front') camera.position.set(0,0,800);
            if(view.cameraParam.position == 'back') camera.position.set(0,0,-800);



            if(view.cameraParam.position == 'perspective') {
                camera = perspective;
                camera.position.set(-800,800,800);

                if(view.stage > 0) view.guild.visible = false;

            }else{

                view.guild.visible = true;

            }

            camera.remove(light);
            scene.remove(camera);

            camera.add(light);
            scene.add(camera);

            controls.dispose();

            controls = new THREE.OrbitControls( camera, renderer.domElement );
            controls.target.set( 0, 0, 0 );
            //controls.addEventListener( 'change', render );
            controls.enableDamping = true;

            if(view.cameraParam.position == 'perspective') controls.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };
            else  controls.mouseButtons = { ORBIT: null, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.LEFT };

            controls.target.set( 0, 0, 0 );

            view.diposeTranformControl();
            view.setupTransformControl();

            view.meshModifier.diposeTranformControl();
            view.meshModifier.setupTransformControl();


            onWindowResize();




        }

    };


    view.guiScan.add(view.cameraParam,'position',['perspective','left','right','front','back','top','bottom']).name('view').onChange(view.cameraParam.updatePosition);


};

scoliosisApp.prototype.importScan = function (URL) {


    var view = this;

    $('#text').text('Loading 3D scan file');

    new THREE.OBJLoader().load(URL,function (object) {

        var mesh = object.children[0];

        //scene.add(mesh);


        centerBufferGeometry(mesh.geometry);
        mesh.rotation.y = alignBufferGeometry(mesh.geometry);
        mesh.geometry.computeBoundingBox();

        var scale = 1000;
        //var scale = prompt('please input the scale of the scan relative to mm','1');
        scale = Number(scale);
        if(mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y< 10) mesh.scale.set(scale,scale,scale);
        mesh.updateMatrixWorld();
        mesh.updateMatrix();
        applyTransformation(mesh);

        console.log(mesh);

        mesh.geometry = new THREE.Geometry().fromBufferGeometry(mesh.geometry);
        mesh.material.transparent = true;
        mesh.material.opacity = 0.75;
        mesh.material.depthWrite = false;
        //mesh.material.depthTest = false;
        //mesh.material.side = THREE.DoubleSide;
        mesh.geometry.mergeVertices();
        mesh.geometry.computeVertexNormals();
        mesh.material.color.setHex(0x49697a);

        if(view.texture) {
            mesh.material.map = view.texture;
            mesh.material.color.setHex(0xffffff);
        }

        addNormal(mesh.geometry);





        // view.actionRecorder.saveMesh(mesh,0);
        //
        // view.scan = mesh;
        //
        // view.scan.matrixWorldOld = view.scan.matrixWorld.clone();
        //
        // var param = {
        //
        //     color: new THREE.Color(),
        //
        //
        //     update: function () {
        //
        //         mesh.material.color.r = param.color.r / 255;
        //         mesh.material.color.g = param.color.g / 255;
        //         mesh.material.color.b = param.color.b / 255;
        //
        //
        //     }
        //
        // };
        //
        //
        //
        // view.guiScan = new dat.GUI();
        //
        //
        // view.guiScan.add(view.guild,'visible').name('show guild plane');
        // var material = view.guiScan.addFolder('material');
        // material.add(mesh.material,'opacity',0,1);
        // material.add(mesh.material,'wireframe');
        // material.addColor(param,'color').onChange(param.update);
        //
        // view.next = view.guiScan.add(view,'editScan');

        view.loadScanMesh(mesh);

        view.actionRecorder.recordTransform();

        $('#text').text('Please orientate 3D scan to the center of grid');

    });




};

scoliosisApp.prototype.loadScanMesh = function (mesh) {

    var view = this;

    mesh.positionOld = mesh.position.clone();
    mesh.rotationOld = {x:mesh.rotation.x,y:mesh.rotation.y,z:mesh.rotation.z};



    addNormal(mesh.geometry);

    view.scan = mesh;

    view.actionRecorder.saveMesh(mesh,0);
    view.actionRecorder.loadMesh(view.scan,0);

    scene.add(view.scan);

    scene.add(view.transromControl); // transformControl is added after scan to be always on top of it

    view.scan.matrixWorldOld = view.scan.matrixWorld.clone();

    var param = {

        color: new THREE.Color(),

        showColor: true,


        update: function () {

            mesh.material.color.r = param.color.r / 255;
            mesh.material.color.g = param.color.g / 255;
            mesh.material.color.b = param.color.b / 255;

            if(param.showColor){

                mesh.material.map = view.texture;
                mesh.material.color.setHex(0xffffff);
                mesh.material.needsUpdate = true;

            }else{

                mesh.material.map = null;
                mesh.material.color.setHex(0x49697a);
                mesh.material.needsUpdate = true;

            }

        }

    };




    var material = view.guiScan.addFolder('Material');

    material.add(param,'showColor').onChange(param.update);
    material.add(mesh.material,'opacity',0,1);
    // material.add(mesh.material,'wireframe');
    // material.addColor(param,'color').onChange(param.update);

    view.next = view.guiScan.add(view,'editScan');

};

scoliosisApp.prototype.loadBrace = function () {

    // preload

    var view = this;

    var loader = new THREE.PLYLoader().load('src/models/quad1.ply',function (object) {


        var mesh = new THREE.Mesh(object, new THREE.MeshPhongMaterial());

        mesh.material.vertexColors = THREE.VertexColors;
        mesh.material.side = THREE.DoubleSide;

        var newGeo = new THREE.Geometry().fromBufferGeometry(mesh.geometry);

        newGeo.vertices_quad = mesh.geometry.vertices_quad;

        newGeo.normals_quad = mesh.geometry.normals_quad;

        newGeo.colors_quad = mesh.geometry.colors_quad;

        newGeo.faces_quad = mesh.geometry.faces_quad;

        mesh.geometry = newGeo;

        view.braceMesh1 = mesh;

    });


    loader = new THREE.PLYLoader().load('src/models/full4.ply',function (object) {


        var mesh = new THREE.Mesh(object, new THREE.MeshPhongMaterial());

        mesh.material.vertexColors = THREE.VertexColors;
        mesh.material.side = THREE.DoubleSide;

        var newGeo = new THREE.Geometry().fromBufferGeometry(mesh.geometry);

        //newGeo.mergeVertices();

        newGeo.vertices_quad = mesh.geometry.vertices_quad;

        newGeo.normals_quad = mesh.geometry.normals_quad;

        newGeo.colors_quad = mesh.geometry.colors_quad;

        newGeo.faces_quad = mesh.geometry.faces_quad;

        mesh.geometry = newGeo;

        mesh.material.shading = THREE.SmoothShading;

        view.braceMesh2 = mesh;

        $('#text').text('Please drag in patient files');

    });

};

scoliosisApp.prototype.editScan = function () {

    var view = this;

    view.stage = 1; // stage 1 = edit planes

    view.closeTransform(); // hide transform control

    view.guild.visible = false; // hide guild planes

    applyTransformation(view.scan); // apply transformation to geometry vertices


    view.actionRecorder.startPlane();// store the geometry and transformation, register step at mile stone 0

    console.log('Start to edit scan!');

    view.meshModifier.start();
    view.meshModifier.setupPlanes();

    // change gui buttons for next stage
    view.guiScan.remove(view.next);
    view.next = view.guiScan.add(view,'confirmPlanes');


    $('#text').text('Please use menu to insert control planes');

};

scoliosisApp.prototype.confirmPlanes = function () {

    var view = this;

    $('#text').text('Processing, please wait...');

    setTimeout(function () {

        view.stage = 2; // stage 2 = edit mesh control pts

        view.meshModifier.setupCurveMorph();


        // record starting positions of control curves, register step at mile stone 1
        view.actionRecorder.recordMeshEdit('--start edit scan--',1);

        // change gui buttons for next stage
        view.guiScan.remove(view.next);
        view.next = view.guiScan.add(view,'confirmControlCurves');

        $('#text').text('Please move the curve or point to edit scan');


    },50);



};

scoliosisApp.prototype.confirmControlCurves = function () {

    var view = this;

    view.stage = 3; // stage 3 = brush the mesh

    view.actionRecorder.startBrush(2);


    view.meshModifier.openBrush();

    // change gui buttons for next stage
    view.guiScan.remove(view.next);
    view.next = view.guiScan.add(view,'confirmScan');

    $('#text').text('Please click on the scan to sculpt or smooth');

};

scoliosisApp.prototype.confirmScan = function (loadFromFile) {

    var view = this;

    $('#text').text('Processing, please wait...');

    setTimeout(function () {

        view.stage = 4; // stage 4 = edit brace control pts


        // change gui buttons for next stage
        if(view.next) view.guiScan.remove(view.next);
        view.next = null;

        view.meshModifier.hide(); // hide meshModifier

        if(!loadFromFile) view.wrapSurface.start(view.scan);

        view.surfaceMorph.start(view.wrapSurface.verbSurface, view.braceMesh1, view.braceMesh2); // setup the brace morphing on the scan

        view.actionRecorder.saveMesh(view.scan,3); // save mesh for stage 3 *this is only for file loading*

        if(!loadFromFile)  view.actionRecorder.recordBraceEdit('--start edit brace--',3);

        // to fix asynchronous issue
        if(loadFromFile) view.actionRecorder.list[view.actionRecorder.list.length-1].execute();

        $('#text').text('Please move control points to edit brace');

    },50);

};

scoliosisApp.prototype.addGuild = function () {

    var view = this;

    var guild = new THREE.Group();
    // var geometry = new THREE.PlaneBufferGeometry( 300, 300 );
    // var material = new THREE.MeshPhongMaterial( { color: 0xffffff, transparent: true , opacity: 0.2, side:THREE.DoubleSide } );
    // var mesh = new THREE.Mesh( geometry, material );
    // mesh.rotation.x = -Math.PI/2;
    // guild.add( mesh );
    //
    // geometry = new THREE.PlaneBufferGeometry( 300, 800 );
    // mesh = new THREE.Mesh( geometry, material );
    // guild.add( mesh );
    //
    //
    // geometry = new THREE.PlaneBufferGeometry( 300, 800 );
    // mesh = new THREE.Mesh( geometry, material );
    // mesh.rotation.y = -Math.PI/2;
    // guild.add( mesh );
    //
    scene.add(guild);

    view.guild = guild;


    var grid = new THREE.GridHelper( 400, 800 );
    grid.rotation.x = -Math.PI/2;
    grid.material.opacity = 0.25;
    grid.material.transparent = true;
    guild.add( grid );


    grid = new THREE.GridHelper( 400, 80 );
    grid.rotation.x = -Math.PI/2;
    grid.material.opacity = 0.5;
    grid.material.transparent = true;
    guild.add( grid );

    grid = new THREE.GridHelper( 400, 8 );
    grid.rotation.x = -Math.PI/2;
    grid.material.opacity = 1;
    grid.material.transparent = false;
    guild.add( grid );

    var grid = new THREE.GridHelper( 400, 800 );
    grid.rotation.z = -Math.PI/2;
    grid.material.opacity = 0.25;
    grid.material.transparent = true;
    guild.add( grid );

    grid = new THREE.GridHelper( 400, 80 );
    grid.rotation.z = -Math.PI/2;
    grid.material.opacity = 0.5;
    grid.material.transparent = true;
    guild.add( grid );

    grid = new THREE.GridHelper( 400, 8 );
    grid.rotation.z = -Math.PI/2;
    grid.material.opacity = 1;
    grid.material.transparent = false;
    guild.add( grid );

    var grid = new THREE.GridHelper( 400, 800 );
    grid.material.opacity = 0.25;
    grid.material.transparent = true;
    guild.add( grid );

    grid = new THREE.GridHelper( 400, 80 );
    grid.material.opacity = 0.5;
    grid.material.transparent = true;
    guild.add( grid );

    grid = new THREE.GridHelper( 400, 8 );
    grid.material.opacity = 1;
    grid.material.transparent = false;
    guild.add( grid );

    view.guiScan.add(view.guild,'visible').name('Show Grid').listen();

};

scoliosisApp.prototype.importDICOM = function (URL) {


    var view = this;

    view.previousText = $('#text').text() != 'Loading Dicom files' ?  $('#text').text(): view.previousText;
    $('#text').text('Loading Dicom files');

    var LoadersVolume = AMI.default.Loaders.Volume;
    var HelpersStack = AMI.default.Helpers.Stack;

    var loader = new LoadersVolume(container);
    var t2 = [
        URL
    ];

    var files = t2.map(function(v) {
        return v;
    });

    loader.load(files)
        .then(function() {


            // merge files into clean series/stack/frame structure
            var series = loader.data[0].mergeSeries(loader.data);
            var stack = series[0].stack[0];
            loader.free();
            loader = null;
            // be carefull that series and target stack exist!
            var stackHelper = new HelpersStack(stack);
            stackHelper.bbox.color = 0xFFFFFF;
            stackHelper.border.color = 0xFFFFFF;

            //scene.add(stackHelper);
            //scene.add(stackHelper.children[1].children[0]);
            //console.log(stackHelper);



            // build the gui

            //center camera and interactor to center of bouding box
            // var centerLPS = stackHelper.stack.worldCenter();
            // camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
            // camera.updateProjectionMatrix();
            // controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

            var material = stackHelper.children[1].children[0].material;

            material.transparent = true;
            material.depthTest = true;
            material.depthWrite = true;

            material.uniforms.opacity = { type: "f", value: 0.8 };
            material.uniforms.fixedMatrix = { type: "m4", value: stackHelper.children[1].children[0].matrix.clone() };

            material.vertexShader = document.getElementById( 'vertexshader_DICOM' ).textContent;
            material.fragmentShader = document.getElementById( 'fragmentshader_DICOM' ).textContent;



            makeUI();
            function makeUI() {

                var group = new THREE.Group();

                group.add(stackHelper);

                group.position.copy(view.dicomShift);
                view.dicomShift.x += 500;

                scene.add(group);

                // keep scan on top
                scene.remove(view.scan);
                scene.add(view.scan);

                // keep transform control on top
                scene.remove( view.transromControl );
                scene.add( view.transromControl );

                // populate dicom list
                if(!view.dicomList) view.dicomList = view.guiScan.addFolder('dicoms');
                view.dicomList.add(group,'visible').name('dicom'+ (view.dicoms.length+1));
                view.dicomList.open();

                var mesh = stackHelper.children[1].children[0];

                mesh.wrapper = group;

                view.dicoms.push(mesh);

                setupGUI(stackHelper,mesh);



                var geometry = stackHelper.children[1].children[0].geometry;
                geometry.computeBoundingBox();
                var sizeX = geometry.boundingBox.max.x - geometry.boundingBox.min.x ;
                var sizeY = geometry.boundingBox.max.y - geometry.boundingBox.min.y ;
                var sizeZ = geometry.boundingBox.max.z - geometry.boundingBox.min.z ;


                // scale down the Xray if it is larger than 500
                sizeX *=  stackHelper.children[1].children[0].scale.x;
                sizeY *=  stackHelper.children[1].children[0].scale.y;
                sizeZ *=  stackHelper.children[1].children[0].scale.z;

                var defultScale = sizeY > 500? 500/sizeY:1;


                stackHelper.scale.set(defultScale,defultScale,defultScale);
                stackHelper.rotation.z = Math.PI;

                stackHelper.position.set(
                    sizeX * defultScale /2 - geometry.boundingBox.min.x,
                    sizeY * defultScale /2 - geometry.boundingBox.min.y,
                    sizeZ * defultScale /2 - geometry.boundingBox.min.z
                );

                gui.add(stackHelper.scale,'x').step(0.01).name('scale').onChange(function () {
                    stackHelper.scale.set(stackHelper.scale.x,stackHelper.scale.x,stackHelper.scale.x);

                });
                gui.add(material.uniforms.opacity,'value',0,1).name('opacity');

            }

            $('#text').text(view.previousText);

        })
        .catch(function(error) {
            window.console.log('oops... something went wrong...');
            window.console.log(error);
        });



    function setupGUI(stackHelper,mesh) {

        console.log('adding gui');

        var stack = stackHelper.stack;
        gui = new dat.GUI();

        mesh.imageUI = gui;


        // stack
        // var stackFolder = gui.addFolder('Stack');
        // // index range depends on stackHelper orientation.
        // var index = stackFolder.add(
        //     stackHelper, 'index', 0, stack.dimensionsIJK.z - 1).step(1).listen();
        // var orientation = stackFolder.add(
        //     stackHelper, 'orientation', 0, 2).step(1).listen();
        // orientation.onChange(function(value) {
        //     index.__max = stackHelper.orientationMaxIndex;
        //     // center index
        //     stackHelper.index = Math.floor(index.__max/2);
        // });
        // stackFolder.open();

        // slice
        var sliceFolder = gui.addFolder('Image');
        sliceFolder.add(
            stackHelper.slice, 'windowWidth', 1, stack.minMax[1] - stack.minMax[0])
            .step(1).listen();
        sliceFolder.add(
            stackHelper.slice, 'windowCenter', stack.minMax[0], stack.minMax[1])
            .step(1).listen();
        sliceFolder.add(stackHelper.slice, 'intensityAuto').listen();
        sliceFolder.add(stackHelper.slice, 'invert');
        sliceFolder.open();

        $(mesh.imageUI.domElement).attr("hidden", true);
       // gui.close();

        // // bbox
        // var bboxFolder = gui.addFolder('Bounding Box');
        // bboxFolder.add(stackHelper.bbox, 'visible');
        // bboxFolder.addColor(stackHelper.bbox, 'color');
        // bboxFolder.open();
        //
        // // border
        // var borderFolder = gui.addFolder('Border');
        // borderFolder.add(stackHelper.border, 'visible');
        // borderFolder.addColor(stackHelper.border, 'color');
        // borderFolder.open();
    }

};

scoliosisApp.prototype.setupTransformControl = function () {

    var view = this;

    var raycaster = new THREE.Raycaster();

    var param = {x: 0, y: 0, z:0 , update:function () {

        if(selected) {

            if(selected.wrapper){

                selected.wrapper.rotation.x = param.x * Math.PI / 180;
                selected.wrapper.rotation.y = param.y * Math.PI / 180;
                selected.wrapper.rotation.z = param.z * Math.PI / 180;

            }else{

                selected.rotation.x = param.x * Math.PI / 180;
                selected.rotation.y = param.y * Math.PI / 180;
                selected.rotation.z = param.z * Math.PI / 180;

            }



        }

    }};

    var selected;

    var transformControl;

    transformControl = new THREE.TransformControls( camera, renderer.domElement );
    transformControl.setTranslationSnap( 1 );
    transformControl.setRotationSnap( THREE.Math.degToRad( 1 ) );
    transformControl.space = "world";
    view.transromControl = transformControl;
    if(view.scan) scene.add( transformControl ); // add transform control to scene after adding scan



    // EVENTS FUNCTIONS

    view.transformControlChange = function () {

        if(selected) {

            if(selected.wrapper){

                param.x = selected.wrapper.rotation.x * 180 / Math.PI;
                param.y = selected.wrapper.rotation.y * 180 / Math.PI;
                param.z = selected.wrapper.rotation.z * 180 / Math.PI;

            }else{

                param.x = selected.rotation.x * 180 / Math.PI;
                param.y = selected.rotation.y * 180 / Math.PI;
                param.z = selected.rotation.z * 180 / Math.PI;

            }



        }

    };

    view.controlsChange = function () {

        if(transformControl.visible) transformControl.update();

    };

    view.mousedown = function (event) {

        if(view.stage==0) view.attachTransform(event);

    };

    view.keydown = function ( event ) {

        switch ( event.keyCode ) {
            // case 81: // Q
            //     transformControl.setSpace( transformControl.space === "local" ? "world" : "local" );
            //     break;
            // case 17: // Ctrl
            //     transformControl.setTranslationSnap( 10 );
            //     transformControl.setRotationSnap( THREE.Math.degToRad( 15 ) );
            //     break;
            case 87: // W
                transformControl.setMode( "translate" );
                break;
            case 69: // E
                transformControl.setMode( "rotate" );
                break;
            case 82: // R
                transformControl.setMode( "scale" );
                break;
            case 187:
            case 107: // +, =, num+
                transformControl.setSize( transformControl.size + 0.1 );
                break;
            case 189:
            case 109: // -, _, num-
                transformControl.setSize( Math.max( transformControl.size - 0.1, 0.1 ) );
                break;
        }
    };

    view.keyup = function ( event ) {

        if(!view.scan) return;

        // switch ( event.keyCode ) {
        //     case 17: // Ctrl
        //         transformControl.setTranslationSnap( null );
        //         transformControl.setRotationSnap( null );
        //         break;
        // }


        // record the transform of scan
        if(!view.scan.matrixWorldOld.equals(view.scan.matrixWorld) && view.stage == 0 ) {

            console.log('record transform');

            view.actionRecorder.recordTransform();

            view.scan.matrixWorldOld.copy(view.scan.matrixWorld);
        }


    };

    view.mouseup = function () {

        if(!view.scan) return;

        // record the transform of scan
        if(!view.scan.matrixWorldOld.equals(view.scan.matrixWorld) && view.stage == 0 ) {

            console.log('record transform');

            view.actionRecorder.recordTransform();

            view.scan.matrixWorldOld.copy(view.scan.matrixWorld);
        }

    };

    view.dblclick = function () {view.closeTransform();};

    // add event listeners

    transformControl.addEventListener( 'change', view.transformControlChange );
    controls.addEventListener( 'change', view.controlsChange );
    window.addEventListener( 'keydown', view.keydown);
    container.addEventListener( 'mousedown', view.mousedown , false );
    container.addEventListener("dblclick", view.dblclick);
    window.addEventListener( 'keyup', view.keyup);
    window.addEventListener( 'mouseup', view.mouseup);

    // END //


    view.attachTransform = function (event) {



        //event.preventDefault();
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        raycaster.setFromCamera( mouse, camera );
        var intersects = raycaster.intersectObjects( view.dicoms );
        if ( intersects.length > 0 ) {


            if(selected!=intersects[0].object && intersects[0].object.wrapper.visible){ // the dicom can only be chosen if it is visible

                if(selected && selected.imageUI) {

                    //selected.imageUI.close();
                    $(selected.imageUI.domElement).attr("hidden", true);

                }

                selected = intersects[0].object;

                //selected.imageUI.open();
                $(selected.imageUI.domElement).attr("hidden", false);

                transformControl.attach( intersects[0].object.wrapper );
                transformControl.visible = true;


                if(view.guiTransformlControl) {view.guiTransformlControl.destroy(); view.guiTransformlControl = null;}

                view.guiTransformlControl = new dat.GUI();

                var position = view.guiTransformlControl.addFolder('position');
                position.add(intersects[0].object.wrapper.position,'x').listen();
                position.add(intersects[0].object.wrapper.position,'y').listen();
                position.add(intersects[0].object.wrapper.position,'z').listen();
                position.open();

                var rotation = view.guiTransformlControl.addFolder('rotation');
                rotation.add(param,'x').listen().onChange(param.update);
                rotation.add(param,'y').listen().onChange(param.update);
                rotation.add(param,'z').listen().onChange(param.update);
                rotation.open();

                var scale = view.guiTransformlControl.addFolder('scale');
                scale.add(intersects[0].object.wrapper.scale,'x').listen();
                scale.add(intersects[0].object.wrapper.scale,'y').listen();
                scale.add(intersects[0].object.wrapper.scale,'z').listen();
                scale.open();


            }


        }

        if(!view.scan) return;
        var intersects = raycaster.intersectObject( view.scan );
        if ( intersects.length > 0 ) {

            if(selected!=intersects[0].object){

                if(selected && selected.imageUI) {

                    $(selected.imageUI.domElement).attr("hidden", true);

                } // when switching from dicom to scan, hide the dicom menu

                selected = intersects[0].object;

                transformControl.attach( intersects[0].object );
                transformControl.visible = true;

                if(view.guiTransformlControl) {view.guiTransformlControl.destroy(); view.guiTransformlControl = null;}

                view.guiTransformlControl = new dat.GUI();

                var position = view.guiTransformlControl.addFolder('position');
                position.add(intersects[0].object.position,'x').listen();
                position.add(intersects[0].object.position,'y').listen();
                position.add(intersects[0].object.position,'z').listen();
                position.open();

                var rotation = view.guiTransformlControl.addFolder('rotation');
                rotation.add(param,'x').listen().onChange(param.update);
                rotation.add(param,'y').listen().onChange(param.update);
                rotation.add(param,'z').listen().onChange(param.update);
                rotation.open();

                // var scale = gui.addFolder('scale');
                // scale.add(intersects[0].object.scale,'x').listen();
                // scale.add(intersects[0].object.scale,'y').listen();
                // scale.add(intersects[0].object.scale,'z').listen();
                // scale.open();


            }

        }

    };
    view.closeTransform = function () {

        transformControl.attach();
        transformControl.visible = false;

        if(view.guiTransformlControl) {view.guiTransformlControl.destroy(); view.guiTransformlControl = null;}
        if(selected && selected.imageUI) $(selected.imageUI.domElement).attr("hidden", true);

        selected = null;



    };



};

scoliosisApp.prototype.diposeTranformControl = function () {

    var view = this;

    controls.removeEventListener( 'change', view.controlsChange );
    window.removeEventListener( 'keydown', view.keydown);
    container.removeEventListener( 'mousedown', view.mousedown , false );
    container.removeEventListener("dblclick", view.dblclick);
    window.removeEventListener( 'keyup', view.keyup);
    window.removeEventListener( 'mouseup', view.mouseup);

    if(view.transromControl) {
        scene.remove(view.transromControl);
        view.transromControl.dispose();
    }

    if(view.guiTransformlControl) {view.guiTransformlControl.destroy(); view.guiTransformlControl = null;}

};

scoliosisApp.prototype.dragInFile = function () {

    var view = this;

    function inputGeometry(file){


        var extension = file.name.split('.').pop().toLowerCase();

        if(file.name.split('.').length<=1 || extension == 'dcm' || extension == 'dicom'){

            var reader = new FileReader();
            reader.onloadend = function () {

                view.importDICOM(this.result);

            };
            reader.readAsDataURL(file);

        }

        if(extension == 'obj'){

            var reader = new FileReader();
            reader.onloadend = function () {

                view.importScan(this.result);

            };
            reader.readAsDataURL(file);


        }


        if(extension == 'json'){

            var reader = new FileReader();
            reader.onloadend = function () {

                view.actionRecorder.load(this.result);

            };
            reader.readAsDataURL(file);


        }


        if(extension == 'jpg' || extension == 'png'){

            var reader = new FileReader();
            reader.onloadend = function () {

                view.texture = new THREE.TextureLoader().load( this.result,function(){} );
                if(view.scan) {

                    view.scan.material.map = view.texture;
                    view.scan.material.color.setHex(0xffffff);
                }

            };
            reader.readAsDataURL(file);


        }



    }

    view.inputGeometry = inputGeometry;


    $(document).on('dragenter', function (e)
    {
        e.stopPropagation();
        e.preventDefault();
    });
    $(document).on('dragover', function (e)
    {
        e.stopPropagation();
        e.preventDefault();

    });
    $(document).on('drop', function (e)
    {
        e.stopPropagation();
        e.preventDefault();

        //var files = e.originalEvent.dataTransfer.files;
        //
        //for(var i=0; i<files.length;i++) inputGeometry(files[i]);


        var items = event.dataTransfer.items;
        for (var i=0; i<items.length; i++) {
            // webkitGetAsEntry is where the magic happens
            var item = items[i].webkitGetAsEntry();
            if (item) {
                traverseFileTree(item);
            }
        }


    });


    function traverseFileTree(item, path) {
        path = path || "";
        if (item.isFile) {
            // Get file
            item.file(function(file) {
                inputGeometry(file);
            });
        } else if (item.isDirectory) {
            // Get folder contents
            var dirReader = item.createReader();
            dirReader.readEntries(function(entries) {
                for (var i=0; i<entries.length; i++) {
                    traverseFileTree(entries[i], path + item.name + "/");
                }
            });
        }
    }

};

scoliosisApp.prototype.export = function () {

    var geometrey = this.scan.clone();

    var exporter = new THREE.OBJExporter();
    var result = exporter.parse (geometrey);

    var blob = new Blob([result], {type: "text/plain"});

    var name = prompt('please input the file name');

    if(name) saveAs(blob, "export.obj");

};