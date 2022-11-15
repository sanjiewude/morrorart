import "./js/three.js";

import * as THREE from "./js/three.module.js";

// import "./js/Stats.js";
import { GLTFLoader } from "./js/GLTFLoader.js";
import { OrbitControls } from "./js/OrbitControls.js";
import { RGBELoader } from "./js/RGBELoader.js";

const canvas = document.getElementById("canvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  50,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true,
});
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

//环境贴图
const environment = new RGBELoader();
environment.load(
  "./environment/brown_photostudio_02_1k.hdr",
  function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    // scene.background = texture; //HDR作为背景
    loadModels();
  }
);

//初始化控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true; //自动旋转
controls.autoRotateSpeed = 0.5;
controls.enablePan = true; //仅用相机平移
controls.enableZoom = true; //相机缩放
// controls.minPolarAngle = Math.PI / 3; //相机竖直旋转角度
// controls.maxPolarAngle = Math.PI / 2; //相机竖直旋转角度
// controls.minAzimuthAngle = -Math.PI / 2; //相机水平旋转角度
// controls.maxAzimuthAngle = Math.PI / 2; //相机水平旋转角度
controls.minDistance = 0.5;
controls.maxDistance = 1;
controls.dampingFactor = 1;
// controls.autoRotate = true; //自动旋转

//初始化性能检测器
// const stats = new Stats();
// document.body.appendChild(stats.dom);

//加载模型
const loader = new GLTFLoader();
let i, x, y, z, m;
i = window.innerWidth / window.innerHeight;
var models;


//获取视频
let video = document.createElement("video");
video.src = "./img/video.mp4"; // 设置视频地址
// video.autoplay = "autoplay"; //要设置播放
video.loop = "loop";
video.controls = "controls";
console.log("video", video);

//加载视频贴图
let texture = new THREE.VideoTexture(video);
console.log("texture", texture);
// texture.rotation = Math.PI;
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat = new THREE.Vector2(1, -1);
function playVideo() {
  if (video.paused) video.play();
  else video.pause();
}
window.playVideo = playVideo;

function loadModels(val) {
  const url = "./models/speaker.glb";
  loader.load(url, function (gltf) {
    //计算模型包围盒
    models = gltf.scene;
    let bbox = new THREE.Box3().setFromObject(gltf.scene);
    x = bbox.max.x - bbox.min.x;
    y = bbox.max.y - bbox.min.y;
    z = bbox.max.z - bbox.min.z;
    gltf.scene.position.set(
      -(bbox.max.x + bbox.min.x) / 2,
      -(bbox.max.y + bbox.min.y) / 2,
      -(bbox.max.z + bbox.min.z) / 2
    );

    var f = 20; //通过调整这个值来调整在窗口中的大小
    if (y / x >= i) {
      let h = y;
      let Fov = (camera.fov * Math.PI) / 180;
      m = h / (f * Math.tan(Fov * 0.5));
      camera.position.y = 2 * m + y / 2;
      camera.position.z = 2 * m + z / 2;
      camera.position.x = 2 * m + x / 2;
    } else {
      let w = x;
      let h = w * i;
      let Fov = (camera.fov * Math.PI) / 180;
      m = h / (f * Math.tan(Fov * 0.5));
      camera.position.y = 2 * m - y ; //如果需要看正面则改为“0”，例如：看正对Z轴的面，则x和y是0
      camera.position.z = 2 * m + z / 2;
      camera.position.x = 2 * m + x / 2;

      // camera.position.y = 0;  //这是看正面的参数
      // camera.position.z = 2 * m + (z / 2);
      // camera.position.x = 0;
    }

    // const axisHelper = new THREE.AxesHelper(5);
    // scene.add(axisHelper);

    const light = new THREE.AmbientLight(0xffffff, 1); //两个值，颜色，强度
    scene.add(light);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(-0.752, 0.203, -0.867);
    scene.add(directionalLight1);
    // const directhelper1 = new THREE.DirectionalLightHelper(directionalLight1, 5);
    // scene.add(directhelper1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight2.position.set(0.752, -0.203, 0.867);
    scene.add(directionalLight2);
    // const directhelper2 = new THREE.DirectionalLightHelper(directionalLight2, 5);
    // scene.add(directhelper2);

    const pointLight = new THREE.PointLight(0xffffff, 2, 150, 2); //四个值，颜色，强度，距离，衰减
    pointLight.position.set(-1.5, -0, 1.5);
    scene.add(pointLight);
    // const sphereSize = 1;
    // const pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize);
    // scene.add(pointLightHelper);

    var screen = models.getObjectByName("screen");
    console.log(screen.material);
    screen.material.map = texture;
    screen.material.side = THREE.FrontSide;
    var frame = models.getObjectByName("frame");
    frame.material.depthWrite = true;

    scene.add(gltf.scene);
  });
}

window.loadModels = loadModels;

//默认立方体
// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// camera.position.z = 5;

//屏幕自适应
// window.addEventListener("resize", onWindowResize, true);
window.onWindowResize = function () {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};

render();
function render() {
  requestAnimationFrame(render);
    renderer.render(scene, camera); //执行渲染操作
    controls.update();
  }

// function animate() {
//   render();
//   camera.updateProjectionMatrix();
//   controls.update();
// }
// animate();
