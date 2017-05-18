/**
 * Created by Pater on 4/11/2017.
 */

var surfaceMorph = function (input) {

    var view = this;

    view.actionRecorder = input.actionRecorder;

    view.app = input.app;

    view.surface = input.surface;

    view.mesh = input.mesh;

    view.mesh2 = input.mesh2;

    view.input = input;

    view.curves = [];

    view.quad = input.quad;

    view.controlPoints = [];

    for(var i = 0; i<input.controlCurves.length ; i++){

        view.importControlCurve(input.controlCurves[i]);

    }


};

surfaceMorph.prototype.start = function (surface,mesh,mesh2) {

    var view = this;

    view.surface = surface;

    view.mesh = mesh;

    view.mesh2 = mesh2;

    view.setupMesh();

    view.setupCurves();



};

surfaceMorph.prototype.setupMesh = function () {

    var view = this;

    if(view.quad) {

        if (view.mesh instanceof THREE.Mesh) {

            var mesh = view.mesh;

            for (var i = 0; i < mesh.geometry.vertices.length; i++) {

                var vertex = mesh.geometry.vertices[i];

                // prevent reset when loading the second time
                if(vertex.u) break;

                vertex.u = vertex.x;
                vertex.v = vertex.y;
                vertex.w = vertex.z;

                var pt = view.surface.point(vertex.u, vertex.v);

                vertex.set(pt[0], pt[1], pt[2]);

            }

            mesh.geometry.computeVertexNormals();
            calculateNormal(mesh.geometry);

            //scene.add(mesh);


            // view.surfaceLattice = new surfaceLattice({
            //
            //     scaffoldMesh1: view.mesh,
            //     componentA: 'src/models/compB.obj',
            //     componentB: 'src/models/compA.obj',
            //
            //     vertexColor: true,
            //
            //     height: -4,
            //
            //     surface: view.surface
            //
            //
            // });

            console.log('start projecting brace');

            mesh = view.mesh2;

            for (var i = 0; i < mesh.geometry.vertices.length; i++) {

                var vertex = mesh.geometry.vertices[i];

                // prevent reset when loading the second time
                if(vertex.u) break;

                vertex.u = vertex.x;
                vertex.v = vertex.y;
                vertex.w = vertex.z;

                var pt = view.surface.point(vertex.u, vertex.v);

                var normal = view.surface.normal(vertex.u, vertex.v);

                normal = normal.normalise(normal);

                vertex.set(pt[0] - normal[0] * vertex.w / 2, pt[1] - normal[1] * vertex.w / 2, pt[2] - normal[2] * vertex.w / 2);

            }

            console.log('projecting brace finished');

            mesh.geometry.computeVertexNormals();
            calculateNormal(mesh.geometry);
            console.log('normal updated');
            //scene.add(mesh);


            view.generateLattice = function () {

                $('#text').text('Processing, please wait...');

                setTimeout(function () {

                    view.updateFromCurve();

                    view.mesh2.visible = true;

                    scene.add(view.mesh2);
                    //view.surfaceLattice.applyComp();
                    if(!view.app.download) view.app.download = view.app.guiScan.add(view,'downloadBrace');
                    if(!view.app.showBrace) view.app.showBrace = view.app.guiScan.add(view.mesh2, 'visible').name('Show Brace');

                    $('#text').text('Please move control points to edit brace');


                },50);

            };


            view.app.next = view.app.guiScan.add(view, 'generateLattice').name('Generate Brace');


        }


    //     else {
    //
    //         new THREE.PLYLoader().load(view.mesh, function (object) {
    //
    //
    //         var mesh = new THREE.Mesh(object, new THREE.MeshPhongMaterial());
    //
    //         mesh.material.vertexColors = THREE.VertexColors;
    //         mesh.material.side = THREE.DoubleSide;
    //
    //         view.mesh = mesh;
    //
    //         var newGeo = new THREE.Geometry().fromBufferGeometry(mesh.geometry);
    //
    //         newGeo.vertices_quad = mesh.geometry.vertices_quad;
    //
    //         newGeo.normals_quad = mesh.geometry.normals_quad;
    //
    //         newGeo.colors_quad = mesh.geometry.colors_quad;
    //
    //         newGeo.faces_quad = mesh.geometry.faces_quad;
    //
    //         mesh.geometry = newGeo;
    //
    //
    //         for (var i = 0; i < mesh.geometry.vertices.length; i++) {
    //
    //             var vertex = mesh.geometry.vertices[i];
    //
    //             vertex.u = vertex.x;
    //             vertex.v = vertex.y;
    //             vertex.w = vertex.z;
    //
    //             var pt = view.surface.point(vertex.x, vertex.y);
    //
    //             vertex.set(pt[0], pt[1], pt[2]);
    //
    //         }
    //
    //         mesh.geometry.computeVertexNormals();
    //         calculateNormal(mesh.geometry);
    //
    //         scene.add(mesh);
    //
    //
    //         var mySurfaceLattice = new surfaceLattice({
    //
    //             scaffoldMesh1: view.mesh,
    //             componentA: 'src/models/compB.obj',
    //             componentB: 'src/models/compA.obj',
    //
    //             vertexColor: true,
    //
    //             height: 5
    //
    //         });
    //
    //
    //     });
    //
    //
    //     if (view.mesh2) new THREE.PLYLoader().load(view.mesh2, function (object) {
    //
    //
    //         var mesh = new THREE.Mesh(object, new THREE.MeshPhongMaterial());
    //
    //         mesh.material.vertexColors = THREE.VertexColors;
    //         mesh.material.side = THREE.DoubleSide;
    //
    //         view.mesh = mesh;
    //
    //         var newGeo = new THREE.Geometry().fromBufferGeometry(mesh.geometry);
    //
    //         newGeo.vertices_quad = mesh.geometry.vertices_quad;
    //
    //         newGeo.normals_quad = mesh.geometry.normals_quad;
    //
    //         newGeo.colors_quad = mesh.geometry.colors_quad;
    //
    //         newGeo.faces_quad = mesh.geometry.faces_quad;
    //
    //         mesh.geometry = newGeo;
    //
    //
    //         for (var i = 0; i < mesh.geometry.vertices.length; i++) {
    //
    //             var vertex = mesh.geometry.vertices[i];
    //
    //             vertex.u = vertex.x;
    //             vertex.v = vertex.y;
    //             vertex.w = vertex.z;
    //
    //             var pt = view.surface.point(vertex.x, vertex.y);
    //
    //             var normal = view.surface.normal(vertex.x, vertex.y);
    //
    //             normal = normal.normalise(normal);
    //
    //             vertex.set(pt[0] - normal[0] * vertex.w / 2, pt[1] - normal[1] * vertex.w / 2, pt[2] - normal[2] * vertex.w / 2);
    //
    //         }
    //
    //         mesh.geometry.computeVertexNormals();
    //         calculateNormal(mesh.geometry);
    //
    //         scene.add(mesh);
    //
    //
    //         var mySurfaceLattice = new surfaceLattice({
    //
    //             scaffoldMesh1: view.mesh,
    //             componentA: 'src/models/compB.obj',
    //             componentB: 'src/models/compA.obj',
    //
    //             vertexColor: true,
    //
    //             height: 4
    //
    //         });
    //
    //
    //     });
    // }

    }
    // else{
    //
    //
    //     new THREE.OBJLoader().load(view.mesh,function (object) {
    //
    //         var mesh = object.children[0];
    //
    //         mesh.geometry = new THREE.Geometry().fromBufferGeometry(mesh.geometry);
    //
    //
    //         for(var i=0;i< mesh.geometry.vertices.length;i++){
    //
    //             var vertex = mesh.geometry.vertices[i];
    //
    //             vertex.u = vertex.x;
    //             vertex.v = vertex.y;
    //             vertex.w = vertex.z;
    //
    //             var pt = view.surface.point(vertex.x,vertex.y);
    //
    //             vertex.set(pt[0],pt[1],pt[2]);
    //
    //         }
    //
    //         mesh.geometry.computeVertexNormals();
    //
    //         view.mesh = mesh;
    //
    //         if(scene) scene.add(mesh);
    //
    //
    //
    //     });
    //
    //
    // }




};

surfaceMorph.prototype.importControlCurve = function (URL) {

    var view = this;


    var request = new XMLHttpRequest();
    request.open('GET', URL , true);
    request.responseType = 'blob';
    request.onload = function() {
        var reader = new FileReader();
        reader.readAsText(request.response);
        reader.onload =  function(e){
            var data = e.target.result;
            var lines = data.split("\n");

            var points = [];

            for(var i = 0; i<lines.length;i++){

                if(!lines[i]) continue;

                var xyz = lines[i].split(',');

                var x = xyz[0].split('{')[1];
                var y = xyz[1];
                var z = xyz[2].split('}')[0];

                x = Number(x);
                y = Number(y);
                z = Number(z);


                points.push([x,y,z]);


            }

            view.controlPoints.push(points);


        };
    };
    request.send();

};

surfaceMorph.prototype.setupCurves = function () {

    var view = this;

    console.log('setup brace cutting line curves');


    for(var i=0;i<view.controlPoints.length;i++){

        view.pointOnSurface = new pointOnSurface({

            app: view.app,

            actionRecorder: view.actionRecorder,

            surface : view.surface,

            points: view.controlPoints[i],

            toUpdate: function (){
                // this is for real time update
            }

        });

        view.pointOnSurface.controlPoints.actionRecorder = view.actionRecorder;

        var curve = new closedCurve({

            controlPoints: view.pointOnSurface.controlPoints,

            closed: true,

            surface: view.surface

        });

        view.curves[i] = curve;

    }

    console.log('finished create control points');


    view.controlPointsLocked = true;

    updateWeights(view.mesh.geometry.vertices);
    updateWeights(view.mesh2.geometry.vertices);

    function updateWeights(vertices) {


        for(var i=0; i<vertices.length; i++){

            var totalWeight = 0;

            vertices[i].attractors = [];

            for(var k = 0; k<view.curves.length;k++){

                // use the closest point on curve as attractor
                var closestIndex = -1, closestDis = 1000000000;

                for(var j=0;j<view.curves[k].geometry.vertices.length;j++){

                    var distance = view.curves[k].geometry.vertices[j].distanceTo(vertices[i]);

                    if( distance < closestDis){

                        closestIndex = j;
                        closestDis = distance;

                    }

                }


                if(view.curves[k].geometry.vertices[closestIndex] == undefined) {
                    console.log('i: '+i);
                    console.log(vertices[i]);
                    console.log('k: '+k);
                    console.log(view.curves[k].geometry.vertices);

                }

                var attractor = new Attractor({

                    //position: view.curves[k].geometry.vertices[closestIndex], // this is lost at some point

                    position: view.curves[k].geometry.vertices[closestIndex], // this is lost at some point


                    range: 80

                });

                attractor.matrixWorld =  view.curves[k].matrixWorld;

                attractor.oldMatrixWorld =  view.curves[k].matrixWorld.clone();

                attractor.weight = attractor.cos( vertices[i].x, vertices[i].y, vertices[i].z);

                totalWeight+=attractor.weight;

                vertices[i].attractors[k] = attractor;


            }


            // average out the weights in between curve attractors
            if(totalWeight>1){

                for(var k = 0; k<vertices[i].attractors.length;k++){

                    vertices[i].attractors[k].weight /= totalWeight;

                }
            }


        }

    }

    // create attractors & calculate attractor weights



    for(var i=0; i<view.curves.length; i++) {
        for (var j = 0; j < view.curves[i].geometry.vertices.length; j++) {

            view.curves[i].geometry.vertices[j].oldPosition = view.curves[i].geometry.vertices[j].clone();

            view.curves[i].geometry.vertices[j].oldPosition.u = view.curves[i].geometry.vertices[j].u;
            view.curves[i].geometry.vertices[j].oldPosition.v = view.curves[i].geometry.vertices[j].v;
            view.curves[i].geometry.vertices[j].oldPosition.w = view.curves[i].geometry.vertices[j].w;
        }
    }

    console.log('finished brace cutting line curves');

};

surfaceMorph.prototype.updateFromCurve = function () {

    var view = this;


    updateMesh(view.mesh);
    updateMesh(view.mesh2);

    
    function updateMesh(mesh) {

        var vertices = mesh.geometry.vertices;

        for(var i=0; i<vertices.length; i++){

            var newUVW = [0,0,0];

            for(var j=0; j<vertices[i].attractors.length;j++){

                var oldUVW = [
                    vertices[i].attractors[j].position.oldPosition.u,
                    vertices[i].attractors[j].position.oldPosition.v,
                    vertices[i].attractors[j].position.oldPosition.w
                ];

                var currentUVW = [
                    vertices[i].attractors[j].position.u,
                    vertices[i].attractors[j].position.v,
                    vertices[i].attractors[j].position.w
                ];


                newUVW.add(currentUVW.sub(oldUVW).mult(vertices[i].attractors[j].weight));

            }



            newUVW.add([vertices[i].u,vertices[i].v,vertices[i].w]);


            vertices[i].u = newUVW[0];
            vertices[i].v = newUVW[1];
            vertices[i].w = newUVW[2];

            var pt = view.surface.point(newUVW[0],newUVW[1]);

            var normal = view.surface.normal(newUVW[0],newUVW[1]).normalise();

            vertices[i].set(pt[0],pt[1],pt[2]);

            vertices[i].sub(new THREE.Vector3(normal[0]*vertices[i].w/2,normal[1]*vertices[i].w/2,normal[2]*vertices[i].w/2));

        }



        for(var i=0; i<vertices.length; i++){
            for(var j=0; j<vertices[i].attractors.length;j++){

                vertices[i].attractors[j].oldMatrixWorld.copy(vertices[i].attractors[j].matrixWorld);
            }

        }


        mesh.geometry.computeVertexNormals();
        mesh.geometry.verticesNeedUpdate = true;
        calculateNormal(mesh.geometry);
        
    }


    for(var i=0; i<view.curves.length; i++) {
        for (var j = 0; j < view.curves[i].geometry.vertices.length; j++) {

            view.curves[i].geometry.vertices[j].oldPosition.copy(view.curves[i].geometry.vertices[j]);
            view.curves[i].geometry.vertices[j].oldPosition.u = view.curves[i].geometry.vertices[j].u;
            view.curves[i].geometry.vertices[j].oldPosition.v = view.curves[i].geometry.vertices[j].v;
            view.curves[i].geometry.vertices[j].oldPosition.w = view.curves[i].geometry.vertices[j].w;

        }
    }


};

surfaceMorph.prototype.dispose = function () {

    console.log('dispose surface morph');

    var view = this;

    for(var i=0 ; i<view.curves.length; i++){

        scene.remove(view.curves[i]);


    }


    view.curves = []; // here!!!!!!!!!!!

    view.pointOnSurface.dispose();

    scene.remove(view.mesh2);
    if(view.app.download) {view.app.guiScan.remove( view.app.download ); view.app.download = null;}
    if(view.app.showBrace) {view.app.guiScan.remove(view.app.showBrace); view.app.showBrace= null;}


};

surfaceMorph.prototype.downloadBrace = function () {

    var view = this;

    $('#text').text('Exporting the brace, please wait...');

    setTimeout(function () {

        var geometrey = view.mesh2.clone();

        var exporter = new THREE.OBJExporter();
        var result = exporter.parse (geometrey);

        var blob = new Blob([result], {type: "text/plain"});


        saveAs(blob, "brace.obj");

        $('#text').text('Brace downloaded!');

    },50);




    // var exporter = new THREE.OBJExporter();
    // var result = exporter.parse (this.surfaceLattice.latticeMesh.geometry.clone());
    //
    // var blob = new Blob([result], {type: "text/plain"});
    //
    //
    // saveAs(blob, "pattern.obj");

};
