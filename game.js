class SnakeGame {
    constructor() {
        this.gridSize = 25;
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

        // Bonus fruit state
        this.bonusFood = null;
        this.bonusTimeout = null;
        this.bonusCountdown = null;
        this.bonusDuration = 7000; // 7 seconds
        this.bonusInterval = 15000; // Bonus fruit appears every 15 seconds
        
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
        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        
        // Mobile controls
        const controls = {
            'up-btn': { x: 0, y: -1 },
            'down-btn': { x: 0, y: 1 },
            'left-btn': { x: -1, y: 0 },
            'right-btn': { x: 1, y: 0 }
        };

        Object.entries(controls).forEach(([btnId, direction]) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                // Touch events for mobile
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (this.direction.x !== -direction.x && this.direction.y !== -direction.y) {
                        this.nextDirection = direction;
                    }
                });

                // Mouse events for testing on desktop
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    if (this.direction.x !== -direction.x && this.direction.y !== -direction.y) {
                        this.nextDirection = direction;
                    }
                });
            }
        });

        // Prevent scrolling when touching the buttons
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('touchmove', (e) => e.preventDefault());
        });

        this.restartButton.addEventListener('click', () => {
            this.modal.classList.remove('show');
            this.startGame();
        });
    }

    startGame() {
        // Initialize game state
        this.snake = [
            { x: 12, y: 12 },
            { x: 12, y: 13 },
            { x: 12, y: 14 }
        ];
        this.direction = { x: 0, y: -1 }; // Moving up initially
        this.nextDirection = { x: 0, y: -1 };
        this.food = this.generateFood();
        this.score = 0;
        this.gameOver = false;
        this.updateScore();
        this.modal.classList.remove('show');

        // Clear bonus state
        if (this.bonusTimeout) clearTimeout(this.bonusTimeout);
        if (this.bonusCountdown) clearInterval(this.bonusCountdown);
        this.bonusFood = null;

        // Clear the grid
        this.initializeGrid();

        // Start game loop
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.gameLoop(), 130);

        // Start bonus fruit spawning
        this.scheduleBonusFruit();
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

        // Check if regular food is eaten
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
        } 
        // Check if bonus food is eaten
        else if (this.bonusFood && head.x === this.bonusFood.x && head.y === this.bonusFood.y) {
            this.score += this.bonusFood.points;
            this.updateScore();
            this.playEatingAnimation(this.bonusFood.points);
            this.playSound(this.eatingSound);
            
            // Grow the snake based on bonus points
            for (let i = 1; i < this.bonusFood.points; i++) {
                const lastSegment = this.snake[this.snake.length - 1];
                this.snake.push({ ...lastSegment });
            }

            // Clear bonus food
            this.clearBonusFood();
            // Schedule next bonus food
            this.scheduleBonusFruit();
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

        // Draw regular food
        const foodIndex = this.food.y * this.gridSize + this.food.x;
        if (cells[foodIndex]) {
            cells[foodIndex].classList.add('food-cell', `food-${this.food.type}`);
        }

        // Draw bonus food if exists
        if (this.bonusFood) {
            const bonusFoodIndex = this.bonusFood.y * this.gridSize + this.bonusFood.x;
            if (cells[bonusFoodIndex]) {
                cells[bonusFoodIndex].classList.add('food-cell', 'food-bonus');
                
                // Update or create countdown display
                let countdown = cells[bonusFoodIndex].querySelector('.bonus-countdown');
                if (!countdown) {
                    countdown = document.createElement('div');
                    countdown.className = 'bonus-countdown';
                    cells[bonusFoodIndex].appendChild(countdown);
                }
                const timeLeft = Math.ceil((this.bonusFood.endTime - Date.now()) / 1000);
                countdown.textContent = `${timeLeft}s`;
            }
        }
    }

    updateScore() {
        this.scoreDisplay.textContent = this.score;
        this.finalScoreDisplay.textContent = this.score;
    }

    endGame() {
        this.gameOver = true;
        clearInterval(this.gameInterval);
        if (this.bonusTimeout) clearTimeout(this.bonusTimeout);
        if (this.bonusCountdown) clearInterval(this.bonusCountdown);
        this.modal.classList.add('show');
        this.finalScoreDisplay.textContent = this.score;
        this.playSound(this.deathSound);
    }

    generateBonusFood() {
        let bonusFood;
        do {
            bonusFood = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize),
                type: 'bonus',
                points: 15,
                endTime: Date.now() + this.bonusDuration
            };
        } while (
            this.snake.some(segment => segment.x === bonusFood.x && segment.y === bonusFood.y) ||
            (this.food.x === bonusFood.x && this.food.y === bonusFood.y)
        );
        return bonusFood;
    }

    clearBonusFood() {
        this.bonusFood = null;
        if (this.bonusTimeout) clearTimeout(this.bonusTimeout);
        if (this.bonusCountdown) clearInterval(this.bonusCountdown);
    }

    scheduleBonusFruit() {
        setTimeout(() => {
            if (!this.gameOver) {
                this.bonusFood = this.generateBonusFood();
                
                // Set timeout to remove the bonus food
                this.bonusTimeout = setTimeout(() => {
                    this.clearBonusFood();
                    this.scheduleBonusFruit(); // Schedule next bonus fruit
                }, this.bonusDuration);

                // Start countdown update interval
                this.bonusCountdown = setInterval(() => {
                    if (this.bonusFood && !this.gameOver) {
                        this.updateGrid();
                    }
                }, 1000);
            }
        }, this.bonusInterval);
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
