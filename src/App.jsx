import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

const url = "https://nextmagnus.pushandrun.de/move"

export default function App() {
  const [game, setGame] = useState(new Chess());

  var gameStatus = {
    fen: "",
    gameOver: false,
    move: "",
    usedTimebyAi: 0,
    mode: "AlphaBeta",
    message: ""
  }

  var isGameOver = Chess.isGameOver;
  Chess.isGameOver = () => { return (isGameOver || gameStatus.gameOver);} 

  function makeAMove(move) {
    const gameCopy = { ...game };
    const result = gameCopy.move(move);
    setGame(gameCopy);
    return result; // null if the move was illegal, the move object if the move was legal
  }

  async function getMovefromAi() {
    gameStatus.fen = game.fen();

    //make a get request to the chess engine including the gameStatus 
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gameStatus)
    })
    .then((response) => response.json())
    .then((json) => gameStatus = json);
    console.log(gameStatus);

    console.log(gameStatus.move)
    var moveObject;
    if (gameStatus.move.length === 4){ 
      moveObject = {from: gameStatus.move.substring(0,2), to: gameStatus.move.substring(2,4)}; 
    } else if (gameStatus.move.length === 2) {
      moveObject = {to: gameStatus.move.substring(0,2)};  
    } else if (gameStatus.move.length === 5) {
      moveObject = {from: gameStatus.move.substring(0,2), to: gameStatus.move.substring(3,5), promotion: gameStatus.move.substring(2,3)}
    }

    if (gameStatus.move != undefined && !(gameStatus.move.length === 0)){
      safeGameMutate((game) => {
        game.move(moveObject);
      });
    } else {
      console.log("Empty move returned!")
    }

    if (gameStatus.gameOver || game.moves().length == 0) {
      console.log(gameStatus.message)
      return;
    }
    
  }

  function onDrop(sourceSquare, targetSquare) {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to a queen for simplicity
    });

    // illegal move
    if (move === null) return false;
    setTimeout(getMovefromAi, 200);
    return true;
  }

  function safeGameMutate(modify) {
    setGame((g) => {
      const update = { ...g };
      modify(update);
      return update;
    });
  }

  
  return (
  <>
  <div className="board">
    <Chessboard position={game.fen()} onPieceDrop={onDrop} 
    customBoardStyle={{
    borderRadius: "4px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
    }}
    customDarkSquareStyle={{ backgroundColor: "#91b1c7" }}
    customLightSquareStyle={{ backgroundColor: "#dae1e6" }} />
    <button className="resetButton"
        onClick={() => {
          safeGameMutate((game) => {
            game.reset();
          });
          clearTimeout(200);
        }}
      > Reset
      </button>
  </div>
  </>

);
}  