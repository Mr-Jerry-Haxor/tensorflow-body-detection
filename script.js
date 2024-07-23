const Models = Object.freeze({
  FaceLandMarkDetection: 1,
  PoseDetection: 2,
  HandPoseDetection: 3,
});
let selectedModels = new Set();
let points = {
  poses: null,
  hands: null,
  faces: null
};

function onBodyLoad() {
  addOptions();
}

function addOptions() {
  const optionsDiv = document.getElementById("options");
  for (const [modelName, modelId] of Object.entries(Models)) {
    const div = document.createElement('div');
    div.classList.add('option')

    const label = document.createElement('label');
    label.setAttribute('for', modelId);

    const span = document.createElement("span");
    span.innerText = modelName;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = modelId;

    checkbox.onchange = (event) => { checkboxChanged(event, modelId); }

    label.appendChild(checkbox);
    label.appendChild(span);
    div.appendChild(label)

    optionsDiv.appendChild(div);
  }
}

function checkboxChanged(event, modelId) {
  if (event.target.checked && !selectedModels.has(modelId)) {
    selectedModels.add(modelId)
  }
  if (!event.target.checked && selectedModels.has(modelId)) {
    selectedModels.delete(modelId)
  }
  console.log(selectedModels);
}

function changeModel(event) {
  selectedModels = Number(event.target.value);
}

function hideLoader() {
  document.getElementById("spinner").style.display = 'none'
}

async function setupVideoStream() {
  // navigator.mediaDevices
  // .enumerateDevices()
  // .then((devices) => {
  //   devices.forEach((device) => {
  //     console.log(device);
  //     console.log(`${device.kind}: ${device.label} id = ${device.deviceId}`);
  //   });
  // })
  try {
    const videoElement = document.getElementById("video");
    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = videoStream;

    return new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        resolve(videoElement);
      };
    });
  } catch (error) {
    console.error('Error setting up video stream:', error);
  }
}

async function loadModels() {
  const netPoseDetector = await posenet.load();

  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  const detectorConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands'
  };
  const handPoseDetector = await handPoseDetection.createDetector(model, detectorConfig);

  const facemeshDetector = await facemesh.load()

  hideLoader();

  return {
    poseDetector: netPoseDetector,
    handPoseDetector: handPoseDetector,
    facemeshDetector: facemeshDetector
  };
}

async function detectPoseInRealTime(video, detectors) {
  const canvas = document.getElementById('sketch');
  const ctx = canvas.getContext('2d');

  video.width = canvas.width = video.videoWidth;
  video.height = canvas.height = video.videoHeight;

  async function poseDetectionFrame() {
    if (selectedModels.has(Models.FaceLandMarkDetection)) {
      points.faces = await detectors.facemeshDetector.estimateFaces(video);
    }
    else{
      points.faces = null;
    }
    
    if (selectedModels.has(Models.HandPoseDetection)) {
      points.hands = await detectors.handPoseDetector.estimateHands(video);
    }
    else{
      points.hands = null;
    }

    if (selectedModels.has(Models.PoseDetection)) {
      points.poses = await detectors.poseDetector.estimateMultiplePoses(video);
    }
    else{
      points.poses = null;
    }

    drawPoints(points, ctx);
    requestAnimationFrame(poseDetectionFrame);
  }
  poseDetectionFrame();
}

async function main() {
  const video = await setupVideoStream();
  const net = await loadModels();
  video.play();
  detectPoseInRealTime(video, net);
}

main();

function saveAsPicture() {
  const video = document.getElementById("video");
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0);

  // Redraw the lines on the canvas
  drawPoints(points, ctx, false);

  // Create an image from the canvas
  const image = canvas.toDataURL('image/png');

  // Create a link element and trigger a download
  const link = document.createElement('a');
  link.href = image;
  var date = new Date();
  console.log(date.toDateString());
  console.log(date.toLocaleTimeString());
  console.log(date.toString());
  link.download = 'screenshot.png';
  link.click();
}