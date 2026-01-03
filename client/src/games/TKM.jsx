// client/src/games/TKM.jsx
import React, { useState, useEffect } from 'react';

function TKM({ socket, room }) {
  const [myChoice, setMyChoice] = useState("");
  const [opponentMoved, setOpponentMoved] = useState(false);
  const [roundResult, setRoundResult] = useState(null); // { winnerId, moves }
  const [countdown, setCountdown] = useState(null); // Yeni tur sayacı

  const choose = (option) => {
    if (myChoice || roundResult) return; // Zaten seçtiysek veya tur bittiyse engelle
    setMyChoice(option);
    socket.emit("game_move", { room, move: option });
  };

  useEffect(() => {
    // 1. Rakip hamle yapınca sadece haber ver
    socket.on("opponent_moved_signal", () => {
        setOpponentMoved(true);
    });

    // 2. Tur Sonucu Geldiğinde
    socket.on("round_result", ({ winnerId, moves }) => {
        setRoundResult({ winnerId, moves }); // Sonuçları göster
        
        // 3 saniye sonra yeni tura başla
        let count = 3;
        setCountdown(count);
        const timer = setInterval(() => {
            count--;
            setCountdown(count);
            if (count === 0) {
                clearInterval(timer);
                // State'leri sıfırla
                setMyChoice("");
                setOpponentMoved(false);
                setRoundResult(null);
                setCountdown(null);
            }
        }, 1000);
    });

    return () => {
        socket.off("opponent_moved_signal");
        socket.off("round_result");
    };
  }, [socket]);

  // Yardımcı: Rakibin hamlesini bulmak için
  const getOpponentMove = () => {
      if (!roundResult) return null;
      // moves objesinden benim ID'm olmayan key'i bul
      const opponentId = Object.keys(roundResult.moves).find(id => id !== socket.id);
      return roundResult.moves[opponentId];
  };

  const getResultText = () => {
      if (!roundResult) return "";
      if (roundResult.winnerId === "draw") return "BERABERE! 🤝";
      if (roundResult.winnerId === socket.id) return "KAZANDIN! 🎉";
      return "KAYBETTİN... 😔";
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
        
        {/* --- OYUN ALANI --- */}
        <div className="flex gap-12 items-center mb-12">
            
            {/* Benim Seçimim */}
            <div className="flex flex-col items-center gap-2">
                <span className="text-gray-400 text-sm">SEN</span>
                <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center text-6xl transition-all
                    ${myChoice ? "border-purple-500 bg-purple-900/50" : "border-gray-700 border-dashed"}
                    ${roundResult?.winnerId === socket.id ? "shadow-[0_0_30px_rgba(168,85,247,0.6)]" : ""}
                `}>
                    {myChoice === "Tas" && "✊"}
                    {myChoice === "Kagit" && "✋"}
                    {myChoice === "Makas" && "✌️"}
                    {!myChoice && "❓"}
                </div>
            </div>

            <div className="text-2xl font-bold text-gray-600">VS</div>

            {/* Rakip Seçimi */}
            <div className="flex flex-col items-center gap-2">
                <span className="text-gray-400 text-sm">RAKİP</span>
                <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center text-6xl transition-all
                    ${opponentMoved ? "border-red-500 bg-red-900/50" : "border-gray-700 border-dashed"}
                    ${roundResult && roundResult.winnerId !== socket.id && roundResult.winnerId !== "draw" ? "shadow-[0_0_30px_rgba(239,68,68,0.6)]" : ""}
                `}>
                    {/* Sonuç gelmediyse gizli, geldiyse açık göster */}
                    {!roundResult && opponentMoved && "✅"} 
                    {!roundResult && !opponentMoved && "⏳"}
                    
                    {roundResult && getOpponentMove() === "Tas" && "✊"}
                    {roundResult && getOpponentMove() === "Kagit" && "✋"}
                    {roundResult && getOpponentMove() === "Makas" && "✌️"}
                </div>
            </div>
        </div>

        {/* --- BUTONLAR (Sadece seçim yapılmadıysa aktif) --- */}
        {!roundResult && (
            <div className="flex gap-6">
                {["Tas", "Kagit", "Makas"].map((opt) => (
                    <button
                        key={opt}
                        onClick={() => choose(opt)}
                        disabled={myChoice !== ""}
                        className={`w-20 h-20 rounded-full text-3xl border-2 transition-all hover:scale-110 active:scale-95
                            ${myChoice === opt ? "bg-purple-600 border-purple-400" : "bg-gray-800 border-gray-600 hover:border-white"}
                            ${myChoice !== "" && myChoice !== opt ? "opacity-20 cursor-not-allowed" : ""}
                        `}
                    >
                        {opt === "Tas" && "✊"}
                        {opt === "Kagit" && "✋"}
                        {opt === "Makas" && "✌️"}
                    </button>
                ))}
            </div>
        )}

        {/* --- SONUÇ EKRANI (Overlay) --- */}
        {roundResult && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm rounded-xl z-10">
                <h1 className={`text-6xl font-black mb-4 animate-bounce
                    ${roundResult.winnerId === socket.id ? "text-green-400" : roundResult.winnerId === "draw" ? "text-yellow-400" : "text-red-500"}
                `}>
                    {getResultText()}
                </h1>
                <p className="text-white text-xl">Yeni tur başlıyor: {countdown}</p>
            </div>
        )}

        {/* Bilgi Mesajı */}
        {!roundResult && (
            <div className="mt-8 text-yellow-400 font-mono font-bold h-6">
                {myChoice && !opponentMoved && "Rakip bekleniyor..."}
                {opponentMoved && !myChoice && "Rakip oynadı! Sıra sende!"}
            </div>
        )}
    </div>
  );
}
export default TKM;