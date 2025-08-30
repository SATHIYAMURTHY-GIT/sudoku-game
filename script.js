class SudokuGame {
    constructor() {
        this.currentLevel = 1;
        this.currentPuzzle = [];
        this.playerGrid = [];
        this.solution = [];
        this.selectedCell = null;
        this.selectedNumber = null;
        this.mistakes = 0;
        this.hintsLeft = 3;
        this.score = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.gameStartTime = null;
        
        this.initializeGame();
        this.bindEvents();
    }

    initializeGame() {
        this.loadLevel(this.currentLevel);
        this.renderGrid();
        this.updateUI();
        this.startTimer();
    }

    loadLevel(level) {
        const puzzle = SUDOKU_PUZZLES[level];
        this.currentPuzzle = puzzle.puzzle.map(row => [...row]);
        this.playerGrid = puzzle.puzzle.map(row => [...row]);
        this.solution = puzzle.solution.map(row => [...row]);
        this.mistakes = 0;
        this.hintsLeft = 3;
        this.resetTimer();
    }

    renderGrid() {
        const gridElement = document.getElementById('sudokuGrid');
        gridElement.innerHTML = '';

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('button');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const value = this.playerGrid[row][col];
                if (value !== 0) {
                    cell.textContent = value;
                    if (this.currentPuzzle[row][col] !== 0) {
                        cell.classList.add('prefilled');
                    }
                }

                // Add 3x3 box styling
                if ((row + 1) % 3 === 0 && row < 8) {
                    cell.style.borderBottom = '2px solid #2d3748';
                }
                if ((col + 1) % 3 === 0 && col < 8) {
                    cell.style.borderRight = '2px solid #2d3748';
                }

                cell.addEventListener('click', () => this.selectCell(row, col));
                gridElement.appendChild(cell);
            }
        }
    }

    selectCell(row, col) {
        // Don't allow selection of prefilled cells
        if (this.currentPuzzle[row][col] !== 0) return;

        this.selectedCell = { row, col };
        this.updateCellHighlights();
        this.updateNumberHighlights();
    }

    updateCellHighlights() {
        const cells = document.querySelectorAll('.sudoku-cell');
        cells.forEach(cell => {
            cell.classList.remove('selected', 'highlighted', 'same-number');
        });

        if (!this.selectedCell) return;

        const { row, col } = this.selectedCell;
        const selectedValue = this.playerGrid[row][col];

        cells.forEach((cell, index) => {
            const cellRow = Math.floor(index / 9);
            const cellCol = index % 9;

            // Highlight selected cell
            if (cellRow === row && cellCol === col) {
                cell.classList.add('selected');
            }

            // Highlight same row, column, and 3x3 box
            const sameRow = cellRow === row;
            const sameCol = cellCol === col;
            const sameBox = Math.floor(cellRow / 3) === Math.floor(row / 3) && 
                           Math.floor(cellCol / 3) === Math.floor(col / 3);

            if (sameRow || sameCol || sameBox) {
                cell.classList.add('highlighted');
            }

            // Highlight same numbers
            if (selectedValue !== 0 && this.playerGrid[cellRow][cellCol] === selectedValue) {
                cell.classList.add('same-number');
            }
        });
    }

    updateNumberHighlights() {
        const numberButtons = document.querySelectorAll('.number-btn');
        numberButtons.forEach(btn => btn.classList.remove('selected'));

        if (this.selectedNumber) {
            const selectedBtn = document.querySelector(`[data-number="${this.selectedNumber}"]`);
            if (selectedBtn) selectedBtn.classList.add('selected');
        }
    }

    placeNumber(number) {
        if (!this.selectedCell) return;

        const { row, col } = this.selectedCell;
        
        // Don't allow modification of prefilled cells
        if (this.currentPuzzle[row][col] !== 0) return;

        const previousValue = this.playerGrid[row][col];
        this.playerGrid[row][col] = number;

        // Check if move is valid
        if (number !== 0 && !this.isValidMove(row, col, number)) {
            this.mistakes++;
            this.updateUI();
            this.showError(row, col);
            
            // Revert if it's wrong
            this.playerGrid[row][col] = previousValue;
            return;
        }

        this.renderGrid();
        this.selectCell(row, col); // Maintain selection
        this.updateUI();

        // Check if puzzle is completed
        if (this.isPuzzleComplete()) {
            this.completeLevel();
        }
    }

    isValidMove(row, col, number) {
        // Check row
        for (let c = 0; c < 9; c++) {
            if (c !== col && this.playerGrid[row][c] === number) {
                return false;
            }
        }

        // Check column
        for (let r = 0; r < 9; r++) {
            if (r !== row && this.playerGrid[r][col] === number) {
                return false;
            }
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;

        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if ((r !== row || c !== col) && this.playerGrid[r][c] === number) {
                    return false;
                }
            }
        }

        return true;
    }

    showError(row, col) {
        const cellIndex = row * 9 + col;
        const cell = document.querySelectorAll('.sudoku-cell')[cellIndex];
        cell.classList.add('error');
        setTimeout(() => cell.classList.remove('error'), 500);
    }

    isPuzzleComplete() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.playerGrid[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    useHint() {
        if (this.hintsLeft <= 0 || !this.selectedCell) return;

        const { row, col } = this.selectedCell;
        
        // Don't use hint on prefilled cells
        if (this.currentPuzzle[row][col] !== 0) return;

        const correctNumber = this.solution[row][col];
        this.playerGrid[row][col] = correctNumber;
        this.hintsLeft--;

        // Show hint animation
        const cellIndex = row * 9 + col;
        const cell = document.querySelectorAll('.sudoku-cell')[cellIndex];
        cell.classList.add('hint');
        setTimeout(() => cell.classList.remove('hint'), 1000);

        this.renderGrid();
        this.updateUI();

        if (this.isPuzzleComplete()) {
            this.completeLevel();
        }
    }

    validatePuzzle() {
        let isValid = true;
        const cells = document.querySelectorAll('.sudoku-cell');

        cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const value = this.playerGrid[row][col];

            cell.classList.remove('error');

            if (value !== 0 && !this.isValidMove(row, col, value)) {
                cell.classList.add('error');
                isValid = false;
            }
        });

        // Show validation result
        const message = isValid ? 'Puzzle looks good so far! ✓' : 'There are some conflicts to fix ✗';
        this.showMessage(message, isValid ? 'success' : 'error');
    }

    showMessage(message, type) {
        // Create a simple toast message
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1001;
            background: ${type === 'success' ? '#48bb78' : '#f56565'};
        `;
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
    }

    completeLevel() {
        this.stopTimer();
        const timeBonus = Math.max(0, 300 - this.timer); // Bonus for completing quickly
        const mistakesPenalty = this.mistakes * 10;
        const levelScore = Math.max(0, 100 + timeBonus - mistakesPenalty);
        this.score += levelScore;

        document.getElementById('completionTime').textContent = this.formatTime(this.timer);
        document.getElementById('completionScore').textContent = levelScore;
        document.getElementById('completionMistakes').textContent = this.mistakes;

        if (this.currentLevel >= 15) {
            this.showGameCompleteModal();
        } else {
            this.showLevelCompleteModal();
        }
    }

    showLevelCompleteModal() {
        document.getElementById('completionModal').classList.remove('hidden');
    }

    showGameCompleteModal() {
        document.getElementById('totalScore').textContent = this.score;
        document.getElementById('gameCompleteModal').classList.remove('hidden');
    }

    nextLevel() {
        if (this.currentLevel < 15) {
            this.currentLevel++;
            this.loadLevel(this.currentLevel);
            this.renderGrid();
            this.updateUI();
            this.startTimer();
        }
    }

    newGame() {
        this.loadLevel(this.currentLevel);
        this.renderGrid();
        this.updateUI();
        this.startTimer();
    }

    startTimer() {
        this.stopTimer();
        this.gameStartTime = Date.now();
        this.timerInterval = setInterval(() => {
            this.timer = Math.floor((Date.now() - this.gameStartTime) / 1000);
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resetTimer() {
        this.timer = 0;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        document.getElementById('timeDisplay').textContent = this.formatTime(this.timer);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    getDifficultyName(level) {
        if (level <= 5) return 'easy';
        if (level <= 10) return 'medium';
        return 'hard';
    }

    updateUI() {
        document.getElementById('currentLevel').textContent = this.currentLevel;
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('mistakesDisplay').textContent = this.mistakes;
        document.getElementById('hintsLeft').textContent = `(${this.hintsLeft})`;
        document.getElementById('levelNumber').textContent = this.currentLevel;

        const difficulty = this.getDifficultyName(this.currentLevel);
        const difficultyElement = document.getElementById('difficulty');
        difficultyElement.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        difficultyElement.className = `difficulty ${difficulty}`;

        // Update buttons
        document.getElementById('prevLevelBtn').disabled = this.currentLevel <= 1;
        document.getElementById('nextLevelBtn').disabled = this.currentLevel >= 15;
        document.getElementById('hintBtn').disabled = this.hintsLeft <= 0;
    }

    bindEvents() {
        // Number pad buttons
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const number = parseInt(btn.dataset.number);
                this.selectedNumber = number;
                this.placeNumber(number);
                this.updateNumberHighlights();
            });
        });

        // Erase button
        document.querySelector('.erase-btn').addEventListener('click', () => {
            this.selectedNumber = 0;
            this.placeNumber(0);
            this.updateNumberHighlights();
        });

        // Action buttons
        document.getElementById('hintBtn').addEventListener('click', () => this.useHint());
        document.getElementById('validateBtn').addEventListener('click', () => this.validatePuzzle());
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());

        // Level navigation
        document.getElementById('prevLevelBtn').addEventListener('click', () => {
            if (this.currentLevel > 1) {
                this.currentLevel--;
                this.loadLevel(this.currentLevel);
                this.renderGrid();
                this.updateUI();
                this.startTimer();
            }
        });

        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            if (this.currentLevel < 15) {
                this.currentLevel++;
                this.loadLevel(this.currentLevel);
                this.renderGrid();
                this.updateUI();
                this.startTimer();
            }
        });

        // Modal buttons
        document.getElementById('nextLevelModalBtn').addEventListener('click', () => {
            document.getElementById('completionModal').classList.add('hidden');
            this.nextLevel();
        });

        document.getElementById('replayLevelBtn').addEventListener('click', () => {
            document.getElementById('completionModal').classList.add('hidden');
            this.newGame();
        });

        document.getElementById('restartGameBtn').addEventListener('click', () => {
            document.getElementById('gameCompleteModal').classList.add('hidden');
            this.currentLevel = 1;
            this.score = 0;
            this.loadLevel(1);
            this.renderGrid();
            this.updateUI();
            this.startTimer();
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '9') {
                const number = parseInt(e.key);
                this.selectedNumber = number;
                this.placeNumber(number);
                this.updateNumberHighlights();
            } else if (e.key === '0' || e.key === 'Delete' || e.key === 'Backspace') {
                this.selectedNumber = 0;
                this.placeNumber(0);
                this.updateNumberHighlights();
            }
        });

        // Close modals by clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});
