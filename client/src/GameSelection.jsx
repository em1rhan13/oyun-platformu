// client/src/GameSelection.jsx
import React, { useState } from 'react';

function GameSelection({ socket, room, isHost }) {
  const [selectedGame, setSelectedGame] = useState(null);

  // Mevcut Oyunlar Listesi
  const games = [
    { id: 'tkm', name: 'Taş Kağıt Makas', icon: '✊✋✌️', color: 'from-blue-500 to-cyan-500' },
    { id: 'xox', name: 'XOX (Tic Tac Toe)', icon: '❌⭕', color: 'from-purple-500 to-pink-500', disabled: true }, // Henüz yapmadık
    { id: 'memory', name: 'Kart Eşleştirme', icon: '🃏', color: 'from-green-500 to-emerald-500', disabled: true },
    { id: 'soccer', name: 'Kafa Topu', icon: '⚽', color: 'from-orange-500 to-red-500', disabled: true },
  ];

  const handleSelect = (gameId) => {
    if (!isHost) return; // Host değilse seçemesin
    setSelectedGame(gameId);
  };

  const startGame = () => {
    if (selectedGame) {
      // Sunucuya "Bu oyunu seçtik" de
      socket.emit("select_game", { room, gameName: selectedGame });
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
      
      <h2 className="text-3xl font-bold text-white mb-2">
        {isHost ? "BİR OYUN SEÇ" : "HOST'UN OYUN SEÇMESİ BEKLENİYOR..."}
      </h2>
      <p className="text-gray-400 mb-8">Eğlence başlasın!</p>

      {/* OYUN KARTLARI GRİDİ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {games.map((game) => (
          <div
            key={game.id}
            onClick={() => !game.disabled && handleSelect(game.id)}
            className={`
              relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 group overflow-hidden
              ${game.disabled ? "opacity-40 grayscale cursor-not-allowed border-gray-700" : "hover:scale-105"}
              ${selectedGame === game.id 
                ? "border-yellow-400 bg-gray-800 shadow-[0_0_20px_rgba(250,204,21,0.5)]" 
                : "border-gray-700 bg-gray-800 hover:border-gray-500"}
            `}
          >
            {/* Arkaplan Efekti */}
            <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition duration-500`}></div>
            
            <div className="text-4xl mb-3">{game.icon}</div>
            <h3 className="text-xl font-bold text-white">{game.name}</h3>
            {game.disabled && <span className="text-xs text-red-400 font-mono mt-2 block">(Yakında)</span>}
            
            {/* Seçildi İşareti */}
            {selectedGame === game.id && (
                <div className="absolute top-2 right-2 text-yellow-400 text-xl">✅</div>
            )}
          </div>
        ))}
      </div>

      {/* BAŞLAT BUTONU (Sadece Host ve Oyun Seçiliyse Görünür) */}
      {isHost && (
        <button
          onClick={startGame}
          disabled={!selectedGame}
          className={`
            mt-10 px-10 py-4 rounded-full font-bold text-xl tracking-wider shadow-lg transition-all
            ${selectedGame 
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105" 
                : "bg-gray-700 text-gray-500 cursor-not-allowed"}
          `}
        >
          SEÇ VE DEVAM ET ➤
        </button>
      )}
      
      {!isHost && selectedGame && (
         <div className="mt-8 text-yellow-400 animate-pulse">
            Host {games.find(g=>g.id === selectedGame)?.name} oyununu seçti!
         </div>
      )}

    </div>
  );
}

export default GameSelection;