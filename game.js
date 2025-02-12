class SnakeGame {
    constructor() {
        this.gridSize = 20;
        this.gameGrid = document.getElementById('game-grid');
        this.scoreDisplay = document.getElementById('score');
        this.finalScoreDisplay = document.getElementById('final-score');
        this.modal = document.getElementById('game-over-modal');
        this.restartButton = document.getElementById('restart-button');
        
        // Sound effects
        this.eatingSound = document.getElementById('eating-sound');
        this.deathSound = document.getElementById('death-sound');
        
        // Animation state
        this.isEating = false;
        
        this.initializeGrid();
        this.setupEventListeners();
        this.startGame();
    }

    initializeGrid() {
        this.gameGrid.innerHTML = '';
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            this.gameGrid.appendChild(cell);
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        this.restartButton.addEventListener('click', () => {
            this.modal.classList.remove('show');
            this.startGame();
        });
    }

    startGame() {
        // Initialize game state
        this.snake = [
            { x: 10, y: 10 },
            { x: 10, y: 11 },
            { x: 10, y: 12 }
        ];
        this.direction = { x: 0, y: -1 }; // Moving up initially
        this.nextDirection = { x: 0, y: -1 };
        this.food = this.generateFood();
        this.score = 0;
        this.gameOver = false;
        this.updateScore();
        this.modal.classList.remove('show');

        // Clear the grid
        this.initializeGrid();

        // Start game loop
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.gameLoop(), 150);
    }

    generateFood() {
        const foodTypes = [
            { type: 'basic', points: 1, chance: 0.35, name: 'apple' },
            { type: 'banana', points: 2, chance: 0.30, name: 'banana' },
            { type: 'orange', points: 3, chance: 0.20, name: 'orange' },
            { type: 'grapes', points: 4, chance: 0.10, name: 'grapes' },
            { type: 'watermelon', points: 5, chance: 0.05, name: 'watermelon' }
        ];

        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize),
                ...this.selectFoodType(foodTypes)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        return food;
    }

    selectFoodType(foodTypes) {
        const rand = Math.random();
        let cumulativeChance = 0;
        
        for (const food of foodTypes) {
            cumulativeChance += food.chance;
            if (rand <= cumulativeChance) {
                return {
                    type: food.type,
                    points: food.points
                };
            }
        }
        
        // Fallback to basic food
        return {
            type: 'basic',
            points: 1
        };
    }

    handleKeyPress(event) {
        const keyDirections = {
            'ArrowUp': { x: 0, y: -1 },
            'ArrowDown': { x: 0, y: 1 },
            'ArrowLeft': { x: -1, y: 0 },
            'ArrowRight': { x: 1, y: 0 }
        };

        const newDirection = keyDirections[event.key];
        if (newDirection) {
            // Prevent 180-degree turns
            if (this.direction.x !== -newDirection.x && this.direction.y !== -newDirection.y) {
                this.nextDirection = newDirection;
            }
            event.preventDefault();
        }
    }

    gameLoop() {
        if (this.gameOver) return;

        // Update direction
        this.direction = this.nextDirection;

        // Calculate new head position
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // Check for collisions
        if (this.checkCollision(head)) {
            this.endGame();
            return;
        }

        // Add new head
        this.snake.unshift(head);

        // Check if food is eaten
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += this.food.points;
            this.updateScore();
            this.food = this.generateFood();
            this.playEatingAnimation(this.food.points);
            this.playSound(this.eatingSound);
            
            // Grow the snake based on food points
            for (let i = 1; i < this.food.points; i++) {
                const lastSegment = this.snake[this.snake.length - 1];
                this.snake.push({ ...lastSegment });
            }
        } else {
            this.snake.pop();
        }

        this.updateGrid();
    }

    checkCollision(position) {
        // Wall collision
        if (position.x < 0 || position.x >= this.gridSize ||
            position.y < 0 || position.y >= this.gridSize) {
            return true;
        }

        // Self collision (check all segments except the tail which will move)
        return this.snake.slice(0, -1).some(segment =>
            segment.x === position.x && segment.y === position.y
        );
    }

    updateGrid() {
        // Clear all cells
        const cells = this.gameGrid.children;
        for (let cell of cells) {
            cell.className = 'cell';
        }

        // Draw snake
        this.snake.forEach((segment, index) => {
            const cellIndex = segment.y * this.gridSize + segment.x;
            if (cells[cellIndex]) {
                cells[cellIndex].classList.add('snake-cell');
                if (index === 0) { // This is the head
                    cells[cellIndex].classList.add('snake-head');
                }
            }
        });

        // Draw food
        const foodIndex = this.food.y * this.gridSize + this.food.x;
        if (cells[foodIndex]) {
            cells[foodIndex].classList.add('food-cell', `food-${this.food.type}`);
        }
    }

    updateScore() {
        this.scoreDisplay.textContent = this.score;
        this.finalScoreDisplay.textContent = this.score;
    }

    endGame() {
        this.gameOver = true;
        clearInterval(this.gameInterval);
        this.modal.classList.add('show');
        this.finalScoreDisplay.textContent = this.score;
        this.playSound(this.deathSound);
    }

    playSound(audioElement) {
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play().catch(error => console.log('Audio playback failed:', error));
        }
    }

    playEatingAnimation(points) {
        if (!this.isEating) {
            this.isEating = true;
            const headCell = this.gameGrid.children[this.snake[0].y * this.gridSize + this.snake[0].x];
            headCell.classList.add('eating');
            
            setTimeout(() => {
                headCell.classList.remove('eating');
                this.isEating = false;
            }, 200);
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new SnakeGame();
});
