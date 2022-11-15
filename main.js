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
// controls.autoRotate = true; //自动旋转

//初始化性能检测器
const stats = new Stats();
document.body.appendChild(stats.dom);

//加载模型
const loader = new GLTFLoader();
let i, x, y, z, m;
i = canvas.clientWidth / canvas.clientHeight;
var models;
let mixer;

//获取视频
let video = document.createElement("video");
video.src = "./img/video.mp4"; // 设置视频地址
video.autoplay = "autoplay"; //要设置播放
video.loop = "loop";
video.controls = "controls";
console.log("video", video);

//加载视频贴图
let texture = new THREE.VideoTexture(video);
console.log("texture", texture);
// texture.rotation = Math.PI;
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat =new THREE.Vector2(1,-1);
function playVideo() {
  if (video.paused)
   video.play();
  else 
    video.pause();
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
      camera.position.y = 2 * m + y / 2; //如果需要看正面则改为“0”，例如：看正对Z轴的面，则x和y是0
      camera.position.z = 2 * m + z / 2;
      camera.position.x = 2 * m + x / 2;

      // camera.position.y = 0;  //这是看正面的参数
      // camera.position.z = 2 * m + (z / 2);
      // camera.position.x = 0;
    }

    const axisHelper = new THREE.AxesHelper(5);
    scene.add(axisHelper);

    const light = new THREE.AmbientLight(0xffffff, 0.3); //两个值，颜色，强度
    scene.add(light);

    const pointLight = new THREE.PointLight(0xffffff, 1, 150, 2); //四个值，颜色，强度，距离，衰减
    pointLight.position.set(-1.5, -0, -1.5);
    scene.add(pointLight);
    const sphereSize = 1;
    const pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize);
    scene.add(pointLightHelper);

    var screen = models.getObjectByName("screen");
    console.log(screen.material);
    screen.material.map = texture;
    screen.material.side = THREE.FrontSide;
    var frame = models.getObjectByName("frame");
    frame.material.depthWrite = true;

    scene.add(gltf.scene);

    mixer = new THREE.AnimationMixer(models);
    mixer.clipAction(gltf.animations[0]).play();
    animate();
  });
}

window.loadModels = loadModels;

//清空场景
function clearScene() {
  // cancelAnimationFrame(this.animationId);
  scene.traverse((child) => {
    if (child.material) {
      child.material.dispose();
    }
    if (child.geometry) {
      child.geometry.dispose();
    }
    child = null;
  });
  // this.sceneDomElement.innerHTML = '';
  // this.renderer.forceContextLoss();
  renderer.dispose();
  scene.clear();
  // this.flows = [];
  // scene = null;
  // this.camera = null;
  // this.controls = null;
  // renderer.domElement = null;
  // renderer = null;
  // this.sceneDomElement = null;
}

//默认立方体
// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// camera.position.z = 5;

//屏幕自适应
window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

// 创建一个时钟对象Clock
var clock = new THREE.Clock();
// 设置渲染频率为30FBS，也就是每秒调用渲染器render方法大约30次
var FPS = 60;
var renderT = 1 / FPS; //单位秒  间隔多长时间渲染渲染一次
// 声明一个变量表示render()函数被多次调用累积时间
// 如果执行一次renderer.render，timeS重新置0
var timeS = 0;

render();
function render() {
  requestAnimationFrame(render);
  //.getDelta()方法获得两帧的时间间隔
  var T = clock.getDelta();
  timeS = timeS + T;
  // requestAnimationFrame默认调用render函数60次，通过时间判断，降低renderer.render执行频率
  if (timeS > renderT) {
    // 控制台查看渲染器渲染方法的调用周期，也就是间隔时间是多少
    // console.log(`调用.render时间间隔`, timeS * 1000 + '毫秒');
    renderer.render(scene, camera); //执行渲染操作
    //renderer.render每执行一次，timeS置0
    timeS = 0;
    stats.update();
  }
  // mixer.update(T);
}

function animate() {
  render();
  camera.updateProjectionMatrix();
  controls.update();
}
animate();
