import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

import ReactModal from 'react-modal'; 
ReactModal.setAppElement('#root');

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

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Game over");
  const [modalText, setModalText] = useState("Looooser!");

  const handleCloseModal = () => {
    safeGameMutate((game) => {
      game.reset();
    });
    clearTimeout(200);
    setModalIsOpen(false);
  }

  const customStyles = {
    overlay: {zIndex: 1000}
  };

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
      if(gameStatus.message.localeCompare("Game Over - White Won") == 0){
        setModalText("You won! Seems you are the real next Magnus or at least you had some luck. Or did you cheat? Better play again to proof that you are really that good.");
        setModalTitle("White won");
        setModalIsOpen(true);
      } else if (gameStatus.message.localeCompare("Game Over - Black Won") == 0 || game.moves().length == 0){
        setModalText("Not everyone can be a chess master, especially not you. But you cam play again to show me that I am wrong.");
        setModalTitle("Game over");
        setModalIsOpen(true);
      } else if (gameStatus.message.localeCompare("Game Over - Remis") == 0){
        setModalText("Nah! Seems you can't beat me. Try it in another round?");
        setModalTitle("Remis");
        setModalIsOpen(true);
      }elb 

      
      return;
    }

    if (game.moves().length == 0) {
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
    <button className="button"
        onClick={() => {
          safeGameMutate((game) => {
            game.reset();
          });
          clearTimeout(200);
        }}
      > Reset
      </button>
  </div>
  <ReactModal isOpen={modalIsOpen} style={customStyles} className="Modal"
           overlayClassName="Overlay" contentLabel="Game finished"
           shouldFocusAfterRender={false} >
      <h3>{modalTitle}</h3>      
      <p>{modalText}</p>
      <button className="button" onClick={handleCloseModal}>Play again</button>
  </ReactModal>
  </>

);
}  