const Models = Object.freeze({
    PlainVideo: 0,
    SimpleFaceDetection: 1,
    FaceLandMarkDetection: 2,
    PoseDetection: 3,
    BodySegmentation: 4,
    HandPoseDetection: 5,
    PortraitDepthEstimation: 6,
});
let selectedModel = Models.PlainVideo;

function onBodyLoad(){
    addOptions();
}


function addOptions(){
    const select = document.getElementById("detectionModel"); 
    for (const [key, value] of Object.entries(Models)) {
        var option = document.createElement("option");
        option.value = value;
        option.innerText = key;
        select.appendChild(option);
    }
}

function toggleMainVideo(event){
    let mainVideo = document.getElementsByClassName("mainvideo")[0];
    if(event.target.checked){
        mainVideo.style.display = 'block'
        mainVideo.classList.remove("hidden");
        mainVideo.classList.add("show");
    }
    else{
        mainVideo.classList.remove("show");
        mainVideo.classList.add("hidden");
    }
}

function changeModel(event){
    selectedModel = Number(event.target.value);
}


async function setupVideoStream() {
  try {
    const mainvideo = document.getElementById("video");
    const mainstream = await navigator.mediaDevices.getUserMedia({ video: true });

    const videoelement = document.getElementById("motion");

    mainvideo.srcObject = mainstream;
    videoelement.srcObject = mainstream;

    return new Promise((resolve) => {
        videoelement.onloadedmetadata = () => {
        resolve(videoelement);
      };
    });
  } catch (error) {
    console.error('Error setting up video stream:', error);
  }
}

async function loadPoseNet() {
  const net = await posenet.load();
  
  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  const detectorConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands'
  };
  const handPoseDetector = await handPoseDetection.createDetector(model, detectorConfig);
  
  const facemeshDetector = await getFaceMeshDetector();

  document.getElementById("spinner").style.display = 'none'

  return {
    posenet: net,
    handPoseDetector: handPoseDetector,
    facemeshDetector: facemeshDetector
  };
}

async function getFaceMeshDetector(){
  return await facemesh.load()
  const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
  const detectorConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
  };
  detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
  return detector;
}

async function detectPoseInRealTime(video, detectors) {
  const canvas = document.getElementById('sketch');
  const ctx = canvas.getContext('2d');

  video.width = canvas.width = video.videoWidth;
  video.height = canvas.height = video.videoHeight;

  async function poseDetectionFrame() {

    switch(selectedModel){
        case Models.PlainVideo:
            break;
        case Models.SimpleFaceDetection:
            break;
        case Models.FaceLandMarkDetection:
            const faces = await detectors.facemeshDetector.estimateFaces(video);
            drawFaceMesh(faces, ctx);
            break;
        case Models.PoseDetection:
            const pose = await detectors.posenet.estimateMultiplePoses(video);
            drawPose(pose, ctx);
            break;
        case Models.BodySegmentation:
            break;
        case Models.HandPoseDetection:
            const handpose = await detectors.handPoseDetector.estimateHands(video);
            drawHands(handpose,ctx);
            break;
        case Models.PortraitDepthEstimation:
            break;
    }
    requestAnimationFrame(poseDetectionFrame);
  }
  poseDetectionFrame();
}

async function main() {
  const video = await setupVideoStream();
  const net = await loadPoseNet();
  video.play();
  detectPoseInRealTime(video, net);
}

main();