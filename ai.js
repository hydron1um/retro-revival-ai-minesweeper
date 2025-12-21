// Mario Minesweeper AI - Simple and Reliable
// Provides safe tile suggestions without modifying game state

/**
 * Get AI suggestion for safest tile
 * @param {Array} board - Current board state
 * @param {number} gridSize - Current grid size
 * @returns {Object|null} - Suggestion with row, col
 */
function getAISuggestion(board, gridSize) {
    console.log('🤖 AI analyzing board...');
    
    // Safety check
    if (!board || !window.gameState || !window.gameState.isActive()) {
        return null;
    }
    
    const config = window.gameState.configs[gridSize];
    const size = config.size;
    
    // Find guaranteed safe tiles using number constraints
    const safeTiles = findGuaranteedSafeTiles(board, size);
    
    if (safeTiles.length > 0) {
        // Return first guaranteed safe tile
        return safeTiles[0];
    }
    
    // If no guaranteed safe tiles, return random unrevealed tile
    const unrevealedTiles = findUnrevealedTiles(board, size);
    
    if (unrevealedTiles.length > 0) {
        const randomIndex = Math.floor(Math.random() * unrevealedTiles.length);
        return unrevealedTiles[randomIndex];
    }
    
    return null;
}

/**
 * Find guaranteed safe tiles using simple rule:
 * If a numbered tile has enough flags around it,
 * remaining neighbors are safe
 */
function findGuaranteedSafeTiles(board, size) {
    const safeTiles = [];
    
    // Check each revealed numbered tile
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const cell = board[row][col];
            
            // Only check revealed tiles with numbers
            if (cell.isRevealed && cell.neighborMines > 0) {
                const neighbors = getNeighbors(row, col, size);
                
                // Count flagged neighbors
                let flaggedCount = 0;
                const unrevealedNeighbors = [];
                
                neighbors.forEach(pos => {
                    const neighbor = board[pos.row][pos.col];
                    if (neighbor.isFlagged) {
                        flaggedCount++;
                    } else if (!neighbor.isRevealed) {
                        unrevealedNeighbors.push(pos);
                    }
                });
                
                // If flagged count equals required mines,
                // remaining unrevealed neighbors are safe
                if (flaggedCount === cell.neighborMines) {
                    unrevealedNeighbors.forEach(pos => {
                        // Avoid duplicates
                        if (!safeTiles.some(safe => safe.row === pos.row && safe.col === pos.col)) {
                            safeTiles.push(pos);
                        }
                    });
                }
            }
        }
    }
    
    return safeTiles;
}

/**
 * Find all unrevealed, unflagged tiles
 */
function findUnrevealedTiles(board, size) {
    const unrevealed = [];
    
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const cell = board[row][col];
            if (!cell.isRevealed && !cell.isFlagged) {
                unrevealed.push({ row, col });
            }
        }
    }
    
    return unrevealed;
}

/**
 * Get all neighbors of a position
 */
function getNeighbors(row, col, size) {
    const neighbors = [];
    
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            // Skip self
            if (dr === 0 && dc === 0) continue;
            
            // Check bounds
            if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
    }
    
    return neighbors;
}

console.log('🤖 AI system loaded');