const Models = Object.freeze({
    PlainVideo: 0,
    SimpleFaceDetection: 1,
    FaceLandMarkDetection: 2,
    PoseDetection: 3,
    BodySegmentation: 4,
    HandPoseDetection: 5,
    PortraitDepthEstimation: 6,
});

function onBodyLoad(){
    addOptions();
}

let selectedModel = Models.PlainVideo;

function addOptions(){
    const select = document.getElementById("detectionModel"); 
    for (const [key, value] of Object.entries(Models)) {
        var option = document.createElement("option");
        option.value = value;
        option.innerText = key;
        select.appendChild(option);
    }
}

function changeModel(event){
    selectedModel = event.target.value;
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
  return net;
}

async function detectPoseInRealTime(video, net) {
  const canvas = document.getElementById('sketch');
  const ctx = canvas.getContext('2d');

  video.width = canvas.width = video.videoWidth;
  video.height = canvas.height = video.videoHeight;

  async function poseDetectionFrame() {

    switch(Number(selectedModel)){
        case Models.PlainVideo:
            break;
        case Models.SimpleFaceDetection:
            break;
        case Models.FaceLandMarkDetection:
            break;
        case Models.PoseDetection:
            const pose = await net.estimateSinglePose(video);
            drawPose(pose, ctx);
            break;
        case Models.BodySegmentation:
            break;
        case Models.HandPoseDetection:
            break;
        case Models.PortraitDepthEstimation:
            break;
    }
    requestAnimationFrame(poseDetectionFrame);
  }
  poseDetectionFrame();
}

function drawPose(pose, ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawKeypoints(pose.keypoints, ctx);
  drawSkeleton(pose.keypoints, ctx);
}

function drawKeypoints(keypoints, ctx) {
  keypoints.forEach(keypoint => {
    if (keypoint.score > 0.5) {
      const { y, x } = keypoint.position;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
    }
  });
}

function drawSkeleton(keypoints, ctx) {
  const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, 0.5);

  adjacentKeyPoints.forEach(keypoints => {
    const [from, to] = keypoints;
    ctx.beginPath();
    ctx.moveTo(from.position.x, from.position.y);
    ctx.lineTo(to.position.x, to.position.y);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

async function main() {
  const video = await setupVideoStream();
  const net = await loadPoseNet();
  video.play();
  detectPoseInRealTime(video, net);
}

main();