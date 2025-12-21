// Mario Minesweeper - Clean Game Logic
// Built from scratch with bulletproof rules

document.addEventListener('DOMContentLoaded', function() {
    console.log('🍄 Mario Minesweeper starting...');
    
    // DOM Elements
    const gameBoard = document.getElementById('gameBoard');
    const minesDisplay = document.getElementById('minesDisplay');
    const timerDisplay = document.getElementById('timerDisplay');
    const statusDisplay = document.getElementById('statusDisplay');
    const restartBtn = document.getElementById('restartBtn');
    const aiHintBtn = document.getElementById('aiHintBtn');
    const aiTooltip = document.getElementById('aiTooltip');
    
    // Grid buttons
    const btn4x4 = document.getElementById('btn4x4');
    const btn6x6 = document.getElementById('btn6x6');
    const btn9x9 = document.getElementById('btn9x9');
    
    // Overlays
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const winOverlay = document.getElementById('winOverlay');
    const gameOverRestart = document.getElementById('gameOverRestart');
    const winRestart = document.getElementById('winRestart');
    
    // Game Configuration
    const GRID_CONFIGS = {
        4: { size: 4, mines: 4 },
        6: { size: 6, mines: 6 },
        9: { size: 9, mines: 10 }
    };
    
    // Game State
    let currentGridSize = 4;
    let gameStarted = false;
    let gameOver = false;
    let gameWon = false;
    let gameTime = 0;
    let gameTimer = null;
    let flaggedCount = 0;
    let revealedCount = 0;
    let currentAIHint = null;
    
    // Game Board Data
    let board = [];
    
    /**
     * Initialize empty board
     */
    function initializeBoard() {
        const config = GRID_CONFIGS[currentGridSize];
        board = [];
        
        for (let row = 0; row < config.size; row++) {
            board[row] = [];
            for (let col = 0; col < config.size; col++) {
                board[row][col] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
        
        console.log(`Board initialized: ${config.size}x${config.size}`);
    }
    
    /**
     * Place mines after first click (safe first click)
     */
    function placeMines(safeRow, safeCol) {
        const config = GRID_CONFIGS[currentGridSize];
        let minesPlaced = 0;
        
        while (minesPlaced < config.mines) {
            const row = Math.floor(Math.random() * config.size);
            const col = Math.floor(Math.random() * config.size);
            
            // Skip safe click position and existing mines
            if ((row === safeRow && col === safeCol) || board[row][col].isMine) {
                continue;
            }
            
            board[row][col].isMine = true;
            minesPlaced++;
        }
        
        calculateNeighborCounts();
        console.log(`${config.mines} mines placed`);
    }
    
    /**
     * Calculate neighbor mine counts
     */
    function calculateNeighborCounts() {
        const config = GRID_CONFIGS[currentGridSize];
        
        for (let row = 0; row < config.size; row++) {
            for (let col = 0; col < config.size; col++) {
                if (!board[row][col].isMine) {
                    let count = 0;
                    
                    // Check all 8 neighbors
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const newRow = row + dr;
                            const newCol = col + dc;
                            
                            if (dr === 0 && dc === 0) continue;
                            if (newRow < 0 || newRow >= config.size) continue;
                            if (newCol < 0 || newCol >= config.size) continue;
                            
                            if (board[newRow][newCol].isMine) {
                                count++;
                            }
                        }
                    }
                    
                    board[row][col].neighborMines = count;
                }
            }
        }
    }
    
    /**
     * CRITICAL: The ONLY function that reveals tiles
     * Implements all game rules to prevent bugs
     */
    function revealTile(row, col) {
        const cell = board[row][col];
        
        // RULE: Skip if already revealed, flagged, or game over
        if (cell.isRevealed || cell.isFlagged || gameOver || gameWon) {
            return;
        }
        
        // First click setup
        if (!gameStarted) {
            placeMines(row, col);
            startTimer();
            gameStarted = true;
            updateStatus('Playing');
            aiHintBtn.disabled = false;
        }
        
        // Clear AI hint
        clearAIHint();
        
        // RULE: Reveal ONLY this tile
        cell.isRevealed = true;
        revealedCount++;
        
        // RULE: Check if mine
        if (cell.isMine) {
            endGame(false);
            return;
        }
        
        // Update tile display
        updateTileDisplay(row, col);
        
        // RULE: Recursive reveal ONLY if neighborMines === 0
        if (cell.neighborMines === 0) {
            revealNeighbors(row, col);
        }
        
        // Update display and check win
        updateScoreDisplay();
        checkWinCondition();
    }
    
    /**
     * Recursive reveal for empty tiles only
     */
    function revealNeighbors(row, col) {
        const config = GRID_CONFIGS[currentGridSize];
        
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const newRow = row + dr;
                const newCol = col + dc;
                
                if (dr === 0 && dc === 0) continue;
                if (newRow < 0 || newRow >= config.size) continue;
                if (newCol < 0 || newCol >= config.size) continue;
                
                const neighbor = board[newRow][newCol];
                
                // Only reveal if not already revealed and not flagged
                if (!neighbor.isRevealed && !neighbor.isFlagged) {
                    neighbor.isRevealed = true;
                    revealedCount++;
                    updateTileDisplay(newRow, newCol);
                    
                    // Continue recursion ONLY if neighbor is also empty
                    if (neighbor.neighborMines === 0) {
                        revealNeighbors(newRow, newCol);
                    }
                }
            }
        }
    }
    
    /**
     * Toggle flag on tile
     */
    function toggleFlag(row, col) {
        const cell = board[row][col];
        
        // Skip if revealed or game over
        if (cell.isRevealed || gameOver || gameWon) {
            return;
        }
        
        cell.isFlagged = !cell.isFlagged;
        flaggedCount += cell.isFlagged ? 1 : -1;
        
        updateTileDisplay(row, col);
        updateScoreDisplay();
    }
    
    /**
     * Update single tile display
     */
    function updateTileDisplay(row, col) {
        const tile = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const cell = board[row][col];
        
        if (!tile) return;
        
        // Reset classes
        tile.className = 'tile';
        
        if (cell.isFlagged) {
            tile.classList.add('flagged');
            tile.textContent = '🚩';
        } else if (cell.isRevealed) {
            tile.classList.add('revealed');
            
            if (cell.isMine) {
                tile.classList.add('mine');
                tile.textContent = '💣';
            } else if (cell.neighborMines > 0) {
                tile.classList.add(`num-${cell.neighborMines}`);
                tile.textContent = cell.neighborMines;
            } else {
                tile.textContent = '';
            }
        } else {
            tile.classList.add('hidden');
            tile.textContent = '';
        }
    }
    
    /**
     * End game (win or lose)
     */
    function endGame(won) {
        gameOver = !won;
        gameWon = won;
        stopTimer();
        aiHintBtn.disabled = true;
        clearAIHint();
        
        if (won) {
            updateStatus('You Win!');
            showOverlay('win');
        } else {
            updateStatus('Game Over');
            revealAllMines();
            showOverlay('gameOver');
        }
    }
    
    /**
     * Reveal all mines (game over only)
     */
    function revealAllMines() {
        const config = GRID_CONFIGS[currentGridSize];
        
        for (let row = 0; row < config.size; row++) {
            for (let col = 0; col < config.size; col++) {
                if (board[row][col].isMine) {
                    board[row][col].isRevealed = true;
                    updateTileDisplay(row, col);
                }
            }
        }
    }
    
    /**
     * Check win condition
     */
    function checkWinCondition() {
        const config = GRID_CONFIGS[currentGridSize];
        const totalCells = config.size * config.size;
        
        if (revealedCount === totalCells - config.mines) {
            endGame(true);
        }
    }
    
    /**
     * Create board DOM
     */
    function createBoardDOM() {
        const config = GRID_CONFIGS[currentGridSize];
        gameBoard.innerHTML = '';
        gameBoard.className = `game-board size-${config.size}`;
        
        for (let row = 0; row < config.size; row++) {
            for (let col = 0; col < config.size; col++) {
                const tile = document.createElement('div');
                tile.className = 'tile hidden';
                tile.dataset.row = row;
                tile.dataset.col = col;
                
                // Left click - reveal
                tile.addEventListener('click', (e) => {
                    e.preventDefault();
                    revealTile(row, col);
                });
                
                // Right click - flag
                tile.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    toggleFlag(row, col);
                });
                
                gameBoard.appendChild(tile);
            }
        }
        
        console.log(`DOM created: ${config.size}x${config.size}`);
    }
    
    /**
     * Update score display
     */
    function updateScoreDisplay() {
        const config = GRID_CONFIGS[currentGridSize];
        const minesRemaining = Math.max(0, config.mines - flaggedCount);
        
        timerDisplay.textContent = gameTime.toString().padStart(3, '0');
        minesDisplay.textContent = minesRemaining.toString().padStart(3, '0');
    }
    
    /**
     * Update status display
     */
    function updateStatus(status) {
        statusDisplay.textContent = status;
    }
    
    /**
     * Start timer
     */
    function startTimer() {
        gameTimer = setInterval(() => {
            gameTime++;
            updateScoreDisplay();
        }, 1000);
    }
    
    /**
     * Stop timer
     */
    function stopTimer() {
        if (gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
        }
    }
    
    /**
     * Show overlay
     */
    function showOverlay(type) {
        if (type === 'win') {
            winOverlay.classList.add('show');
        } else if (type === 'gameOver') {
            gameOverOverlay.classList.add('show');
        }
    }
    
    /**
     * Hide overlays
     */
    function hideOverlays() {
        winOverlay.classList.remove('show');
        gameOverOverlay.classList.remove('show');
    }
    
    /**
     * Clear AI hint
     */
    function clearAIHint() {
        if (currentAIHint) {
            const tile = document.querySelector(`[data-row="${currentAIHint.row}"][data-col="${currentAIHint.col}"]`);
            if (tile) {
                tile.classList.remove('ai-hint');
            }
            currentAIHint = null;
        }
        aiTooltip.classList.remove('show');
    }
    
    /**
     * Handle AI hint request
     */
    function handleAIHint() {
        if (!gameStarted || gameOver || gameWon) {
            return;
        }
        
        clearAIHint();
        
        // Get AI suggestion
        const suggestion = getAISuggestion(board, currentGridSize);
        
        if (suggestion) {
            const tile = document.querySelector(`[data-row="${suggestion.row}"][data-col="${suggestion.col}"]`);
            if (tile) {
                tile.classList.add('ai-hint');
                currentAIHint = { row: suggestion.row, col: suggestion.col };
                
                // Show tooltip
                const rect = tile.getBoundingClientRect();
                aiTooltip.style.left = rect.left + rect.width / 2 - aiTooltip.offsetWidth / 2 + 'px';
                aiTooltip.style.top = rect.top - aiTooltip.offsetHeight - 10 + 'px';
                aiTooltip.classList.add('show');
                
                // Hide tooltip after 3 seconds
                setTimeout(() => {
                    aiTooltip.classList.remove('show');
                }, 3000);
            }
        }
    }
    
    /**
     * COMPLETE RESET - clears everything
     */
    function resetGame() {
        console.log('Resetting game...');
        
        // Stop timer
        stopTimer();
        
        // Reset all state
        gameStarted = false;
        gameOver = false;
        gameWon = false;
        gameTime = 0;
        flaggedCount = 0;
        revealedCount = 0;
        
        // Clear AI
        clearAIHint();
        aiHintBtn.disabled = true;
        
        // Hide overlays
        hideOverlays();
        
        // Rebuild everything
        initializeBoard();
        createBoardDOM();
        updateScoreDisplay();
        updateStatus('Ready');
        
        console.log('Game reset complete');
    }
    
    /**
     * Switch grid size
     */
    function switchGridSize(newSize) {
        currentGridSize = newSize;
        
        // Update button states
        document.querySelectorAll('.grid-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-size="${newSize}"]`).classList.add('active');
        
        // Complete reset with new size
        resetGame();
        
        console.log(`Grid size changed to ${newSize}x${newSize}`);
    }
    
    // Event Listeners
    restartBtn.addEventListener('click', resetGame);
    gameOverRestart.addEventListener('click', resetGame);
    winRestart.addEventListener('click', resetGame);
    aiHintBtn.addEventListener('click', handleAIHint);
    
    btn4x4.addEventListener('click', () => switchGridSize(4));
    btn6x6.addEventListener('click', () => switchGridSize(6));
    btn9x9.addEventListener('click', () => switchGridSize(9));
    
    // Initialize game
    console.log('Initializing game...');
    initializeBoard();
    createBoardDOM();
    updateScoreDisplay();
    updateStatus('Ready');
    aiHintBtn.disabled = true;
    
    console.log('🍄 Mario Minesweeper ready!');
    
    // Export for AI
    window.gameState = {
        board: () => board,
        gridSize: () => currentGridSize,
        configs: GRID_CONFIGS,
        isActive: () => gameStarted && !gameOver && !gameWon
    };
});