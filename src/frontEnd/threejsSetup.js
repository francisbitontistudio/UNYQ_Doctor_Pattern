/**
 * Created by Li on 3/5/2016.
 */



var container, stats, raycaster;
var camera, scene, renderer, controls, gui;
var mouse = new THREE.Vector2();
var perspective, orthographic,light;

var frameCount = 0;

function init() {


    container = document.createElement( 'div' );
    document.body.appendChild( container );

    scene = new THREE.Scene();

    perspective = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    orthographic = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, - 1, 10000 );

    //camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, - 1, 10000 );
    camera = perspective;
    camera.position.set(0,100,1000);


    //add default light
    light = new THREE.PointLight( 0xffffff, 1.3 );
    light.position.set( 10,10,0 );
    camera.add(light);
    scene.add( camera );
    //camera.up.set( 0, -1, 0 );

    //add renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( white );
    //renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
    renderer.sortObjects = false;

    //add view control
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.target.set( 0, 0, 0 );
    //controls.addEventListener( 'change', render );
    controls.enableDamping = true;


    //add stats
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    //container.appendChild( stats.domElement );

    //add listener for window resize
    window.addEventListener( 'resize', onWindowResize, false );



    setup();



}

function onWindowResize() {

    camera.left = window.innerWidth / - 2;
    camera.right = window.innerWidth / 2;
    camera.top = window.innerHeight / 2;
    camera.bottom = window.innerHeight / - 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {





    requestAnimationFrame( animate );
    controls.update();



    stats.update();


    update();

    render();

    frameCount++;
}

function render() {


    renderer.render( scene, camera);


}

function runApp() {

    init();
    animate();

}