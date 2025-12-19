// 全局变量默认初始化
let grid = [];
let tiles = [];
let score = 0;
let isGameOver = false;
const boardSize = 4;
// 游戏计时相关变量（最高成绩用时记录）
let gameStartTime = 0;
let gameTimer = null;
let currentTime = 0;

// DOM元素缓存
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
    highScoreEl: null,
    bestTimeEl: null
};

// 页面加载完成初始化
window.onload = function() {
    initDOM();
    bindAllEvents();
    initBrowserCompatibility();
    checkLoginStatus();
    initHighScoreAndBestTime();
    console.log('页面加载完成，DOM初始化成功');
};

// 初始化DOM元素
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

    // 激活输入框
    if (dom.usernameInput) {
        dom.usernameInput.removeAttribute('disabled');
        dom.usernameInput.removeAttribute('readonly');
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

// 浏览器兼容性初始化
function initBrowserCompatibility() {
    if (!localStorage.getItem('2048UserList')) {
        localStorage.setItem('2048UserList', JSON.stringify([]));
        console.log('本地存储用户列表初始化成功');
    }
    setTimeout(() => {
        if (dom.usernameInput && dom.loginPanel.style.display !== 'none') {
            dom.usernameInput.focus();
            console.log('账号输入框自动获取焦点');
        }
    }, 500);
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

// 注册功能
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

    userList.push({
        username,
        password,
        highScore: 0,
        bestTime: 0
    });
    try {
        localStorage.setItem('2048UserList', JSON.stringify(userList));
        showTip('注册成功，请登录！', false);
        dom.usernameInput.value = '';
        dom.passwordInput.value = '';
        dom.usernameInput.focus();
    } catch (e) {
        showTip('注册失败，请退出隐私模式！');
        console.error('注册数据保存异常：', e);
    }
}

// 登录功能
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
        dom.passwordInput.value = '';
        dom.passwordInput.focus();
        return;
    }

    try {
        localStorage.setItem('2048CurrentUser', username);
        dom.loginPanel.style.display = 'none';
        dom.gamePanel.style.display = 'block';
        initHighScoreAndBestTime();
        initGame();
        dom.usernameInput.value = '';
        dom.passwordInput.value = '';
    } catch (e) {
        showTip('登录失败，请退出隐私模式！');
        console.error('登录状态保存异常：', e);
    }
}

// 退出登录
function handleLogout() {
    if (!dom.gamePanel || !dom.loginPanel) return;
    stopGameTimer();
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
    setTimeout(() => {
        if (dom.usernameInput) dom.usernameInput.focus();
    }, 300);
}

// 检查登录状态
function checkLoginStatus() {
    if (!dom.gamePanel || !dom.loginPanel) return;
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
        initHighScoreAndBestTime();
        initGame();
    } else {
        setTimeout(() => {
            if (dom.usernameInput) dom.usernameInput.focus();
        }, 500);
    }
}

// 绑定所有事件（核心：恢复按钮点击，仅棋盘内拦截触摸）
function bindAllEvents() {
    // 按钮双重绑定：onclick + touchstart，确保移动端响应
    if (dom.registerBtn) {
        dom.registerBtn.onclick = handleRegister;
        dom.registerBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            handleRegister();
        }, { passive: false });
    }
    if (dom.loginBtn) {
        dom.loginBtn.onclick = handleLogin;
        dom.loginBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            handleLogin();
        }, { passive: false });
    }
    if (dom.logoutBtn) {
        dom.logoutBtn.onclick = handleLogout;
        dom.logoutBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            handleLogout();
        }, { passive: false });
    }
    if (dom.restartBtn) {
        dom.restartBtn.onclick = initGame;
        dom.restartBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            initGame();
        }, { passive: false });
    }
    if (dom.restartGameBtn) {
        dom.restartGameBtn.onclick = initGame;
        dom.restartGameBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            initGame();
        }, { passive: false });
    }

    // 键盘事件
    document.onkeydown = function(e) {
        if (document.activeElement === dom.usernameInput || document.activeElement === dom.passwordInput) {
            return;
        }
        handleKeyDown(e);
    };

    // 仅棋盘内绑定触摸事件，不影响按钮
    const gameBoard = document.getElementById('gameBoard');
    if (gameBoard) {
        gameBoard.addEventListener('touchstart', handleTouchStart, { passive: false });
        gameBoard.addEventListener('touchend', handleTouchEnd, { passive: false });
        gameBoard.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, { passive: false });
    }
}

// 初始化棋盘
function initGrid() {
    if (!dom.gridEl) return;
    dom.gridEl.innerHTML = '';
    grid = [];
    for (let i = 0; i < 4; i++) {
        grid[i] = [0, 0, 0, 0];
        for (let j = 0; j < 4; j++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            dom.gridEl.appendChild(cell);
        }
    }
}

// 创建瓦片
function createTile(value, row, col) {
    if (!dom.gridEl) return null;
    const tile = document.createElement('div');
    tile.className = `tile tile-${value}`;
    tile.textContent = value;
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
    tiles.forEach(tile => {
        if (tile.element && tile.element.parentNode) {
            tile.element.parentNode.removeChild(tile.element);
        }
    });
    tiles = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (grid[i][j] !== 0) {
                const tile = createTile(grid[i][j], i, j);
                if (tile) tiles.push(tile);
            }
        }
    }
}

// 移动瓦片
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
        checkAndUpdateHighScore();
        updateTiles();
        spawnRandomTile();
        checkGameOver();
    }
}

// 检查游戏结束
function checkGameOver() {
    if (!dom.gridEl || !dom.gameOverEl || !dom.finalScoreEl) return;
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (grid[i][j] === 0) return;
        }
    }
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[i][j] === grid[i][j+1]) return;
        }
    }
    for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 3; i++) {
            if (grid[i][j] === grid[i+1][j]) return;
        }
    }
    stopGameTimer();
    isGameOver = true;
    dom.finalScoreEl.textContent = score;
    dom.gameOverEl.style.display = 'flex';
}

// 初始化最高成绩和用时
function initHighScoreAndBestTime() {
    const currentUsername = localStorage.getItem('2048CurrentUser');
    if (!currentUsername || !dom.highScoreEl || !dom.bestTimeEl) return;

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

    dom.highScoreEl.textContent = currentUser.highScore || 0;
    dom.bestTimeEl.textContent = formatTime(currentUser.bestTime || 0);
}

// 更新最高成绩和用时
function checkAndUpdateHighScore() {
    const currentUsername = localStorage.getItem('2048CurrentUser');
    if (!currentUsername) return;

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

    const currentHighScore = userList[userIndex].highScore || 0;
    if (score > currentHighScore) {
        userList[userIndex].highScore = score;
        userList[userIndex].bestTime = currentTime;
        try {
            localStorage.setItem('2048UserList', JSON.stringify(userList));
            dom.highScoreEl.textContent = score;
            dom.bestTimeEl.textContent = formatTime(currentTime);
        } catch (e) {
            console.error('更新最高成绩异常：', e);
        }
    }
}

// 格式化时间
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const hStr = h.toString().padStart(2, '0');
    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');
    return `${hStr}:${mStr}:${sStr}`;
}

// 开始计时
function startGameTimer() {
    gameStartTime = Date.now();
    currentTime = 0;
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        currentTime = Math.floor((Date.now() - gameStartTime) / 1000);
    }, 1000);
}

// 停止计时
function stopGameTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

// 初始化游戏
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
    startGameTimer();
    console.log('游戏初始化成功');
}

// 键盘控制
function handleKeyDown(e) {
    if (isGameOver) return;
    e.preventDefault();
    switch (e.key) {
        case 'ArrowLeft': moveTiles('left'); break;
        case 'ArrowRight': moveTiles('right'); break;
        case 'ArrowUp': moveTiles('up'); break;
        case 'ArrowDown': moveTiles('down'); break;
    }
}

// 触摸开始
let touchX = 0, touchY = 0;
function handleTouchStart(e) {
    if (isGameOver) return;
    e.preventDefault();
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
}

// 触摸结束
function handleTouchEnd(e) {
    if (isGameOver) return;
    e.preventDefault();
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - touchX;
    const diffY = endY - touchY;
    const slideThreshold = 30;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > slideThreshold) moveTiles('right');
        else if (diffX < -slideThreshold) moveTiles('left');
    } else {
        if (diffY > slideThreshold) moveTiles('down');
        else if (diffY < -slideThreshold) moveTiles('up');
    }
}