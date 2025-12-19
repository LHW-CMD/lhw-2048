// 全局变量默认初始化
let grid = [];
let tiles = [];
let score = 0;
let isGameOver = false;
const boardSize = 4;
// 游戏计时相关变量（最高成绩用时记录）
let gameStartTime = 0; // 游戏开始时间戳
let gameTimer = null; // 计时定时器
let currentTime = 0; // 当前游戏用时（秒）

// DOM元素缓存（新增最高成绩、最佳用时元素）
let dom = {
    loginPanel: null,
    gamePanel: null,
    tipText: null,
    usernameInput: null,
    passwordInput: null,
    loginBtn: null,
    registerBtn: null,
    logoutBtn: null,
    gridEl: null,
    scoreEl: null,
    gameOverEl: null,
    finalScoreEl: null,
    restartBtn: null,
    restartGameBtn: null,
    highScoreEl: null, // 最高成绩元素
    bestTimeEl: null   // 最佳用时元素
};

// 第一步：等待页面完全加载（兼容旧浏览器，用onload替代DOMContentLoaded）
window.onload = function() {
    // 初始化DOM元素
    initDOM();
    // 绑定事件
    bindAllEvents();
    // 强制初始化本地存储和输入框（解决跨浏览器输入问题）
    initBrowserCompatibility();
    // 检查登录状态
    checkLoginStatus();
    // 初始化最高成绩和最佳用时显示
    initHighScoreAndBestTime();
    console.log('页面加载完成，DOM初始化成功');
};

// 初始化DOM元素（增加容错判断，新增输入框激活逻辑）
function initDOM() {
    dom.loginPanel = document.getElementById('loginPanel') || null;
    dom.gamePanel = document.getElementById('gamePanel') || null;
    dom.tipText = document.getElementById('tipText') || null;
    dom.usernameInput = document.getElementById('username') || null;
    dom.passwordInput = document.getElementById('password') || null;
    dom.loginBtn = document.getElementById('loginBtn') || null;
    dom.registerBtn = document.getElementById('registerBtn') || null;
    dom.logoutBtn = document.getElementById('logoutBtn') || null;
    dom.gridEl = document.getElementById('grid') || null;
    dom.scoreEl = document.getElementById('score') || null;
    dom.gameOverEl = document.getElementById('gameOver') || null;
    dom.finalScoreEl = document.getElementById('finalScore') || null;
    dom.restartBtn = document.getElementById('restartBtn') || null;
    dom.restartGameBtn = document.getElementById('restartGameBtn') || null;
    dom.highScoreEl = document.getElementById('highScore') || null;
    dom.bestTimeEl = document.getElementById('bestTime') || null;

    // 强制激活输入框（解决无法输入核心问题）
    if (dom.usernameInput) {
        // 移除所有可能禁用输入的属性
        dom.usernameInput.removeAttribute('disabled');
        dom.usernameInput.removeAttribute('readonly');
        // 确保输入框可获取焦点
        dom.usernameInput.style.pointerEvents = 'auto';
        dom.usernameInput.style.opacity = '1';
        dom.usernameInput.style.zIndex = '100';
    }
    if (dom.passwordInput) {
        dom.passwordInput.removeAttribute('disabled');
        dom.passwordInput.removeAttribute('readonly');
        dom.passwordInput.style.pointerEvents = 'auto';
        dom.passwordInput.style.opacity = '1';
        dom.passwordInput.style.zIndex = '100';
    }
}

// 新增：浏览器兼容性兜底初始化（解决跨浏览器数据和输入问题）
function initBrowserCompatibility() {
    // 1. 强制初始化本地存储用户列表，避免数据为空导致异常
    if (!localStorage.getItem('2048UserList')) {
        localStorage.setItem('2048UserList', JSON.stringify([]));
        console.log('本地存储用户列表初始化成功');
    }
    // 2. 自动给账号输入框获取焦点（方便用户输入）
    setTimeout(() => {
        if (dom.usernameInput && dom.loginPanel.style.display !== 'none') {
            dom.usernameInput.focus();
            console.log('账号输入框自动获取焦点');
        }
    }, 500);
    // 3. 兼容旧浏览器localStorage异常（如隐私模式下）
    try {
        localStorage.setItem('2048Test', 'test');
        localStorage.removeItem('2048Test');
    } catch (e) {
        alert('当前浏览器禁用了本地存储，请退出隐私模式后再使用！');
        console.error('本地存储禁用异常：', e);
    }
}

// 显示提示文字
function showTip(text, isError = true) {
    if (!dom.tipText) return;
    dom.tipText.style.display = 'block';
    dom.tipText.textContent = text;
    dom.tipText.style.color = isError ? '#ff5252' : '#4caf50';
    setTimeout(() => {
        if (dom.tipText) dom.tipText.style.display = 'none';
    }, 3000);
}

// 注册功能（新增：初始化用户最高成绩和用时，兼容空数据）
function handleRegister() {
    if (!dom.usernameInput || !dom.passwordInput) {
        showTip('输入框加载异常，请刷新页面！');
        return;
    }
    const username = dom.usernameInput.value.trim();
    const password = dom.passwordInput.value.trim();

    if (!username || !password) {
        showTip('账号和密码不能为空！');
        return;
    }

    // 兼容本地存储读取异常
    let userList = [];
    try {
        userList = JSON.parse(localStorage.getItem('2048UserList')) || [];
    } catch (e) {
        userList = [];
        localStorage.setItem('2048UserList', JSON.stringify(userList));
    }

    const userExist = userList.some(u => u.username === username);
    if (userExist) {
        showTip('该账号已存在，请直接登录！');
        return;
    }

    // 注册时初始化最高成绩和最佳用时
    userList.push({ 
        username, 
        password,
        highScore: 0,    // 初始最高成绩
        bestTime: 0      // 初始最佳用时（秒）
    });
    // 容错保存本地数据
    try {
        localStorage.setItem('2048UserList', JSON.stringify(userList));
        showTip('注册成功，请登录！', false);
        // 注册后清空输入框并聚焦到账号框
        dom.usernameInput.value = '';
        dom.passwordInput.value = '';
        dom.usernameInput.focus();
    } catch (e) {
        showTip('注册失败，请退出隐私模式！');
        console.error('注册数据保存异常：', e);
    }
}

// 登录功能（兼容输入框和本地存储异常）
function handleLogin() {
    if (!dom.usernameInput || !dom.passwordInput || !dom.gamePanel || !dom.loginPanel) {
        showTip('页面元素加载异常，请刷新页面！');
        return;
    }
    const username = dom.usernameInput.value.trim();
    const password = dom.passwordInput.value.trim();

    if (!username || !password) {
        showTip('账号和密码不能为空！');
        return;
    }

    // 兼容本地存储读取异常
    let userList = [];
    try {
        userList = JSON.parse(localStorage.getItem('2048UserList')) || [];
    } catch (e) {
        userList = [];
        showTip('用户数据异常，请重新注册！');
        return;
    }

    const validUser = userList.find(u => u.username === username && u.password === password);
    if (!validUser) {
        showTip('账号或密码错误，请重试！');
        // 错误后清空密码框并聚焦
        dom.passwordInput.value = '';
        dom.passwordInput.focus();
        return;
    }

    // 容错保存当前登录用户
    try {
        localStorage.setItem('2048CurrentUser', username);
        dom.loginPanel.style.display = 'none';
        dom.gamePanel.style.display = 'block';
        // 初始化最高成绩和最佳用时显示
        initHighScoreAndBestTime();
        initGame(); // 强制初始化游戏
        // 清空输入框
        dom.usernameInput.value = '';
        dom.passwordInput.value = '';
    } catch (e) {
        showTip('登录失败，请退出隐私模式！');
        console.error('登录状态保存异常：', e);
    }
}

// 退出登录（新增：停止计时，兼容元素异常）
function handleLogout() {
    if (!dom.gamePanel || !dom.loginPanel) return;
    // 退出时停止计时
    stopGameTimer();
    // 容错移除当前登录用户
    try {
        localStorage.removeItem('2048CurrentUser');
    } catch (e) {
        console.error('移除登录状态异常：', e);
    }
    dom.gamePanel.style.display = 'none';
    dom.loginPanel.style.display = 'block';
    isGameOver = true;
    score = 0;
    tiles = [];
    grid = [];
    if (dom.scoreEl) dom.scoreEl.textContent = 0;
    // 退出后聚焦到账号输入框
    setTimeout(() => {
        if (dom.usernameInput) dom.usernameInput.focus();
    }, 300);
}

// 检查登录状态（兼容本地存储异常）
function checkLoginStatus() {
    if (!dom.gamePanel || !dom.loginPanel) return;
    // 容错读取当前登录用户
    let currentUser = '';
    try {
        currentUser = localStorage.getItem('2048CurrentUser') || '';
    } catch (e) {
        currentUser = '';
        console.error('读取登录状态异常：', e);
    }
    if (currentUser) {
        dom.loginPanel.style.display = 'none';
        dom.gamePanel.style.display = 'block';
        // 初始化最高成绩和最佳用时显示
        initHighScoreAndBestTime();
        initGame();
    } else {
        // 未登录时聚焦到账号输入框
        setTimeout(() => {
            if (dom.usernameInput) dom.usernameInput.focus();
        }, 500);
    }
}

// 绑定所有事件（兼容旧浏览器事件绑定）
function bindAllEvents() {
    // 兼容旧浏览器，用onclick替代addEventListener
    if (dom.registerBtn) dom.registerBtn.onclick = handleRegister;
    if (dom.loginBtn) dom.loginBtn.onclick = handleLogin;
    if (dom.logoutBtn) dom.logoutBtn.onclick = handleLogout;
    if (dom.restartBtn) dom.restartBtn.onclick = initGame;
    if (dom.restartGameBtn) dom.restartGameBtn.onclick = initGame;

    // 键盘事件（兼容输入框输入时不触发游戏操作）
    document.onkeydown = function(e) {
        // 若输入框获取焦点，不触发游戏方向键操作，确保正常输入
        if (document.activeElement === dom.usernameInput || document.activeElement === dom.passwordInput) {
            return;
        }
        handleKeyDown(e);
    };
    // 触摸事件
    document.ontouchstart = handleTouchStart;
    document.ontouchend = handleTouchEnd;
}

// 初始化棋盘（强制生成4x4网格）
function initGrid() {
    if (!dom.gridEl) return;
    dom.gridEl.innerHTML = '';
    grid = [];

    // 强制循环生成4x4单元格
    for (let i = 0; i < 4; i++) {
        grid[i] = [0, 0, 0, 0];
        for (let j = 0; j < 4; j++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            dom.gridEl.appendChild(cell);
        }
    }
}

// 创建瓦片（用CSS变量传递行列，解决对齐问题）
function createTile(value, row, col) {
    if (!dom.gridEl) return null;
    const tile = document.createElement('div');
    tile.className = `tile tile-${value}`;
    tile.textContent = value;

    // 用CSS变量传递行列，彻底解决对齐问题
    tile.style.setProperty('--row', row);
    tile.style.setProperty('--col', col);

    dom.gridEl.appendChild(tile);
    return { element: tile, value: value, row: row, col: col };
}

// 随机生成瓦片
function spawnRandomTile() {
    if (!dom.gridEl) return;
    const emptyCells = [];

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (grid[i][j] === 0) {
                emptyCells.push({ row: i, col: j });
            }
        }
    }

    if (emptyCells.length === 0) return;
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;

    grid[randomCell.row][randomCell.col] = value;
    const newTile = createTile(value, randomCell.row, randomCell.col);
    if (newTile) tiles.push(newTile);
}

// 更新瓦片显示
function updateTiles() {
    if (!dom.gridEl) return;
    // 移除旧瓦片
    tiles.forEach(tile => {
        if (tile.element && tile.element.parentNode) {
            tile.element.parentNode.removeChild(tile.element);
        }
    });
    tiles = [];

    // 生成新瓦片
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (grid[i][j] !== 0) {
                const tile = createTile(grid[i][j], i, j);
                if (tile) tiles.push(tile);
            }
        }
    }
}

// 移动瓦片（新增：检查最高成绩更新）
function moveTiles(direction) {
    if (isGameOver || !dom.gridEl) return;
    let moved = false;
    let newGrid = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];

    switch (direction) {
        case 'left':
            for (let i = 0; i < 4; i++) {
                let row = grid[i].filter(v => v !== 0);
                for (let j = 0; j < row.length - 1; j++) {
                    if (row[j] === row[j+1]) {
                        row[j] *= 2;
                        score += row[j];
                        row.splice(j+1, 1);
                        moved = true;
                    }
                }
                for (let j = 0; j < row.length; j++) {
                    newGrid[i][j] = row[j];
                }
                if (JSON.stringify(grid[i]) !== JSON.stringify(newGrid[i])) moved = true;
            }
            break;
        case 'right':
            for (let i = 0; i < 4; i++) {
                let row = grid[i].filter(v => v !== 0);
                for (let j = row.length - 1; j > 0; j--) {
                    if (row[j] === row[j-1]) {
                        row[j] *= 2;
                        score += row[j];
                        row.splice(j-1, 1);
                        moved = true;
                    }
                }
                for (let j = 0; j < row.length; j++) {
                    newGrid[i][3 - (row.length - 1 - j)] = row[j];
                }
                if (JSON.stringify(grid[i]) !== JSON.stringify(newGrid[i])) moved = true;
            }
            break;
        case 'up':
            for (let j = 0; j < 4; j++) {
                let col = [];
                for (let i = 0; i < 4; i++) {
                    if (grid[i][j] !== 0) col.push(grid[i][j]);
                }
                for (let i = 0; i < col.length - 1; i++) {
                    if (col[i] === col[i+1]) {
                        col[i] *= 2;
                        score += col[i];
                        col.splice(i+1, 1);
                        moved = true;
                    }
                }
                for (let i = 0; i < col.length; i++) {
                    newGrid[i][j] = col[i];
                }
                let oldCol = [];
                let newCol = [];
                for (let i = 0; i < 4; i++) {
                    oldCol.push(grid[i][j]);
                    newCol.push(newGrid[i][j]);
                }
                if (JSON.stringify(oldCol) !== JSON.stringify(newCol)) moved = true;
            }
            break;
        case 'down':
            for (let j = 0; j < 4; j++) {
                let col = [];
                for (let i = 0; i < 4; i++) {
                    if (grid[i][j] !== 0) col.push(grid[i][j]);
                }
                for (let i = col.length - 1; i > 0; i--) {
                    if (col[i] === col[i-1]) {
                        col[i] *= 2;
                        score += col[i];
                        col.splice(i-1, 1);
                        moved = true;
                    }
                }
                for (let i = 0; i < col.length; i++) {
                    newGrid[3 - (col.length - 1 - i)][j] = col[i];
                }
                let oldCol = [];
                let newCol = [];
                for (let i = 0; i < 4; i++) {
                    oldCol.push(grid[i][j]);
                    newCol.push(newGrid[i][j]);
                }
                if (JSON.stringify(oldCol) !== JSON.stringify(newCol)) moved = true;
            }
            break;
    }

    if (moved) {
        grid = JSON.parse(JSON.stringify(newGrid));
        if (dom.scoreEl) dom.scoreEl.textContent = score;
        // 检查是否突破最高成绩
        checkAndUpdateHighScore();
        updateTiles();
        spawnRandomTile();
        checkGameOver();
    }
}

// 检查游戏结束（新增：停止计时）
function checkGameOver() {
    if (!dom.gridEl || !dom.gameOverEl || !dom.finalScoreEl) return;
    // 检查空单元格
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (grid[i][j] === 0) return;
        }
    }
    // 检查横向合并
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[i][j] === grid[i][j+1]) return;
        }
    }
    // 检查纵向合并
    for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 3; i++) {
            if (grid[i][j] === grid[i+1][j]) return;
        }
    }
    // 游戏结束：停止计时
    stopGameTimer();
    isGameOver = true;
    dom.finalScoreEl.textContent = score;
    dom.gameOverEl.style.display = 'flex';
}

// 初始化最高成绩和最佳用时显示
function initHighScoreAndBestTime() {
    const currentUsername = localStorage.getItem('2048CurrentUser');
    if (!currentUsername || !dom.highScoreEl || !dom.bestTimeEl) return;

    // 兼容本地存储读取异常
    let userList = [];
    try {
        userList = JSON.parse(localStorage.getItem('2048UserList')) || [];
    } catch (e) {
        userList = [];
        console.error('读取用户列表异常：', e);
        return;
    }

    const currentUser = userList.find(u => u.username === currentUsername);
    if (!currentUser) return;

    // 更新最高成绩显示
    dom.highScoreEl.textContent = currentUser.highScore || 0;
    // 更新最佳用时显示（格式化时间）
    dom.bestTimeEl.textContent = formatTime(currentUser.bestTime || 0);
}

// 检查并更新最高成绩（含用时记录）
function checkAndUpdateHighScore() {
    const currentUsername = localStorage.getItem('2048CurrentUser');
    if (!currentUsername) return;

    // 兼容本地存储读取异常
    let userList = [];
    try {
        userList = JSON.parse(localStorage.getItem('2048UserList')) || [];
    } catch (e) {
        userList = [];
        console.error('读取用户列表异常：', e);
        return;
    }

    const userIndex = userList.findIndex(u => u.username === currentUsername);
    if (userIndex === -1) return;

    // 获取当前用户的最高成绩
    const currentHighScore = userList[userIndex].highScore || 0;

    // 如果当前得分超过最高成绩，更新最高成绩和最佳用时
    if (score > currentHighScore) {
        userList[userIndex].highScore = score;
        userList[userIndex].bestTime = currentTime; // 记录当前用时（达到新最高的用时）
        // 容错保存更新后的用户数据
        try {
            localStorage.setItem('2048UserList', JSON.stringify(userList));
            // 更新页面显示
            dom.highScoreEl.textContent = score;
            dom.bestTimeEl.textContent = formatTime(currentTime);
        } catch (e) {
            console.error('更新最高成绩异常：', e);
        }
    }
}

// 格式化时间（秒 -> 时:分:秒 00:00:00）
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    // 补零操作，确保格式统一
    const hStr = h.toString().padStart(2, '0');
    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');
    return `${hStr}:${mStr}:${sStr}`;
}

// 开始游戏计时
function startGameTimer() {
    // 重置计时变量
    gameStartTime = Date.now();
    currentTime = 0;
    // 清除原有定时器，避免重复计时
    if (gameTimer) clearInterval(gameTimer);
    // 每秒更新一次用时
    gameTimer = setInterval(() => {
        currentTime = Math.floor((Date.now() - gameStartTime) / 1000);
    }, 1000);
}

// 停止游戏计时
function stopGameTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

// 初始化游戏（新增：开始计时）
function initGame() {
    score = 0;
    isGameOver = false;
    if (dom.scoreEl) dom.scoreEl.textContent = score;
    if (dom.gameOverEl) dom.gameOverEl.style.display = 'none';
    initGrid();
    tiles = [];
    spawnRandomTile();
    spawnRandomTile();
    updateTiles();
    // 游戏初始化时开始计时
    startGameTimer();
    console.log('游戏初始化成功');
}

// 键盘控制（电脑端方向键操作，阻止默认滚动，兼容输入框）
function handleKeyDown(e) {
    if (isGameOver) return;
    e.preventDefault(); // 阻止默认滚动
    switch (e.key) {
        case 'ArrowLeft': moveTiles('left'); break;
        case 'ArrowRight': moveTiles('right'); break;
        case 'ArrowUp': moveTiles('up'); break;
        case 'ArrowDown': moveTiles('down'); break;
    }
}

// 触摸开始（手机端滑动）
let touchX = 0, touchY = 0;
function handleTouchStart(e) {
    if (isGameOver) return;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
}

// 触摸结束（手机端滑动判断）
function handleTouchEnd(e) {
    if (isGameOver) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - touchX;
    const diffY = endY - touchY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        // 左右滑动
        if (diffX > 20) moveTiles('right');
        else if (diffX < -20) moveTiles('left');
    } else {
        // 上下滑动
        if (diffY > 20) moveTiles('down');
        else if (diffY < -20) moveTiles('up');
    }
}