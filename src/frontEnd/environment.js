/**
 * Created by Li on 3/30/2016.
 */

var group;


var defultEnvironment = function (){

    //scene.fog = new THREE.Fog( 0xffffff, 1000, 2000 );

    var groundGeo = new THREE.PlaneBufferGeometry( 100000, 100000 );
    var groundMat = new THREE.MeshPhongMaterial( { color: 0xf2f2f2, specular: 0x000000 , shininess: 0 } );
    var ground = new THREE.Mesh( groundGeo, groundMat );
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -1000;
    //scene.add( ground );
    ground.receiveShadow = true;



    var helper = new THREE.GridHelper( 1000, 1 );

    //helper.rotation.x = -Math.PI/2;
    helper.position.y = - 900;
    helper.material.opacity = 0.25;
    helper.material.transparent = true;
    //scene.add( helper );

    var axis = new THREE.AxisHelper();
    axis.position.set( -500, -500, -500 );
    scene.add( axis );


    group = new THREE.Group();
    scene.add(group);



};