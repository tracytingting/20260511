let capture;
let faceMesh;
let handPose;
let faces = [];
let hands = [];
let earringImgs = [];
let faceOverlayImgs = [];
let currentEarringIndex = 0; // 預設顯示第一款
let isModelLoaded = false;

function preload() {
  // 載入 ml5.js 的模型
  // 提醒：請確保您的 HTML 檔案已引入 <script src="https://unpkg.com/ml5@1/dist/ml5.min.js"></script>
  console.log("正在載入 AI 模型...");
  faceMesh = ml5.faceMesh(() => console.log("FaceMesh 載入完成"));
  handPose = ml5.handPose();
  
  // 載入指定的 5 款耳環圖片
  earringImgs[0] = loadImage('pic/acc1_ring.png');
  earringImgs[1] = loadImage('pic/acc2_pearl.png');
  earringImgs[2] = loadImage('pic/acc3_tassel.png');
  earringImgs[3] = loadImage('pic/acc4_jade.png');
  earringImgs[4] = loadImage('pic/acc5_phoenix.png');

  // 載入臉部裝飾圖片 (假設放在 pic 目錄下)
  faceOverlayImgs[0] = loadImage('pic/4379901.png');
  faceOverlayImgs[1] = loadImage('pic/4379902.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 擷取攝影機影像，並在成功開啟後顯示訊息
  capture = createCapture(VIDEO);
  capture.size(640, 480); // 設定固定解析度以利座標映射計算
  capture.hide();

  console.log("正在啟動偵測器...");
  // 開始持續偵測臉部關鍵點
  faceMesh.detectStart(capture, (results) => {
    faces = results;
  });
  // 開始持續偵測手勢
  handPose.detectStart(capture, (results) => {
    hands = results;
  });
  
  isModelLoaded = true;
}

function draw() {
  background('#e7c6ff');

  if (!isModelLoaded) {
    textAlign(CENTER, CENTER);
    textSize(24);
    text("模型載入中，請稍候...", width / 2, height / 2);
    return;
  }

  push();
  // 將原點移至畫面中心
  translate(width / 2, height / 2);
  // 左右翻轉影像 (鏡像效果)
  scale(-1, 1);
  imageMode(CENTER);
  // 繪製影像，尺寸為視窗寬高的 50%
  image(capture, 0, 0, width * 0.5, height * 0.5);

  // 處理手勢辨識以切換耳環
  let fingerCount = 0;
  if (hands.length > 0) {
    fingerCount = countFingers(hands[0]);
    // 如果伸出 1~5 根手指，則切換對應的圖片索引 (0~4)
    if (fingerCount >= 1 && fingerCount <= 5) {
      currentEarringIndex = fingerCount - 1;
    }
  }

  // 如果有辨識到臉部，則在耳垂位置畫圓
  if (faces.length > 0) {
    let face = faces[0];

    // 當手勢為 1 或 2 時，在臉部位置顯示對應圖片
    if (fingerCount === 1 || fingerCount === 2) {
      let nosePt = face.keypoints[1]; // 使用鼻尖作為中心點
      if (nosePt) {
        let fx = map(nosePt.x, 0, capture.width, -width * 0.25, width * 0.25);
        let fy = map(nosePt.y, 0, capture.height, -height * 0.25, height * 0.25);
        // 顯示臉部裝飾，寬高設定為畫面寬度的 25%
        image(faceOverlayImgs[fingerCount - 1], fx, fy, width * 0.25, width * 0.25);
      }
    }

    // MediaPipe Face Mesh 關鍵點索引：132 (右耳區) 與 361 (左耳區)
    let earIndices = [132, 361];
    
    earIndices.forEach(idx => {
      let pt = face.keypoints[idx];
      if (pt) {
        // 將原始偵測座標映射到畫布上縮放後的影像位置
        let x = map(pt.x, 0, capture.width, -width * 0.25, width * 0.25);
        let y = map(pt.y, 0, capture.height, -height * 0.25, height * 0.25);
        // 根據目前手勢決定的索引顯示對應耳環
        image(earringImgs[currentEarringIndex], x, y, width * 0.04, width * 0.04);
      }
    });
  }
  pop();
}

// 簡單的手指計數函數
function countFingers(hand) {
  let count = 0;
  // 手指末端索引：食指(8), 中指(12), 無名指(16), 小指(20)
  // 判斷方式：如果指尖的 Y 座標低於第二關節，視為伸出
  let tips = [8, 12, 16, 20];
  let joints = [6, 10, 14, 18];
  
  for (let i = 0; i < tips.length; i++) {
    if (hand.keypoints[tips[i]].y < hand.keypoints[joints[i]].y) count++;
  }
  
  // 大拇指(4) 的判斷邏輯較特殊，簡單判斷其高度
  if (hand.keypoints[4].y < hand.keypoints[3].y) count++;
  
  return count;
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}
