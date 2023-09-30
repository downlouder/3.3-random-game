import Grid from "./Grid.js";
import Tile from "./Tile.js";

const gameBoard = document.getElementById("game-board");
const scoreText = document.querySelector(".score-text");
const stepsText = document.querySelector(".steps-text");
const ratingBtn = document.querySelector(".rating-btn");
const modalRating = document.querySelector(".modal-rating-block");
const statsTable = document.querySelector(".stats-table");
const [upBtn, downBtn, leftBtn, rightBtn] =
  document.querySelectorAll(".control-btn");
const grid = new Grid(gameBoard);
const arrayOfGames = JSON.parse(localStorage.getItem("games")) || [];
let countOfSteps = 0;
grid.randomEmptyCell().tile = new Tile(gameBoard);
grid.randomEmptyCell().tile = new Tile(gameBoard);
setupInput();

function setupInput() {
  console.log(getScore(grid.cells));
  scoreText.textContent = `Score: ${getScore(grid.cells)}`;
  stepsText.textContent = `Steps: ${countOfSteps}`;
  window.addEventListener("keydown", handleInput, { once: true });
  window.addEventListener("click", touchInput, { once: true });
}
async function handleInput(e) {
  switch (e.key) {
    case "ArrowUp":
      countOfSteps++;
      if (!canMoveUp()) {
        setupInput();
        return;
      }
      await moveUp();
      break;
    case "ArrowDown":
      countOfSteps++;
      if (!canMoveDown()) {
        setupInput();
        return;
      }
      await moveDown();
      break;
    case "ArrowLeft":
      countOfSteps++;
      if (!canMoveLeft()) {
        setupInput();
        return;
      }
      await moveLeft();
      break;
    case "ArrowRight":
      countOfSteps++;
      if (!canMoveRight()) {
        setupInput();
        return;
      }
      await moveRight();
      break;
    default:
      setupInput();
      return;
  }

  grid.cells.forEach((cell) => cell.mergeTiles());
  const newTile = new Tile(gameBoard);
  grid.randomEmptyCell().tile = newTile;

  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
    newTile.waitForTransition(true).then(() => {
      const resultsOfGame = {
        id: arrayOfGames.length
          ? arrayOfGames[0].id + 1
          : arrayOfGames.length + 1,
        steps: countOfSteps,
        score: getScore(grid.cells),
      };
      arrayOfGames.unshift(resultsOfGame);
      if (arrayOfGames.length > 10) arrayOfGames.pop();
      localStorage.setItem("games", JSON.stringify(arrayOfGames));
      alert("You lose");
    });
    return;
  }

  setupInput();
}

async function touchInput(e) {
  console.log(e.target.alt);
  if (e.target.closest(".up-btn") || e.target.alt === "Up Arrow") {
    countOfSteps++;
    if (!canMoveUp()) {
      setupInput();
      return;
    }
    await moveUp();
  } else if (e.target.closest(".down-btn") || e.target.alt === "Down Arrow") {
    countOfSteps++;
    if (!canMoveDown()) {
      setupInput();
      return;
    }
    await moveDown();
  } else if (e.target.closest(".left-btn") || e.target.alt === "Left Arrow") {
    countOfSteps++;
    if (!canMoveLeft()) {
      setupInput();
      return;
    }
    await moveLeft();
  } else if ((e.target.closest(".right-btn") || e.target.alt === "Right Arrow")) {
    countOfSteps++;
    if (!canMoveRight()) {
      setupInput();
      return;
    }
    await moveRight();
  } else {
    setupInput();
  }

  grid.cells.forEach((cell) => cell.mergeTiles());
  const newTile = new Tile(gameBoard);
  grid.randomEmptyCell().tile = newTile;

  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
    newTile.waitForTransition(true).then(() => {
      const resultsOfGame = {
        id: arrayOfGames.length
          ? arrayOfGames[0].id + 1
          : arrayOfGames.length + 1,
        steps: countOfSteps,
        score: getScore(grid.cells),
      };
      arrayOfGames.unshift(resultsOfGame);
      if (arrayOfGames.length > 10) arrayOfGames.pop();
      localStorage.setItem("games", JSON.stringify(arrayOfGames));
      alert("You lose");
    });
    return;
  }

  setupInput();
}

function moveUp() {
  return slideTiles(grid.cellsByColumn);
}
function moveDown() {
  return slideTiles(grid.cellsByColumn.map((column) => [...column].reverse()));
}
function moveLeft() {
  return slideTiles(grid.cellsByRow);
}
function moveRight() {
  return slideTiles(grid.cellsByRow.map((row) => [...row].reverse()));
}

function slideTiles(cells) {
  return Promise.all(
    cells.flatMap((group) => {
      const promises = [];
      for (let i = 1; i < group.length; i++) {
        const cell = group[i];
        if (cell.tile == null) continue;
        let lastValidCell;
        for (let j = i - 1; j >= 0; j--) {
          const moveToCell = group[j];
          if (!moveToCell.canAccept(cell.tile)) break;
          lastValidCell = moveToCell;
        }

        if (lastValidCell != null) {
          promises.push(cell.tile.waitForTransition());
          if (lastValidCell.tile != null) {
            lastValidCell.mergeTile = cell.tile;
          } else {
            lastValidCell.tile = cell.tile;
          }
          cell.tile = null;
        }
      }
      return promises;
    })
  );
}

function canMoveUp() {
  return canMove(grid.cellsByColumn);
}

function canMoveDown() {
  return canMove(grid.cellsByColumn.map((column) => [...column].reverse()));
}

function canMoveLeft() {
  return canMove(grid.cellsByRow);
}

function canMoveRight() {
  return canMove(grid.cellsByRow.map((row) => [...row].reverse()));
}

function canMove(cells) {
  return cells.some((group) => {
    return group.some((cell, index) => {
      if (index === 0) return false;
      if (cell.tile == null) return false;
      const moveToCell = group[index - 1];
      return moveToCell.canAccept(cell.tile);
    });
  });
}

function getScore(cells) {
  return cells
    .filter((cell) => !!cell.tile)
    .reduce(
      (acc, currentCell) => Number(acc) + Number(currentCell.tile.value),
      0
    );
}

ratingBtn.addEventListener("click", () => {
  modalRating.classList.toggle("hidden");
  if (!modalRating.classList.contains("hidden")) {
    const results = JSON.parse(localStorage.getItem("games")).sort(
      (a, b) => a.id - b.id
    );
    generateRatingTable(results);
  }
});
function generateRatingTable(arr) {
  modalRating.innerHTML = "";
  arr.forEach((game) => {
    modalRating.innerHTML += `
      <div class="game-stats">
        <p>Game: ${game.id}</p>
        <p>Steps: ${game.steps}</p>
        <p>Score: ${game.score}</p>
      </div>
    `;
  });
}
function sortByScoreUpDown(arr) {
  return arr.sort((a, b) => b.score - a.score);
}
function sortByScoreDownUp(arr) {
  return arr.sort((a, b) => a.score - b.score);
}
function sortByStepsUpDown(arr) {
  return arr.sort((a, b) => b.steps - a.steps);
}
function sortByStepsDownUp(arr) {
  return arr.sort((a, b) => a.steps - b.steps);
}
