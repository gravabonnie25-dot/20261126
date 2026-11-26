let bgImage; // 儲存背景圖片 bg/3.png
let bgOffsetX = 0; // 記錄背景水平捲動偏移量（負值代表背景往左移動）
let characterSprite; // 儲存角色一的精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖
let char2StopSprite; // 儲存角色二的待機精靈圖 (2/stop/stop.png)
let char2ActionSprite; // 儲存角色二的動作精靈圖 (2/action/action.png)

let characterX; // 儲存角色一目前的水平中心位置
let isWalking = false; // 記錄角色是否已切換為走路動畫
let facingDirection = 1; // 記錄角色朝向（1 為右，-1 為左）
let isCasting = false; // 記錄角色是否正在播放施法動畫
let magicStartFrame = 0; // 記錄施法動畫開始時的畫面計數
let magicDirection = 1; // 記錄施法時鎖定的方向
let spaceIsDown = false; // 記錄空白鍵是否已按住以避免重複觸發
let activeEffects = []; // 儲存目前畫面上飛行中的魔法特效

// 數學測驗與互動特效狀態變數
let wasChar1Near = false; // 記錄前一影格角色一是否接近角色二
let currentQuiz = null; // 儲存目前的數學加法題目與選項
let quizAnswered = false; // 記錄目前題目是否已作答
let quizResult = null; // 記錄作答結果（'correct' 或 'wrong'）
let effectEndTime = 0; // 記錄煙火或閃電特效結束的時間戳記 (millis)
let fireworks = []; // 儲存煙火粒子陣列
let optionButtons = []; // 儲存四個選項按鈕的座標範圍供滑鼠點擊判定

const frameCountInSprite = 10; // 設定角色一待機精靈圖包含的影格數
const frameWidth = 139.5; // 設定角色一待機每個影格的寬度（1395 除以 10）
const frameHeight = 196; // 設定角色一待機每個影格的高度
const walkFrameCount = 9; // 設定走路精靈圖包含的影格數
const walkFrameWidth = 1246 / walkFrameCount; // 計算走路動畫每格的寬度
const walkFrameHeight = 198; // 設定走路動畫每格的高度
const magicFrameCount = 4; // 設定施法精靈圖包含的影格數
const magicFrameWidth = 1039 / magicFrameCount; // 計算施法動畫每格的寬度
const magicFrameHeight = 146; // 設定施法動畫每格的高度
const effectFrameCount = 5; // 設定魔法特效精靈圖包含的影格數
const effectFrameWidth = 740 / effectFrameCount; // 計算魔法特效每格的寬度
const effectFrameHeight = 19; // 設定魔法特效每格的高度

// 角色二精靈圖參數設定
const char2StopFrameCount = 8; // 角色二待機影格數
const char2StopFrameWidth = 699 / char2StopFrameCount; // 計算角色二待機每格寬度 (699 / 8)
const char2StopFrameHeight = 190; // 角色二待機每格高度
const char2ActionFrameCount = 12; // 角色二動作影格數
const char2ActionFrameWidth = 1975 / char2ActionFrameCount; // 計算角色二動作每格寬度 (1975 / 12)
const char2ActionFrameHeight = 225; // 角色二動作每格高度

const framesPerStep = 8; // 設定動畫每隔幾個畫面更新一格

function preload() { // 在畫布建立前載入圖片資源
  bgImage = loadImage("bg/3.png"); // 載入背景圖片 bg/3.png
  characterSprite = loadImage("1/stop/stop.png"); // 載入角色一的十格精靈圖
  walkSprite = loadImage("1/walk/walk.png"); // 載入角色一的九格走路精靈圖
  magicSprite = loadImage("1/magic/magic.png"); // 載入角色一的四格施法精靈圖
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png"); // 載入五格魔法特效精靈圖
  char2StopSprite = loadImage("2/stop/stop.png"); // 載入角色二的八格待機精靈圖
  char2ActionSprite = loadImage("2/action/action.png"); // 載入角色二的十二格動作精靈圖
} // 結束圖片載入函式

function setup() { // 初始化畫布與繪圖模式
  createCanvas(windowWidth, windowHeight); // 建立符合視窗尺寸的畫布
  imageMode(CENTER); // 讓座標代表影格的中心點
  characterX = (width * 2) / 3; // 將角色初始位置設在畫布寬度的三分之二處
  frameRate(60); // 將動畫更新速率設定為每秒六十格
} // 結束初始化函式

// 產生隨機數學加法選擇題
function generateMathQuiz() {
  const num1 = floor(random(1, 50));
  const num2 = floor(random(1, 50));
  const answer = num1 + num2;

  const optionsSet = new Set([answer]);
  while (optionsSet.size < 4) {
    const offset = floor(random(-15, 16));
    const wrongOption = answer + offset;
    if (wrongOption > 0 && wrongOption !== answer) {
      optionsSet.add(wrongOption);
    }
  }

  // 將四個選項隨機打亂
  const options = shuffle(Array.from(optionsSet));
  currentQuiz = {
    question: `${num1} + ${num2} = ?`,
    answer: answer,
    options: options
  };
  quizAnswered = false;
  quizResult = null;
}

function draw() { // 每個畫面更新一次背景與角色
  background("#87CEEB"); // 預設底色避免圖片載入前空白

  // 計算單張背景圖片依畫布高度等比例縮放後的寬度（確保至少與畫布同寬以完整覆蓋畫面）
  const bgAspect = bgImage && bgImage.height > 0 ? bgImage.width / bgImage.height : 1;
  const singleBgWidth = max(width, height * bgAspect);
  const singleBgHeight = height;

  // 計算三張背景串接後的可捲動範圍
  const minBgOffset = width - singleBgWidth * 2;
  const maxBgOffset = singleBgWidth;
  const anchorX = (width * 2) / 3; // 角色在捲動模式下的基準水平位置

  const movingRight = keyIsDown(RIGHT_ARROW); // 檢查右方向鍵目前是否按住
  const movingLeft = keyIsDown(LEFT_ARROW); // 檢查左方向鍵目前是否按住
  isWalking = movingRight || movingLeft; // 沒有按住左右鍵時切回站立動畫
  const movementStep = constrain(width * 0.004, 2, 8); // 依畫布寬度計算適合不同裝置的移動速度

  // 維持角色高度為畫布高度的 1/3，寬度依原圖寬高比等比例縮放
  const characterScale = (height / 3) / frameHeight;
  const characterWidth = frameWidth * characterScale; // 計算角色一基本顯示寬度
  const characterHeight = height / 3;

  if (movingRight) { // 按住右方向鍵
    isWalking = true; // 切換至走路動畫
    facingDirection = 1; // 設定角色朝向右方
    if (characterX < anchorX) {
      characterX = min(anchorX, characterX + movementStep);
    } else if (bgOffsetX > minBgOffset) {
      bgOffsetX = max(minBgOffset, bgOffsetX - movementStep);
    } else {
      characterX += movementStep;
    }
  } else if (movingLeft) { // 按住左方向鍵
    isWalking = true; // 切換至走路動畫
    facingDirection = -1; // 設定角色朝向左方
    if (characterX > anchorX) {
      characterX = max(anchorX, characterX - movementStep);
    } else if (bgOffsetX < maxBgOffset) {
      bgOffsetX = min(maxBgOffset, bgOffsetX + movementStep);
    } else {
      characterX -= movementStep;
    }
  }

  // 限制角色中心避免超出畫布左右邊界
  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2);

  // 繪製三張左右串接的背景圖片（左 i=-1、中 i=0、右 i=1）
  if (bgImage) {
    push();
    imageMode(CORNER);
    for (let i = -1; i <= 1; i++) {
      const drawX = bgOffsetX + i * singleBgWidth;
      image(bgImage, drawX, 0, singleBgWidth, singleBgHeight);
    }
    pop();
  }

  // --- 繪製角色二（位於最左邊背景圖 i = -1 的正中央） ---
  const leftBgCenterX = bgOffsetX - singleBgWidth / 2; // 計算最左側背景圖的中點 X 座標
  const triggerDistance = characterWidth * 1.5; // 設定角色一接近角色二的觸發距離閾值
  const isChar1Near = abs(characterX - leftBgCenterX) < triggerDistance; // 判斷角色一是否接近角色二
  const char2Facing = characterX < leftBgCenterX ? -1 : 1; // 若角色一在角色二左邊則水平翻轉 (-1)

  // 剛接近角色二時產生新題目；離開時清除題目狀態
  if (isChar1Near && !wasChar1Near) {
    generateMathQuiz();
  } else if (!isChar1Near && wasChar1Near) {
    currentQuiz = null;
    quizAnswered = false;
    optionButtons = [];
  }
  wasChar1Near = isChar1Near;

  // 根據距離選擇角色二要播放的精靈圖與影格參數
  const char2ActiveSprite = isChar1Near ? char2ActionSprite : char2StopSprite;
  const char2ActiveFrameCount = isChar1Near ? char2ActionFrameCount : char2StopFrameCount;
  const char2ActiveFrameWidth = isChar1Near ? char2ActionFrameWidth : char2StopFrameWidth;
  const char2ActiveFrameHeight = isChar1Near ? char2ActionFrameHeight : char2StopFrameHeight;

  const char2FrameIndex = floor(frameCount / framesPerStep) % char2ActiveFrameCount;
  const char2SourceX = char2FrameIndex * char2ActiveFrameWidth;
  const char2Width = char2ActiveFrameWidth * characterScale;
  const char2Height = char2ActiveFrameHeight * characterScale;
  const char2Y = height - char2Height / 2;

  if (char2ActiveSprite) {
    push();
    translate(leftBgCenterX, char2Y);
    scale(char2Facing, 1);
    image(
      char2ActiveSprite,
      0,
      0,
      char2Width,
      char2Height,
      char2SourceX,
      0,
      char2ActiveFrameWidth,
      char2ActiveFrameHeight
    );
    pop();
  }

  // --- 繪製角色一 ---
  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) {
    isCasting = false;
    activeEffects.push({
      x: characterX + magicDirection * characterWidth / 2,
      y: height - characterHeight * 0.58,
      direction: magicDirection
    });
  }

  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite;
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite;
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth;
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight;
  const elapsedMagicFrames = frameCount - magicStartFrame;
  const frameIndex = isCasting ? floor(elapsedMagicFrames / framesPerStep) : floor(frameCount / framesPerStep) % activeFrameCount;
  const sourceX = frameIndex * activeFrameWidth;
  const activeWidth = activeFrameWidth * characterScale;
  const activeHeight = activeFrameHeight * characterScale;
  const characterY = height - activeHeight / 2;

  push();
  translate(characterX, characterY);
  scale(isCasting ? magicDirection : facingDirection, 1);
  image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight);
  pop();

  // --- 繪製魔法特效 ---
  const effectScale = characterScale;
  const effectWidth = effectFrameWidth * effectScale;
  const effectHeight = effectFrameHeight * effectScale;
  const effectSpeed = max(6, width * 0.008);
  for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) {
    const effect = activeEffects[effectIndex];
    effect.x += effect.direction * effectSpeed;
    if (effect.x > width || effect.x < 0) {
      activeEffects.splice(effectIndex, 1);
      continue;
    }
    const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount;
    push();
    translate(effect.x, effect.y);
    scale(effect.direction, 1);
    image(magicEffectSprite, 0, 0, effectWidth, effectHeight, effectFrameIndex * effectFrameWidth, 0, effectFrameWidth, effectFrameHeight);
    pop();
  }

  // --- 繪製數學測驗黃色方框與選項按鈕 ---
  if (isChar1Near && currentQuiz) {
    drawQuizBox();
  }

  // --- 繪製答題後的 3 秒煙火或閃電特效 ---
  if (millis() < effectEndTime) {
    if (quizResult === "correct") {
      updateAndDrawFireworks();
    } else if (quizResult === "wrong") {
      drawLightningEffect();
    }
  } else if (fireworks.length > 0) {
    // 超過 3 秒後持續將剩餘煙火粒子淡出清除
    updateAndDrawFireworks(false);
  }
} // 結束繪圖函式

// 繪製畫布上方半透明黃色數學題目框與四個選項按鈕
function drawQuizBox() {
  const boxW = width / 3; // 寬為整個畫布寬的 1/3
  const boxH = height / 2; // 高為整個畫布高的 1/2
  const boxX = width / 2 - boxW / 2; // 方框的中間對準畫布的中間
  const boxY = 15; // 方框上方靠近畫布上方

  push();
  // 黃色方框，透明度為 90（p5.js alpha 範圍為 0~255）
  fill(255, 235, 59, 90);
  stroke(255, 193, 7, 200);
  strokeWeight(3);
  rect(boxX, boxY, boxW, boxH, 16);

  // 顯示題目文字
  noStroke();
  fill(30, 30, 30);
  textAlign(CENTER, CENTER);
  const titleSize = constrain(min(boxW * 0.11, boxH * 0.13), 18, 42);
  textSize(titleSize);
  textStyle(BOLD);
  text(currentQuiz.question, boxX + boxW / 2, boxY + boxH * 0.22);

  // 顯示作答提示或結果
  const subSize = constrain(titleSize * 0.55, 12, 22);
  textSize(subSize);
  textStyle(NORMAL);
  if (!quizAnswered) {
    fill(60, 60, 60);
    text("請點擊下方正確答案", boxX + boxW / 2, boxY + boxH * 0.36);
  } else if (quizResult === "correct") {
    fill(27, 130, 35);
    textStyle(BOLD);
    text("答對了！太棒了！", boxX + boxW / 2, boxY + boxH * 0.36);
  } else {
    fill(200, 30, 30);
    textStyle(BOLD);
    text(`答錯了！正確答案是 ${currentQuiz.answer}`, boxX + boxW / 2, boxY + boxH * 0.36);
  }

  // 繪製 2x2 排列的四個選項按鈕
  optionButtons = [];
  const btnCols = 2;
  const btnRows = 2;
  const paddingX = boxW * 0.08;
  const gapX = boxW * 0.06;
  const gapY = boxH * 0.05;
  const btnW = (boxW - paddingX * 2 - gapX) / btnCols;
  const btnH = (boxH * 0.48 - gapY) / btnRows;
  const startY = boxY + boxH * 0.45;

  for (let i = 0; i < 4; i++) {
    const col = i % btnCols;
    const row = floor(i / btnCols);
    const btnX = boxX + paddingX + col * (btnW + gapX);
    const btnY = startY + row * (btnH + gapY);
    const optVal = currentQuiz.options[i];

    // 紀錄按鈕邊界供滑鼠點擊判斷
    optionButtons.push({ x: btnX, y: btnY, w: btnW, h: btnH, value: optVal });

    const isHovered =
      mouseX >= btnX &&
      mouseX <= btnX + btnW &&
      mouseY >= btnY &&
      mouseY <= btnY + btnH;

    // 依未作答、懸停或作答後狀態設定按鈕色彩
    if (quizAnswered) {
      if (optVal === currentQuiz.answer) {
        fill(76, 175, 80, 230); // 正確答案標示綠色
      } else {
        fill(220, 220, 220, 180);
      }
    } else if (isHovered) {
      fill(255, 255, 255, 245); // 滑鼠移入高亮
    } else {
      fill(255, 255, 255, 200);
    }

    stroke(80, 80, 80, 160);
    strokeWeight(2);
    rect(btnX, btnY, btnW, btnH, 10);

    // 繪製按鈕數字
    noStroke();
    fill(quizAnswered && optVal === currentQuiz.answer ? 255 : 20);
    textSize(constrain(btnH * 0.45, 16, 32));
    textStyle(BOLD);
    text(optVal, btnX + btnW / 2, btnY + btnH / 2);
  }
  pop();
}

// 產生並繪製煙火特效
function updateAndDrawFireworks(spawnNew = true) {
  if (spawnNew && random(1) < 0.14) {
    const fx = random(width * 0.15, width * 0.85);
    const fy = random(height * 0.12, height * 0.55);
    const hueColors = [
      [255, 82, 82],
      [255, 215, 64],
      [105, 240, 174],
      [64, 196, 255],
      [224, 64, 251],
      [255, 110, 64]
    ];
    const baseColor = random(hueColors);
    for (let i = 0; i < 45; i++) {
      const angle = random(TWO_PI);
      const speed = random(2, 8);
      fireworks.push({
        x: fx,
        y: fy,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        alpha: 255,
        color: baseColor,
        size: random(4, 8)
      });
    }
  }

  push();
  noStroke();
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const p = fireworks[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12; // 重力下墜效果
    p.vx *= 0.97; // 空氣阻力
    p.alpha -= 4.5;

    if (p.alpha <= 0) {
      fireworks.splice(i, 1);
      continue;
    }

    fill(p.color[0], p.color[1], p.color[2], p.alpha);
    circle(p.x, p.y, p.size);
  }
  pop();
}

// 繪製閃電特效
function drawLightningEffect() {
  push();
  // 偶爾閃爍整畫面暗紫／白光雷擊氛圍
  if (random(1) < 0.25) {
    noStroke();
    fill(255, 255, 220, random(40, 110));
    rect(0, 0, width, height);
  }

  // 繪製 1 至 2 道鋸齒狀閃電光束
  const boltCount = random(1) < 0.4 ? 2 : 1;
  for (let b = 0; b < boltCount; b++) {
    let currX = random(width * 0.2, width * 0.8);
    let currY = 0;
    const segments = 12;
    const stepY = (height * 0.85) / segments;
    const points = [{ x: currX, y: currY }];

    for (let s = 0; s < segments; s++) {
      currX += random(-45, 45);
      currY += stepY;
      points.push({ x: currX, y: currY });
    }

    // 外層黃藍色電弧光暈
    noFill();
    stroke(180, 220, 255, 160);
    strokeWeight(10);
    beginShape();
    for (const pt of points) {
      vertex(pt.x, pt.y);
    }
    endShape();

    // 內層高亮白黃色閃電核心
    stroke(255, 255, 210, 245);
    strokeWeight(4);
    beginShape();
    for (const pt of points) {
      vertex(pt.x, pt.y);
    }
    endShape();
  }
  pop();
}

// 滑鼠點擊選項按鈕判斷
function mousePressed() {
  if (isChar1Near && currentQuiz && !quizAnswered) {
    for (const btn of optionButtons) {
      if (
        mouseX >= btn.x &&
        mouseX <= btn.x + btn.w &&
        mouseY >= btn.y &&
        mouseY <= btn.y + btn.h
      ) {
        quizAnswered = true;
        if (btn.value === currentQuiz.answer) {
          quizResult = "correct";
          fireworks = [];
        } else {
          quizResult = "wrong";
        }
        effectEndTime = millis() + 3000; // 設定特效持續 3 秒 (3000 毫秒)
        break;
      }
    }
  }
}

function keyPressed() { // 按下方向鍵時切換角色狀態與朝向
  if (keyCode === RIGHT_ARROW) {
    isWalking = true;
    facingDirection = 1;
    return false;
  }
  if (keyCode === LEFT_ARROW) {
    isWalking = true;
    facingDirection = -1;
    return false;
  }
  if (keyCode === 32) {
    if (!spaceIsDown && !isCasting) {
      isCasting = true;
      magicStartFrame = frameCount;
      magicDirection = facingDirection;
    }
    spaceIsDown = true;
    return false;
  }
}

function keyReleased() { // 鍵盤按鍵放開時更新按鍵狀態
  if (keyCode === 32) {
    spaceIsDown = false;
  }
}

function windowResized() { // 視窗尺寸改變時重新調整畫布
  resizeCanvas(windowWidth, windowHeight);
  characterX = constrain(characterX, 1, width - 1);
}