// client/src/Game.jsx
import React, { useState, useEffect } from 'react';

function Game({ socket, room }) {
  const [myChoice, setMyChoice] = useState("");
  const [result, setResult] = useState(""); // Kazandın / Kaybettin / Berabere
  const [opponentMoved, setOpponentMoved] = useState(false); // Rakip oynadı mı?

  // Seçim yapma fonksiyonu
  const chooseOption = (option) => {
    setMyChoice(option);
    socket.emit("make_move", { room, move: option });
  };

  // Yeniden Oyna
  const restartGame = () => {
    setMyChoice("");
    setResult("");
    setOpponentMoved(false);
    socket.emit("restart_game", { room });
  }

  useEffect(() => {
    // Oyun sonucunu dinle
    socket.on("game_result", (data) => {
      // data.winner: "draw" veya kazananın socketID'si
      // data.opponentMove: Rakibin ne attığı
      
      if (data.winner === "draw") {
        setResult("BERABERE! 🤝");
      } else if (data.winner === socket.id) {
        setResult("KAZANDIN! 🎉");
      } else {
        setResult("KAYBETTİN... 😔");
      }
    });

    // Rakip hamle yapınca (Ben henüz seçmediysem)
    socket.on("opponent_made_move", () => {
        setOpponentMoved(true);
    })

    // Oyun yeniden başlatıldığında
    socket.on("restart_game", () => {
        setMyChoice("");
        setResult("");
        setOpponentMoved(false);
    });

    return () => {
        socket.off("game_result");
        socket.off("opponent_made_move");
        socket.off("restart_game");
    }
  }, [socket]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      
      {/* BAŞLIK VE DURUM */}
      <h2 className="text-3xl font-bold text-white mb-8">TAŞ - KAĞIT - MAKAS</h2>

      {/* SONUÇ EKRANI (Oyun bittiyse görünür) */}
      {result ? (
        <div className="text-center animate-bounce">
          <h1 className={`text-5xl font-extrabold mb-4 ${result.includes("KAZAN") ? "text-green-400" : result.includes("KAY") ? "text-red-500" : "text-yellow-400"}`}>
            {result}
          </h1>
          <button 
            onClick={restartGame}
            className="px-6 py-2 bg-white text-gray-900 font-bold rounded hover:bg-gray-200 transition"
          >
            TEKRAR OYNA
          </button>
        </div>
      ) : (
        /* SEÇİM EKRANI */
        <div className="flex flex-col items-center gap-6">
            
            {/* RAKİP DURUMU */}
            <div className="h-8 text-yellow-400 font-mono">
                {opponentMoved && !myChoice && "⚠️ RAKİP HAMLESİNİ YAPTI, SENİ BEKLİYOR!"}
                {!opponentMoved && "Rakip düşünüyor..."}
            </div>

            {/* BUTONLAR */}
            <div className="flex gap-4 md:gap-8">
                {["Tas", "Kagit", "Makas"].map((option) => (
                    <button
                        key={option}
                        onClick={() => chooseOption(option)}
                        disabled={myChoice !== ""} // Seçim yaptıysan butonları kilitle
                        className={`
                            w-24 h-24 md:w-32 md:h-32 rounded-full text-4xl md:text-5xl border-4 transition transform hover:scale-110 active:scale-95
                            ${myChoice === option ? "bg-blue-600 border-blue-400 scale-110 shadow-[0_0_20px_rgba(37,99,235,0.8)]" : "bg-gray-700 border-gray-500 hover:border-white"}
                            ${myChoice !== "" && myChoice !== option ? "opacity-30 cursor-not-allowed" : ""}
                        `}
                    >
                        {option === "Tas" && "✊"}
                        {option === "Kagit" && "✋"}
                        {option === "Makas" && "✌️"}
                    </button>
                ))}
            </div>

            {/* SEÇİM BİLGİSİ */}
            {myChoice && <p className="text-gray-400 mt-4">Rakibin seçimi bekleniyor...</p>}
        </div>
      )}
    </div>
  );
}

export default Game;