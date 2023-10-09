import Grid from "./Grid.js";
import Tile from "./Tile.js";

console.clear();

const gameBoard = document.getElementById("game-board");
const scoreText = document.querySelector(".score-text");
const stepsText = document.querySelector(".steps-text");
const ratingBtn = document.querySelector(".rating-btn");
const modalRating = document.querySelector(".modal-rating-block");
const filterBtns = document.querySelectorAll(".filter-buttons > p");
const gameFilter = document.querySelector(".game-filter");
const stepsFilter = document.querySelector(".steps-filter");
const scoreFilter = document.querySelector(".score-filter");
const modalFinish = document.querySelector(".modal-finish-block");
const resultOfGame = document.querySelector(".result-of-game");
const playAgainBtn = document.querySelector(".play-again");
const statsTable = document.querySelector(".stats-table");
const closeBtn = document.querySelector(".close-btn");
let grid = new Grid(gameBoard);
const arrayOfGames = JSON.parse(localStorage.getItem("games")) || [];
let countOfSteps = 0;
let score = 0;
let xDown = null;
let yDown = null;
let isWin = localStorage.getItem("isWin") || false;
grid.randomEmptyCell().tile = new Tile(gameBoard);
grid.randomEmptyCell().tile = new Tile(gameBoard);
setupInput();

function setupInput() {
  score = getScore(grid.cells);
  scoreText.textContent = `Score: ${score}`;
  stepsText.textContent = `Steps: ${countOfSteps}`;
  window.addEventListener("keydown", handleInput, { once: true });
  window.addEventListener("click", touchInput, { once: true });
}
async function handleInput(e) {
  switch (e.key) {
    case "ArrowUp":
      if (!canMoveUp()) {
        setupInput();
        return;
      }
      countOfSteps++;
      await moveUp();
      break;
    case "ArrowDown":
      if (!canMoveDown()) {
        setupInput();
        return;
      }
      countOfSteps++;
      await moveDown();
      break;
    case "ArrowLeft":
      if (!canMoveLeft()) {
        setupInput();
        return;
      }
      countOfSteps++;
      await moveLeft();
      break;
    case "ArrowRight":
      if (!canMoveRight()) {
        setupInput();
        return;
      }
      countOfSteps++;
      await moveRight();
      break;
    default:
      setupInput();
      return;
  }

  movingMechanic();
  setupInput();
}

async function touchInput(e) {
  if (e.target.closest(".up-btn") || e.target.alt === "Up Arrow") {
    if (!canMoveUp()) {
      setupInput();
      return;
    }
    countOfSteps++;
    await moveUp();
  } else if (e.target.closest(".down-btn") || e.target.alt === "Down Arrow") {
    if (!canMoveDown()) {
      setupInput();
      return;
    }
    countOfSteps++;
    await moveDown();
  } else if (e.target.closest(".left-btn") || e.target.alt === "Left Arrow") {
    if (!canMoveLeft()) {
      setupInput();
      return;
    }
    countOfSteps++;
    await moveLeft();
  } else if (e.target.closest(".right-btn") || e.target.alt === "Right Arrow") {
    if (!canMoveRight()) {
      setupInput();
      return;
    }
    countOfSteps++;
    await moveRight();
  } else {
    setupInput();
    return;
  }

  movingMechanic();
  setupInput();
}

function movingMechanic() {
  grid.cells.forEach((cell) => cell.mergeTiles());
  const newTile = new Tile(gameBoard);
  grid.randomEmptyCell().tile = newTile;
  if (score >= 2500) {
    grid.cells.forEach((cell) => {
      if (!cell.tile) {
        return cell;
      } else {
        if (cell.tile.value < 8) {
          cell.tile.value = cell.tile.value * 8;
        }
        return cell;
      }
    });
  } else if (score >= 1000) {
    grid.cells.forEach((cell) => {
      if (!cell.tile) {
        return cell;
      } else {
        if (cell.tile.value < 8) {
          cell.tile.value = cell.tile.value * 4;
        }
        return cell;
      }
    });
  } else if (score >= 250) {
    grid.cells.forEach((cell) => {
      if (!cell.tile) {
        return cell;
      } else {
        if (cell.tile.value < 8) {
          if (!cell.tile.multiplied) {
            cell.tile.value = cell.tile.value * 2;
            cell.tile.multiplied = true;
          }
        }
        return cell;
      }
    });
  }

  if (isWin === "false") {
    isWin = checkWin(grid.cells);
    localStorage.setItem("isWin", isWin);
    if (localStorage.getItem("isWin") === "true") {
      saveGame();
      modalFinish.classList.toggle("hidden");
      resultOfGame.textContent = "You won!!!";
    }
    return;
  }
  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
    newTile.waitForTransition(true).then(() => {
      saveGame();
      modalFinish.classList.toggle("hidden");
      resultOfGame.textContent = "You lost!";
    });
    return;
  }
}

function saveGame() {
  const resultsOfGame = {
    id: arrayOfGames.length ? arrayOfGames[0].id + 1 : arrayOfGames.length + 1,
    steps: countOfSteps,
    score: getScore(grid.cells),
  };
  arrayOfGames.unshift(resultsOfGame);
  if (arrayOfGames.length > 10) arrayOfGames.pop();
  localStorage.setItem("games", JSON.stringify(arrayOfGames));
}

function checkWin(cells) {
  return [...cells]
    .filter((cell) => cell.tile)
    .some((cell) => cell.tile.value >= 2048);
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

closeBtn.addEventListener("click", () => {
  modalRating.classList.toggle("hidden");
});

playAgainBtn.addEventListener("click", () => {
  gameBoard.innerHTML = `
    <div class="control-buttons">
      <div class="control-btn up-btn">
        <img src="./svg/arrow-up-solid.svg" alt="Up Arrow" />
      </div>
      <div class="control-btn down-btn">
        <img src="./svg/arrow-up-solid.svg" alt="Down Arrow" />
      </div>
      <div class="control-btn left-btn">
        <img src="./svg/arrow-up-solid.svg" alt="Left Arrow" />
      </div>
      <div class="control-btn right-btn">
        <img src="./svg/arrow-up-solid.svg" alt="Right Arrow" />
      </div>
    </div>
  `;
  grid = new Grid(gameBoard);
  grid.randomEmptyCell().tile = new Tile(gameBoard);
  grid.randomEmptyCell().tile = new Tile(gameBoard);
  setupInput();
  countOfSteps = 0;
  modalFinish.classList.toggle("hidden");
});

ratingBtn.addEventListener("click", () => {
  modalRating.classList.toggle("hidden");
  if (!modalRating.classList.contains("hidden")) {
    const results = sortByGameDownUp(JSON.parse(localStorage.getItem("games")));
    generateRatingTable(results);
  }
});
function generateRatingTable(arr) {
  statsTable.innerHTML = "";
  arr.forEach((game) => {
    statsTable.innerHTML += `
      <div class="game-stats">
        <p>Game: ${game.id}</p>
        <p>Steps: ${game.steps}</p>
        <p>Score: ${game.score}</p>
      </div>
    `;
  });
}

// SWIPE MECHANIC
document.addEventListener("touchstart", handleTouchStart, false);
document.addEventListener("touchmove", handleTouchMove, false);
function getTouches(e) {
  return e.touches;
}
function handleTouchStart(e) {
  const firstTouch = getTouches(e)[0];
  xDown = firstTouch.clientX;
  yDown = firstTouch.clientY;
}
async function handleTouchMove(e) {
  if (!xDown || !yDown) {
    return;
  }

  let xUp = e.touches[0].clientX;
  let yUp = e.touches[0].clientY;
  let xDiff = xDown - xUp;
  let yDiff = yDown - yUp;

  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    if (xDiff > 0) {
      if (!canMoveRight()) {
        setupInput();
        return;
      }
      countOfSteps++;
      await moveRight();
    } else {
      if (!canMoveLeft()) {
        setupInput();
        return;
      }
      countOfSteps++;
      await moveLeft();
    }
  } else {
    if (yDiff > 0) {
      if (!canMoveDown()) {
        setupInput();
        return;
      }
      countOfSteps++;
      await moveDown();
    } else {
      if (!canMoveUp()) {
        setupInput();
        return;
      }
      countOfSteps++;
      await moveUp();
    }
  }
  xDown = null;
  yDown = null;
}

gameFilter.addEventListener("click", () => {
  sortTable(gameFilter);
});
stepsFilter.addEventListener("click", () => {
  sortTable(stepsFilter);
});
scoreFilter.addEventListener("click", () => {
  sortTable(scoreFilter);
});
function sortTable(el) {
  let results = JSON.parse(localStorage.getItem("games"));
  const filter = el.dataset.filter;
  if (filter === "default") {
    setDefaultIcon(el);
    el.dataset.filter = "up";
    el.style.setProperty("--icon", `url(../svg/sort-up-solid.svg)`);
    if (el === gameFilter) results = sortByGameDownUp(results);
    else if (el === stepsFilter) results = sortByScoreDownUp(results);
    else if (el === scoreFilter) results = sortByScoreDownUp(results);
  } else if (filter === "up") {
    setDefaultIcon(el);
    el.dataset.filter = "down";
    el.style.setProperty("--icon", `url(../svg/sort-down-solid.svg)`);
    if (el === gameFilter) results = sortByGameUpDown(results);
    else if (el === stepsFilter) results = sortByStepsUpDown(results);
    else if (el === scoreFilter) results = sortByScoreUpDown(results);
  } else if (filter === "down") {
    setDefaultIcon(el);
    el.dataset.filter = "up";
    el.style.setProperty("--icon", `url(../svg/sort-up-solid.svg)`);
    if (el === gameFilter) results = sortByGameDownUp(results);
    else if (el === stepsFilter) results = sortByStepsDownUp(results);
    else if (el === scoreFilter) results = sortByScoreDownUp(results);
  }
  generateRatingTable(results);
}
function setDefaultIcon(el) {
  filterBtns.forEach((btn) => {
    if (btn !== el) {
      btn.dataset.filter = "default";
      btn.style.setProperty("--icon", `url(../svg/sort-solid.svg)`);
    }
  });
}
function sortByGameUpDown(arr) {
  return arr.sort((a, b) => b.id - a.id);
}
function sortByGameDownUp(arr) {
  return arr.sort((a, b) => a.id - b.id);
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
