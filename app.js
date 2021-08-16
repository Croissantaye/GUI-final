import * as THREE from 'https://cdn.skypack.dev/three';
import { GUI } from "https://cdn.skypack.dev/three/examples/jsm/libs/dat.gui.module"
import { OrbitControls } from "https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls"
import { FlyControls } from "https://cdn.skypack.dev/three/examples/jsm/controls/FlyControls"
// import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls"

const canvas = document.querySelector("canvas#webgl");

const vShader = `
// Simplex 2D noise
//
// vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

// float snoise(vec2 v){
    //   const vec4 C = vec4(0.211324865405187, 0.366025403784439,
    //            -0.577350269189626, 0.024390243902439);
    //   vec2 i  = floor(v + dot(v, C.yy) );
    //   vec2 x0 = v -   i + dot(i, C.xx);
    //   vec2 i1;
    //   i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    //   vec4 x12 = x0.xyxy + C.xxzz;
    //   x12.xy -= i1;
    //   i = mod(i, 289.0);
    //   vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    //   + i.x + vec3(0.0, i1.x, 1.0 ));
    //   vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    //     dot(x12.zw,x12.zw)), 0.0);
    //   m = m*m ;
    //   m = m*m ;
    //   vec3 x = 2.0 * fract(p * C.www) - 1.0;
    //   vec3 h = abs(x) - 0.5;
    //   vec3 ox = floor(x + 0.5);
    //   vec3 a0 = x - ox;
    //   m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    //   vec3 g;
    //   g.x  = a0.x  * x0.x  + h.x  * x0.y;
    //   g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    //   return 130.0 * dot(m, g);
    // }
    
    vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec2 mod289(vec2 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec3 permute(vec3 x) {
        return mod289(((x*34.0)+10.0)*x);
    }
    
    float snoise(vec2 v)
    {
        const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
        -0.577350269189626,  // -1.0 + 2.0 * C.x
        0.024390243902439); // 1.0 / 41.0
        // First corner
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        
        // Other corners
        vec2 i1;
        //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
        //i1.y = 1.0 - i1.x;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        // x0 = x0 - 0.0 + 0.0 * C.xx ;
        // x1 = x0 - i1 + 1.0 * C.xx ;
        // x2 = x0 - 1.0 + 2.0 * C.xx ;
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        
        // Permutations
        i = mod289(i); // Avoid truncation effects in permutation
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        
        // Gradients: 41 points uniformly over a line, mapped onto a diamond.
        // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
        
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        
        // Normalise gradients implicitly by scaling m
        // Approximation of: m *= inversesqrt( a0*a0 + h*h );
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        
        // Compute final noise value at P
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }
    
    float layerNoise(float iterations, float persistance, float lacunarity, vec2 st){
        float color = 0.0;
        float amplitude = 1.;
        float frequency = 1.;
        float noiseVal = 0.;
        float ampSum = 0.0;
        for(int i = 0; i < int(iterations); i++){
            
            noiseVal += amplitude * snoise(st*frequency);
            
            ampSum += amplitude;
            amplitude = pow(persistance, float(i));
            frequency = pow(lacunarity, float(i));
            
            // if(height > maxHeight){
                //     maxHeight = height;
                // }
                // else if(height < minHeight){
                    //     minHeight = height;
                    // }
                    // noiseVal = inverseLerp(-5., 5., noiseVal);
                }
                // noiseVal += 1.6;
                // if(noiseVal < 0.){
                    //   noiseVal = 0.;
                    // }
                    noiseVal = pow((noiseVal/ampSum)*1.2, 3.0);
                    
                    return noiseVal;
                }
                
                varying vec3 vPosition;
                varying vec3 vColor;
                varying vec3 vNormal;
                varying vec2 vUV;
                
                uniform float uTime;
                uniform vec2 uResolution;
                uniform float uScale;
                
                void main(){
                    vPosition = position;
                    vColor = vec3(0.0);
                    vNormal = normal;
                    vUV = uv*uScale*.5;
                    vUV.y += uTime/uScale;
                    vColor = vec3(layerNoise(20.0, .35, 2.5, vUV));
                    
                    vPosition = vec3(position.xy, vColor.z);
                    
                    if(vPosition.z >= 0.){
                        vColor = vec3(vColor.x, 0.0, 0.0);
                    }
                    else{
                        vColor = vec3(0.0, 0.0, abs(vColor.x));
                    }
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
                }
                `;
                
const fShader = `
varying vec3 vPosition;
varying vec3 vColor;
varying vec3 vNormal;
varying vec2 vUV;

uniform float uTime;
uniform sampler2D lowTexture;
uniform sampler2D midTexture;
uniform sampler2D highTexture;

void main(){
vec3 fragColor = vColor;
vec2 fragCoord = fract(vUV);

// uncomment to show UVs
// fragColor = vec3(fragCoord, 0.0);

vec4 tex = vec4(fragColor, 1.0);
if(vPosition.z < .1){
    tex = texture(lowTexture, fragCoord);
}
else if(vPosition.z <= .5){
    tex = texture(midTexture, fragCoord);
}
else if(vPosition.z > .5){
    tex = texture(highTexture, fragCoord);
}

gl_FragColor = tex;
}
`;

const scale = 10;
const segments = 200;
const rotatePlane = true;

const texLoad = new THREE.TextureLoader();
const dirtTex = texLoad.load('./Ground_Dirt_007_basecolor.jpg');
const mountainTex = texLoad.load('./Rock_040_basecolor.jpg');
const snowTex = texLoad.load('./Snow_003_COLOR.jpg');

const shaders = {
terrain: {
    vertexShader: `
    // Simplex 2D noise
    //
    // vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    
    // float snoise(vec2 v){
        //   const vec4 C = vec4(0.211324865405187, 0.366025403784439,
        //            -0.577350269189626, 0.024390243902439);
        //   vec2 i  = floor(v + dot(v, C.yy) );
        //   vec2 x0 = v -   i + dot(i, C.xx);
        //   vec2 i1;
        //   i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        //   vec4 x12 = x0.xyxy + C.xxzz;
        //   x12.xy -= i1;
        //   i = mod(i, 289.0);
        //   vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        //   + i.x + vec3(0.0, i1.x, 1.0 ));
        //   vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        //     dot(x12.zw,x12.zw)), 0.0);
        //   m = m*m ;
        //   m = m*m ;
        //   vec3 x = 2.0 * fract(p * C.www) - 1.0;
        //   vec3 h = abs(x) - 0.5;
        //   vec3 ox = floor(x + 0.5);
        //   vec3 a0 = x - ox;
        //   m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        //   vec3 g;
        //   g.x  = a0.x  * x0.x  + h.x  * x0.y;
        //   g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        //   return 130.0 * dot(m, g);
        // }
        
        vec3 mod289(vec3 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
        }
        
        vec2 mod289(vec2 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
        }
        
        vec3 permute(vec3 x) {
            return mod289(((x*34.0)+10.0)*x);
        }
        
        float snoise(vec2 v)
        {
            const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
            0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
        -0.577350269189626,  // -1.0 + 2.0 * C.x
            0.024390243902439); // 1.0 / 41.0
        // First corner
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
        
        // Other corners
            vec2 i1;
            //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
            //i1.y = 1.0 - i1.x;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            // x0 = x0 - 0.0 + 0.0 * C.xx ;
            // x1 = x0 - i1 + 1.0 * C.xx ;
            // x2 = x0 - 1.0 + 2.0 * C.xx ;
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
        
        // Permutations
            i = mod289(i); // Avoid truncation effects in permutation
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                + i.x + vec3(0.0, i1.x, 1.0 ));
        
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
        
        // Gradients: 41 points uniformly over a line, mapped onto a diamond.
        // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
        
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
        
        // Normalise gradients implicitly by scaling m
        // Approximation of: m *= inversesqrt( a0*a0 + h*h );
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        
        // Compute final noise value at P
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }
    
        float layerNoise(float iterations, float persistance, float lacunarity, vec2 st){
            float color = 0.0;
            float amplitude = 1.;
            float frequency = 1.;
            float noiseVal = 0.;
            float ampSum = 0.0;
            for(int i = 0; i < int(iterations); i++){
    
                noiseVal += amplitude * snoise(st*frequency);
    
                ampSum += amplitude;
                amplitude = pow(persistance, float(i));
                frequency = pow(lacunarity, float(i));
    
                // if(height > maxHeight){
                //     maxHeight = height;
                // }
                // else if(height < minHeight){
                //     minHeight = height;
                // }
                // noiseVal = inverseLerp(-5., 5., noiseVal);
            }
            // noiseVal += 1.6;
            // if(noiseVal < 0.){
            //   noiseVal = 0.;
            // }
            noiseVal = pow((noiseVal/ampSum)*1.2, 3.0);
            
            return noiseVal;
        }
    
        varying vec3 vPosition;
        varying vec3 vColor;
        varying vec3 vNormal;
        varying vec2 vUV;
    
        uniform float uTime;
        uniform vec2 uResolution;
        uniform float uScale;
    
        void main(){
            vPosition = position;
            vColor = vec3(0.0);
            vNormal = normal;
            vUV = uv*uScale*.5;
            vUV.y += uTime/uScale;
            vColor = vec3(layerNoise(20.0, .35, 2.5, vUV));
            
            vPosition = vec3(position.xy, vColor.z);
    
            if(vPosition.z >= 0.){
                vColor = vec3(vColor.x, 0.0, 0.0);
            }
            else{
                vColor = vec3(0.0, 0.0, abs(vColor.x));
            }
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
        }`,
        fragmentShader: `
        varying vec3 vPosition;
        varying vec3 vColor;
        varying vec3 vNormal;
        varying vec2 vUV;
    
        uniform float uTime;
        uniform sampler2D lowTexture;
        uniform sampler2D midTexture;
        uniform sampler2D highTexture;
    
        void main(){
            vec3 fragColor = vColor;
            vec2 fragCoord = fract(vUV*5.);
    
            // uncomment to show UVs
            // fragColor = vec3(fragCoord, 0.0);
    
            vec4 tex = vec4(fragColor, 1.0);
            if(vPosition.z < .1){
                tex = texture(lowTexture, fragCoord);
            }
            else if(vPosition.z <= .5){
                tex = texture(midTexture, fragCoord);
            }
            else if(vPosition.z > .5){
                tex = texture(highTexture, fragCoord);
            }
    
            gl_FragColor = tex;
        }`,
        uniforms: {
            uTime: { value: 0 },
            uResolution: { value: { x: canvas.clientWidth, y: canvas.clientHeight } },
            uScale: { value: scale },
            lowTexture: { value: dirtTex },
            midTexture: { value: mountainTex },
            highTexture: { value: snowTex },
        }
    },
    water: {
        vertexShader: `
        `,
        fragmentShader: ``,
        uniforms: {
            uTime: { value: 0 },
            uResolution: { value: { x: canvas.clientWidth, y: canvas.clientHeight } },
            uScale: { value: scale },
        }
    }
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(.5, .5, .5);

const camera = new THREE.PerspectiveCamera( 45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000 );
scene.add(camera);

const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize( canvas.clientWidth, canvas.clientHeight );


const geometry = new THREE.PlaneGeometry(scale, scale, scale * segments, scale * segments);
const waterPlane = new THREE.PlaneGeometry(scale, scale);
const waterMat = new THREE.MeshStandardMaterial( { color: 0x0000ff } );
const material = new THREE.ShaderMaterial({ 
    uniforms: shaders.terrain.uniforms,
    vertexShader: shaders.terrain.vertexShader,
    fragmentShader: shaders.terrain.fragmentShader,
    side: THREE.DoubleSide,
});
geometry.setAttribute('position', geometry.getAttribute('position'));
geometry.setAttribute('normal', geometry.getAttribute('normal'));
console.log(geometry.getAttribute('position'));
const cube = new THREE.Mesh( geometry, material );
const water = new THREE.Mesh( waterPlane, waterMat );
if(rotatePlane === true){
    cube.rotation.x = -90 * (3.14159/180);
    water.rotation.x = -90 * (3.14159/180);
    water.position.y = -.05;
}
// const wireFrame = new THREE.WireframeGeometry(geometry);
// const line = new THREE.LineSegments( wireFrame );
// line.material.depthTest = false;
// line.material.opacity = 0.25;
// line.material.transparent = true;

// scene.add( line );
scene.add( cube );
scene.add(water);

const pLight = new THREE.PointLight();
pLight.position.z = 3;
pLight.position.y = 3;

scene.add(pLight);

camera.position.z = 5;
camera.position.y = 1;
camera.lookAt(new THREE.Vector3(0, -1.25, 0));

const gui = new GUI()
const cubeFolder = gui.addFolder('Cube')
// cubeFolder.add(line.rotation, 'x', 0, Math.PI * 2)
// cubeFolder.add(line.rotation, 'y', 0, Math.PI * 2)
// cubeFolder.add(line.rotation, 'z', 0, Math.PI * 2)
// cubeFolder.open()
const cameraFolder = gui.addFolder('Camera')
cameraFolder.add(camera.position, 'z', 0, 10)
cameraFolder.open()

const clock = new THREE.Clock();

// const orbControls = new OrbitControls(camera, renderer.domElement);
// orbControls.update();
// let flyControls = new FlyControls(camera, renderer.domElement);
// flyControls.movementSpeed = 100;

let frameNum = 0;

const animate = function () {
    requestAnimationFrame( animate );

    shaders.terrain.uniforms.uTime.value = clock.getElapsedTime();
    shaders.water.uniforms.uTime.value = clock.getElapsedTime();

    // orbControls.update();
    // flyControls.update(clock.getDelta());
    // while(frameNum % 500 === 0){
    //     console.log(frameNum/clock.getElapsedTime());
    // }
    // frameNum++;

    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;

    renderer.render( scene, camera );
};

animate();