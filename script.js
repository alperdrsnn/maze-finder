class Maze {
    constructor(rows, cols, cellSize) {
        this.rows = rows;
        this.cols = cols;
        this.cellSize = cellSize;
        this.grid = [];
        this.stack = [];
        this.canvas = document.getElementById('mazeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = cols * cellSize;
        this.canvas.height = rows * cellSize;

        this.currentCell = null;

        this.initGrid();
        this.generateMaze();
    }

    initGrid() {
        for (let row = 0; row < this.rows; row++) {
            let gridRow = [];
            for (let col = 0; col < this.cols; col++) {
                gridRow.push(new Cell(row, col, this.cellSize, this.ctx));
            }
            this.grid.push(gridRow);
        }
        this.currentCell = this.grid[0][0];
    }

    generateMaze() {
        this.currentCell.visited = true;

        let nextCell = this.getNextNeighbor(this.currentCell);

        if (nextCell) {
            nextCell.visited = true;

            this.stack.push(this.currentCell);

            this.removeWalls(this.currentCell, nextCell);

            this.currentCell = nextCell;

            requestAnimationFrame(() => this.generateMaze());
        } else if (this.stack.length > 0) {
            this.currentCell = this.stack.pop();
            requestAnimationFrame(() => this.generateMaze());
        } else {
            this.draw();
            this.solveMaze();
        }

        this.draw();
    }

    getNextNeighbor(cell) {
        let neighbors = [];

        let {row, col} = cell;

        if (row > 0) {
            let top = this.grid[row - 1][col];
            if (!top.visited) neighbors.push(top);
        }

        if (col < this.cols - 1) {
            let right = this.grid[row][col + 1];
            if (!right.visited) neighbors.push(right);
        }

        if (row < this.rows - 1) {
            let bottom = this.grid[row + 1][col];
            if (!bottom.visited) neighbors.push(bottom);
        }

        if (col > 0) {
            let left = this.grid[row][col - 1];
            if (!left.visited) neighbors.push(left);
        }

        if (neighbors.length > 0) {
            let randomIndex = Math.floor(Math.random() * neighbors.length);
            return neighbors[randomIndex];
        } else {
            return undefined;
        }
    }

    getNeighbors(cell) {
        let neighbors = [];
        let {row, col} = cell;

        if (!cell.walls.top && row > 0) {
            neighbors.push(this.grid[row - 1][col]);
        }

        if (!cell.walls.right && col < this.cols - 1) {
            neighbors.push(this.grid[row][col + 1]);
        }

        if (!cell.walls.bottom && row < this.rows - 1) {
            neighbors.push(this.grid[row + 1][col]);
        }

        if (!cell.walls.left && col > 0) {
            neighbors.push(this.grid[row][col - 1]);
        }

        return neighbors;
    }

    removeWalls(a, b) {
        let x = a.col - b.col;
        if (x === 1) {
            a.walls.left = false;
            b.walls.right = false;
        } else if (x === -1) {
            a.walls.right = false;
            b.walls.left = false;
        }

        let y = a.row - b.row;
        if (y === 1) {
            a.walls.top = false;
            b.walls.bottom = false;
        } else if (y === -1) {
            a.walls.bottom = false;
            b.walls.top = false;
        }
    }

    draw() {
        for (let row of this.grid) {
            for (let cell of row) {
                cell.draw();
            }
        }
    }

    solveMaze() {
        let algorithm = document.getElementById('algorithmSelect').value;

        if (algorithm === 'bfs') {
            this.solveWithBFS();
        } else if (algorithm === 'dfs') {
            this.solveWithDFS();
        } else if (algorithm === 'astar') {
            this.solveWithAStar();
        }
    }

    animateSolution(cameFrom, endCell) {
        let path = [];
        let current = endCell;

        while (current) {
            path.push(current);
            current = cameFrom.get(current);
        }

        let animate = () => {
            if (path.length > 0) {
                let cell = path.pop();
                cell.highlite('blue');
                requestAnimationFrame(animate);
            } else {
                console.log('Maze solve completed.');
            }
        };

        animate();
    }

    solveWithBFS() {
        let queue = [];
        let startCell = this.grid[0][0];
        let endCell = this.grid[this.rows - 1][this.cols - 1];
        let cameFrom = new Map();

        for (let row of this.grid) {
            for (let cell of row) {
                cell.visited = false;
            }
        }

        startCell.visited = true;
        queue.push(startCell);

        while (queue.length > 0) {
            let current = queue.shift();

            if (current === endCell) {
                this.animateSolution(cameFrom, endCell);
                return;
            }

            let neighbors = this.getNeighbors(current);

            for (let neighbor of neighbors) {
                if (!neighbor.visited) {
                    neighbor.visited = true;
                    cameFrom.set(neighbor, current);
                    queue.push(neighbor);
                }
            }
        }
    }

    solveWithDFS() {
        let stack = [];
        let startCell = this.grid[0][0];
        let endCell = this.grid[this.rows - 1][this.cols - 1];
        let cameFrom = new Map();

        for (let row of this.grid) {
            for (let cell of row) {
                cell.visited = false;
            }
        }

        startCell.visited = true;
        stack.push(startCell);

        while (stack.length > 0) {
            let current = stack.pop();

            if (current === endCell) {
                this.animateSolution(cameFrom, endCell);
                return;
            }

            let neighbors = this.getNeighbors(current);

            for (let neighbor of neighbors) {
                if (!neighbor.visited) {
                    neighbor.visited = true;
                    cameFrom.set(neighbor, current);
                    stack.push(neighbor);
                }
            }
        }
    }

    solveWithAStar() {
        let openSet = [];
        let closedSet = new Set();
        let startCell = this.grid[0][0];
        let endCell = this.grid[this.rows - 1][this.cols - 1];
        let cameFrom = new Map();

        for (let row of this.grid) {
            for (let cell of row) {
                cell.g = Infinity;
                cell.h = 0;
                cell.f = Infinity;
                cell.visited = false;
            }
        }

        startCell.g = 0;
        startCell.h = this.heuristic(startCell, endCell);
        startCell.f = startCell.h;

        openSet.push(startCell);

        while (openSet.length > 0) {
            let current = openSet.reduce((lowest, cell) => {
                return (cell.f < lowest.f) ? cell : lowest;
            }, openSet[0]);

            if (current === endCell) {
                this.animateSolution(cameFrom, endCell);
                return;
            }

            openSet = openSet.filter(cell => cell !== current);
            closedSet.add(current);

            let neighbors = this.getNeighbors(current);

            for (let neighbor of neighbors) {
                if (closedSet.has(neighbor)) {
                    continue;
                }

                let tentativeG = current.g + 1;

                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                } else if (tentativeG >= neighbor.g) {
                    continue;
                }

                cameFrom.set(neighbor, current);
                neighbor.g = tentativeG;
                neighbor.h = this.heuristic(neighbor, endCell);
                neighbor.f = neighbor.g + neighbor.h;
            }
        }

        console.log('No solution found.');
    }

    heuristic(a, b) {
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    }
}

class Cell {
    constructor(row, col, size, ctx) {
        this.row = row;
        this.col = col;
        this.size = size;
        this.ctx = ctx;
        this.walls = { top: true, right: true, bottom: true, left: true };
        this.visited = false;
    }

    draw() {
        const x = this.col * this.size;
        const y = this.row * this.size;

        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;

        if (this.visited) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(x, y, this.size, this.size);
        }

        this.drawWalls();
    }

    drawWalls() {
        const x = this.col * this.size;
        const y = this.row * this.size;

        if (this.walls.top) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + this.size, y);
            this.ctx.stroke();
        }

        if (this.walls.right) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + this.size, y);
            this.ctx.lineTo(x + this.size, y + this.size);
            this.ctx.stroke();
        }

        if (this.walls.bottom) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + this.size, y + this.size);
            this.ctx.lineTo(x, y + this.size);
            this.ctx.stroke();
        }

        if (this.walls.left) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + this.size);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }
    }

    highlite(color) {
        const x = this.col * this.size;
        const y = this.row * this.size;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, this.size, this.size);
        this.drawWalls();
    }
}

document.getElementById('generateButton').addEventListener('click', () => {
    let mazeSize = parseInt(document.getElementById('mazeSize').value);
    if (mazeSize < 5) mazeSize = 5;
    if (mazeSize > 50) mazeSize = 50;

    let cellSize = 500 / mazeSize;
    let maze = new Maze(mazeSize, mazeSize, cellSize);
})