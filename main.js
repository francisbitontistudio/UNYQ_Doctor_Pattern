/**
 * Created by Li on 3/6/2016.
 */




function setup() {

    defultEnvironment();

    //var myMeshSmooth = new meshSmooth({});

    var myScoliosisApp = new scoliosisApp();

    // var myUVWMapper = new uvwMapper({
    //
    //
    //     mesh:'brace_quad3.ply',
    //     //mesh:'brace_test.obj',
    //
    //     wrapTartgetMesh: 'body_pulled.obj',
    //
    //     nurbsSurfaceSetting:{
    //
    //         U: 80,
    //         V: 50,
    //         height:480,
    //         offset: 0,
    //         center: [0,0,0]
    //
    //     },
    //
    //     includeW: true,
    //
    //     quad: true
    //
    // });


    // var loader = new THREE.OBJLoader().load('src/models/body_reduced.obj',function (object) {
    //
    //     var mesh = object.children[0];
    //
    //     scene.add(mesh);
    //
    //     mesh.geometry = new THREE.Geometry().fromBufferGeometry(mesh.geometry);
    //
    //     mesh.geometry.mergeVertices();
    //
    //     addNormal(mesh.geometry);
    //
    //     //var myMeshModifier = new meshModifier({mesh:mesh});
    //
    //     var wrapScan = new wrapSurface({
    //
    //         wrapTartgetMesh: mesh,
    //
    //         nurbsSurfaceSetting:{
    //
    //             U: 80,
    //             V: 50,
    //             height:480,
    //             offset: 0,
    //             center: [0,0,0]
    //
    //         }
    //
    //     });
    //
    //     var surfaceMorph = new surfaceMorph({
    //
    //         surface: wrapScan,
    //
    //         //mesh: 'src/models/brace_unfolded_surface.obj',
    //         mesh: 'src/models/brace_quad.ply',
    //         mesh2: 'src/models/brace_hinge.ply',
    //
    //         controlCurves: ['src/models/curve1.txt','src/models/curve2.txt'],
    //
    //         quad: true
    //
    //     });
    //
    // });


}

function update() {



}


runApp();





