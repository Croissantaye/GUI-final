import * as THREE from 'https://cdn.skypack.dev/three';
import { GUI } from "https://cdn.skypack.dev/three/examples/jsm/libs/dat.gui.module"
import { OrbitControls } from "https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls"
import { FlyControls } from "https://cdn.skypack.dev/three/examples/jsm/controls/FlyControls"
// import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls"

const canvas = document.querySelector("canvas#webgl");

const scale = 30;
const segments = 30;
const rotatePlane = true;

const texLoad = new THREE.TextureLoader();
const dirtTex = texLoad.load('./Ground_Dirt_007_basecolor.jpg');
const mountainTex = texLoad.load('./Rock_040_basecolor.jpg');
const snowTex = texLoad.load('./Snow_003_COLOR.jpg');
const grassTex = texLoad.load('./grass_grass_0124_01_tiled_s.jpg')

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
        uniform float uSeed;
    
        void main(){
            vPosition = position;
            vColor = vec3(0.0);
            vNormal = normal;
            vUV = uv*uScale*.5;
            vUV.y += uTime;
            vColor = vec3(layerNoise(20.0, .5, 2., vUV*uSeed));
            
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
        uniform sampler2D low2Texture;
        uniform sampler2D midTexture;
        uniform sampler2D highTexture;

        float inverseLerp(float a, float b, float v){
            return (v-a)/(b-a);
        }

        vec4 lerp(vec4 a, vec4 b, float t){
            return (1.0-t)*a+b*t;
        }
        
        vec4 CalcTerrainColor(float height, vec2 fragCoord){
            vec4 color = vec4(1.0);
            float mountainStart = .005;
            float mountainEnd = .1;
            float snowStart = .4;
            float snowEnd = .55;
            height +=.015;

            vec4 tex0 = texture(lowTexture, fragCoord);
            vec4 tex_1 = texture(low2Texture, fragCoord);
            vec4 tex1 = texture(midTexture, fragCoord);
            vec4 tex2 = texture(highTexture, fragCoord);

            color = tex0;
            // if(height > )
            if(height > .001 && height < mountainStart){
                float mixValue = inverseLerp(0., mountainStart, height);
                color = mix(tex0, tex_1,  mixValue);
            }
            else if(height > mountainStart && height < mountainEnd){
                float mixValue = inverseLerp(mountainStart, mountainEnd, height);
                color = mix(tex_1, tex1,  mixValue);
            }
            else if(height > mountainEnd && height < snowStart){
                color = tex1;
            }
            else if(height > snowStart && height < snowEnd){
                float mixValue = inverseLerp(snowStart, snowEnd, height);
                color = mix(tex1, tex2,  mixValue);
            }
            else if(height > snowEnd){
                color = tex2;
            }

            return color;
        }

        void main(){
            vec3 fragColor = vColor;
            vec2 fragCoord = fract(vUV*5.);
    
            // uncomment to show UVs
            // fragColor = vec3(fragCoord, 0.0);
    
            vec4 tex = vec4(fragColor, 1.0);
            // if(vPosition.z < .1){
            //     tex = texture(lowTexture, fragCoord);
            // }
            // else if(vPosition.z <= .5){
            //     tex = texture(midTexture, fragCoord);
            // }
            // else if(vPosition.z > .5){
            //     tex = texture(highTexture, fragCoord);
            // }
            tex = CalcTerrainColor(vPosition.z, fragCoord);
    
            gl_FragColor = tex;
        }`,
        uniforms: {
            uTime: { value: 0 },
            uResolution: { value: { x: canvas.clientWidth, y: canvas.clientHeight } },
            uScale: { value: scale },
            uSeed: {value: (Math.random()*.5)+.5 },
            lowTexture: { value: dirtTex },
            low2Texture: { value: grassTex },
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

console.log(shaders.terrain.uniforms.uSeed.value);

const scene = new THREE.Scene();
scene.background = new THREE.Color(82/256, 137/256, 227/256);

const camera = new THREE.PerspectiveCamera( 45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000 );
scene.add(camera);

const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize( canvas.clientWidth, canvas.clientHeight );


const geometry = new THREE.PlaneGeometry(scale, scale, scale * segments, scale * segments);
const waterPlane = new THREE.PlaneGeometry(scale, scale);
const waterMat = new THREE.MeshStandardMaterial( { color: 0x5289e3 } );
const material = new THREE.ShaderMaterial({ 
    uniforms: shaders.terrain.uniforms,
    vertexShader: shaders.terrain.vertexShader,
    fragmentShader: shaders.terrain.fragmentShader,
    side: THREE.DoubleSide,
});
geometry.setAttribute('position', geometry.getAttribute('position'));
geometry.setAttribute('normal', geometry.getAttribute('normal'));
// console.log(geometry.getAttribute('position'));
const cube = new THREE.InstancedMesh( geometry, material, 2 );
const worldMatrix = (pos) => {
    const position = pos
    let rotation = new THREE.Euler();
    rotation.x = -90 * 3.14159*180;
    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(rotation);
    const scale = new THREE.Vector3(10, 10, 10);
    const matrix = new THREE.Matrix4();
    matrix.compose(position, quaternion, scale);

    return matrix;
}
// let matrix = new THREE.Matrix4();
// let matrix = worldMatrix(new THREE.Vector3(scale, 0, 0));
// console.log(matrix);
// let newMat = new THREE.Matrix4();
// cube.getMatrixAt(0, newMat);
// console.log(newMat);
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
// pLight.position.z = 3;
pLight.position.y = 20;
const rectLight = new THREE.RectAreaLight({ color: 0x5289e3, intensity: 1000, width: scale, height: scale });
rectLight.position.set(0, 10, 0);
rectLight.lookAt(0, 0, 0);

scene.add(pLight);

camera.position.z = scale/2;
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