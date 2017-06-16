/**
 * Created by LI on 5/4/2017.
 */

var meshSmooth = function (input) {

    var view = this;

    view.mesh = input.mesh;
    view.app = input.app;


    // test

    // var URL = 'src/models/Model.obj';
    //
    // new THREE.OBJLoader().load(URL,function (object) {
    //
    //
    //     var mesh = object.children[0];
    //
    //     mesh.geometry = new THREE.Geometry().fromBufferGeometry(mesh.geometry);
    //
    //     mesh.geometry.mergeVertices();
    //
    //     mesh.scale.set(1000,1000,1000);
    //
    //     scene.add(mesh);
    //
    //     view.mesh = mesh;
    //
    //     mesh.material.wireframe = true;
    //
    //     view.registerNeighbors();
    //
    //     console.log(mesh.geometry);
    //
    //     var gui = new dat.GUI();
    //
    //     gui.add(view,'smooth');
    //     gui.add(mesh.material,'wireframe');
    //
    // })

};


meshSmooth.prototype.registerNeighbors = function () {

    var view = this;

    if(!view.mesh) view.mesh = view.app.scan;

    var geometry = view.mesh.geometry;

    for(var i=0; i< geometry.vertices.length; i++){

        geometry.vertices[i].neighbors = [];

    }

    for(var i=0; i< geometry.faces.length; i++){

        var face = geometry.faces[i];

        addNeighbor(face.a,face.b,face.c);
        addNeighbor(face.b,face.c,face.a);
        addNeighbor(face.c,face.a,face.b);

    }

    function addNeighbor(index,toAdd1,toAdd2) {

        var vertex = geometry.vertices[index];

        var existed1 = false , existed2 = false;

        for(var j=0;j<vertex.neighbors.length;j++){

            if(vertex.neighbors[j] == toAdd1) existed1 = true;

            if(vertex.neighbors[j] == toAdd2) existed2 = true;

        }

        if(!existed1) vertex.neighbors.push(toAdd1);
        if(!existed2) vertex.neighbors.push(toAdd2);

    }

};


meshSmooth.prototype.smooth = function (vertices) {

    var view = this;

    var smoothAll = !vertices;

    var geometry = view.mesh.geometry;

    vertices = vertices || geometry.vertices;

    for(var k = 0; k<2; k++){


        for(var i=0; i< vertices.length; i++){

            var vertex = vertices[i];

            var averageNeigbor = new THREE.Vector3();

            for(var j=0; j<vertex.neighbors.length; j++){

                averageNeigbor.add(geometry.vertices[vertex.neighbors[j]]);

            }

            averageNeigbor.multiplyScalar(1/vertex.neighbors.length);

            averageNeigbor.sub(vertex);

            if(vertex.value) averageNeigbor.multiplyScalar(vertex.value);

            vertex.add(averageNeigbor);

        }


    }



    geometry.verticesNeedUpdate = true;
    if(vertices) geometry.computeVertexNormals(); // avoid repeated computation



    if(smoothAll){

        // record step

        var content = {

            name: 'smooth all',

            type: 'smooth all',

            toExecute: function () {

                var geometry = view.mesh.geometry;

                vertices = vertices || geometry.vertices;

                for(var k = 0; k<2; k++){


                    for(var i=0; i< vertices.length; i++){

                        var vertex = vertices[i];

                        var averageNeigbor = new THREE.Vector3();

                        for(var j=0; j<vertex.neighbors.length; j++){

                            averageNeigbor.add(geometry.vertices[vertex.neighbors[j]]);

                        }

                        averageNeigbor.multiplyScalar(1/vertex.neighbors.length);

                        averageNeigbor.sub(vertex);

                        if(vertex.value) averageNeigbor.multiplyScalar(vertex.value);

                        vertex.add(averageNeigbor);

                    }


                }

                geometry.verticesNeedUpdate = true;
                if(vertices) geometry.computeVertexNormals(); // avoid repeated computation

            },

            previous: view.app.meshModifier.brushSteps.slice(0) // this is the clone of brush history list

        };

        view.app.meshModifier.brushSteps.push(content);

        view.app.actionRecorder.recordBrush(undefined,content);

    }



};