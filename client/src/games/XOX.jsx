// client/src/games/XOX.jsx
import React, { useState, useEffect } from 'react';

function XOX({ socket, room }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [myTurn, setMyTurn] = useState(false);
  
  // Oyun sonuç verileri
  const [roundResult, setRoundResult] = useState(null); 
  
  // Çizgi animasyonu için tetikleyici
  const [animateLine, setAnimateLine] = useState(false);

  // Overlay (Sonuç Ekranı) görünürlüğü
  const [showOverlay, setShowOverlay] = useState(false); 
  
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    socket.emit("sync_game_state", { room });

    socket.on("game_started", ({ turn }) => {
        setMyTurn(turn === socket.id);
        setBoard(Array(9).fill(null));
        setRoundResult(null);
        setAnimateLine(false); // Çizgiyi sıfırla
        setShowOverlay(false);
    });

    socket.on("xox_update", ({ board, turn }) => {
        setBoard(board);
        setMyTurn(turn === socket.id);
    });

    socket.on("round_result", ({ winnerId, winningLine }) => {
        setRoundResult({ winnerId, winningLine });
        
        // 1. Çizgi animasyonunu başlat (Küçük bir gecikme ile DOM'un hazır olmasını bekle)
        setTimeout(() => setAnimateLine(true), 50);
        
        // 2. Overlay'i göstermek için 1.5 saniye bekle (Çizgiyi izleyelim)
        setTimeout(() => {
            setShowOverlay(true);
            
            let count = 3;
            setCountdown(count);
            const timer = setInterval(() => {
                count--;
                setCountdown(count);
                if (count === 0) clearInterval(timer);
            }, 1000);
        }, 1500); 
    });

    socket.on("xox_restart", ({ turn }) => {
        setBoard(Array(9).fill(null));
        setRoundResult(null);
        setAnimateLine(false);
        setShowOverlay(false);
        setMyTurn(turn === socket.id);
        setCountdown(null);
    });

    return () => {
        socket.off("game_started");
        socket.off("xox_update");
        socket.off("round_result");
        socket.off("xox_restart");
        socket.off("sync_game_state");
    };
  }, [socket, room]);

  const handleClick = (index) => {
      if (!myTurn || board[index] !== null || roundResult) return;
      socket.emit("game_move", { room, move: index, gameType: 'xox' });
  };

  // --- KAZANAN ÇİZGİ CSS HESAPLAMALARI (ANIMASYONLU) ---
  const getLineStyles = () => {
    if (!roundResult?.winningLine) return {};
    
    const line = roundResult.winningLine.join(""); 
    const baseClass = "absolute bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,1)] z-20 transition-all duration-700 ease-in-out pointer-events-none";

    // Not: animateLine false ise width/height 0 olacak, true olunca dolacak.

    // --- YATAYLAR ---
    // Soldan sağa doğru uzasın (w-0 -> w-94%)
    if (line === "012") return { className: `${baseClass} h-2 left-[3%] top-[16%]`, style: { width: animateLine ? '94%' : '0%' } };
    if (line === "345") return { className: `${baseClass} h-2 left-[3%] top-[50%] -translate-y-1/2`, style: { width: animateLine ? '94%' : '0%' } };
    if (line === "678") return { className: `${baseClass} h-2 left-[3%] bottom-[16%]`, style: { width: animateLine ? '94%' : '0%' } };

    // --- DİKEYLER ---
    // Yukarıdan aşağı doğru uzasın (h-0 -> h-94%)
    if (line === "036") return { className: `${baseClass} w-2 top-[3%] left-[16%]`, style: { height: animateLine ? '94%' : '0%' } };
    if (line === "147") return { className: `${baseClass} w-2 top-[3%] left-[50%] -translate-x-1/2`, style: { height: animateLine ? '94%' : '0%' } };
    if (line === "258") return { className: `${baseClass} w-2 top-[3%] right-[16%]`, style: { height: animateLine ? '94%' : '0%' } };

    // --- ÇAPRAZLAR ---
    // Ortadan dışa değil, köşeden köşeye uzaması için width kullanacağız ama transform-origin önemli.
    
    // Sol Üst -> Sağ Alt (Origin: Top Left)
    if (line === "048") return { 
        className: `${baseClass} h-2 top-0 left-0 origin-top-left -rotate-[-45deg]`, // Rotate açısı ayarlandı
        style: { 
            width: animateLine ? '140%' : '0%', // Hipotenüs uzunluğu yakl. %140
            transform: 'rotate(45deg) translate(15px, 15px)' // Küçük ofset ayarı
        } 
    }; 
    
    // Sağ Üst -> Sol Alt (Origin: Top Right)
    if (line === "246") return { 
        className: `${baseClass} h-2 top-0 right-0 origin-top-right`, 
        style: { 
            width: animateLine ? '140%' : '0%',
            transform: 'rotate(-45deg) translate(-15px, 15px)' 
        } 
    };

    return {};
  };

  const lineProps = getLineStyles();

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
        
        {/* SIRA BİLGİSİ */}
        {!roundResult && (
            <div className={`mb-4 text-sm font-bold px-6 py-2 rounded-full transition-all duration-300 shadow-lg
                ${myTurn ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : "bg-gray-700 text-gray-400"}
            `}>
                {myTurn ? "SIRA SENDE" : "RAKİP BEKLENİYOR..."}
            </div>
        )}

        {/* --- OYUN ALANI (Relative Parent) --- */}
        <div className="relative p-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700">
            
            {/* KAZANAN ÇİZGİ */}
            {roundResult?.winningLine && (
                <div 
                    className={lineProps.className} 
                    style={lineProps.style}
                ></div>
            )}

            <div className="grid grid-cols-3 gap-2 relative z-10">
                {board.map((cell, index) => (
                    <button
                        key={index}
                        onClick={() => handleClick(index)}
                        disabled={!myTurn || cell !== null || roundResult}
                        className={`
                            w-20 h-20 sm:w-24 sm:h-24 text-5xl font-black flex items-center justify-center rounded-lg transition-all duration-200
                            ${cell === null ? "bg-gray-900 hover:bg-gray-850" : "bg-gray-900"}
                            ${cell === "X" ? "text-blue-500 drop-shadow-[0_0_2px_rgba(59,130,246,0.8)]" : "text-pink-500 drop-shadow-[0_0_2px_rgba(236,72,153,0.8)]"}
                            ${myTurn && cell === null && !roundResult ? "hover:scale-105 hover:shadow-inner cursor-pointer" : "cursor-default"}
                        `}
                    >
                        {cell}
                    </button>
                ))}
            </div>
        </div>

        {/* --- SONUÇ EKRANI (Overlay - KÜÇÜLTÜLDÜ VE COMPACT HALE GETİRİLDİ) --- */}
        {showOverlay && roundResult && (
            <div className="absolute inset-0 z-50 flex items-center justify-center">
                {/* Arka planı biraz karart ama tamamen kapatma */}
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[2px] rounded-xl"></div>
                
                <div className="relative bg-gray-800 p-6 rounded-xl border border-gray-600 shadow-2xl text-center animate-in zoom-in duration-300 max-w-[200px]">
                    
                    <h1 className={`text-3xl font-black mb-2
                        ${roundResult.winnerId === socket.id ? "text-green-400" : 
                          roundResult.winnerId === "draw" ? "text-yellow-400" : "text-red-500"}
                    `}>
                        {roundResult.winnerId === socket.id ? "KAZANDIN!" : 
                         roundResult.winnerId === "draw" ? "BERABERE" : "KAYBETTİN"}
                    </h1>
                    
                    {/* Yükleme Çubuğu */}
                    <div className="h-1 w-full bg-gray-700 rounded-full my-3 overflow-hidden">
                        <div className="h-full bg-white animate-[width_3s_linear_reverse_forwards]" style={{width: '100%'}}></div>
                    </div>
                    
                    <p className="text-gray-400 text-xs font-mono">
                        Yeni tur: {countdown}
                    </p>
                </div>
            </div>
        )}
    </div>
  );
}

export default XOX;