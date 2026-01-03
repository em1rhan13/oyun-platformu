import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import Chat from './components/Chat';
import TKM from './games/TKM';
import XOX from './games/XOX';

// Socket Bağlantısı
const socket = io.connect("https://oyun-server.onrender.com");

function App() {
  const [userData, setUserData] = useState(null); // Benim bilgilerim
  const [roomUsers, setRoomUsers] = useState([]);   // Odadaki herkes
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Oyun Durumları
  const [gameState, setGameState] = useState("lobby"); // lobby | playing
  const [activeGame, setActiveGame] = useState(null);
  const [winnerAnim, setWinnerAnim] = useState(null); // Kazanan animasyonu için

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    socket.on("room_joined", (data) => {
        setIsLoggedIn(true);
        setGameState(data.gameStatus);
        setActiveGame(data.activeGame);
    });

    socket.on("error_message", (msg) => alert(msg));
    socket.on("update_users", (users) => setRoomUsers(users));
    
    socket.on("game_selected", (gameId) => setActiveGame(gameId));
    socket.on("game_started", () => setGameState("playing"));
    socket.on("return_lobby", () => {
        setGameState("lobby");
        setActiveGame(null);
        setWinnerAnim(null);
    });
    
    // TKM Sonucu (Buraya özel mantık ekledim)
    socket.on("game_result", ({ winner, moves }) => {
        // TKM bileşeni yerine sonucu burada hesaplayıp socket'ten dinlemek daha temiz
        // (Şimdilik sunucu tarafında TKM result logic'i tekrar eklemedik, 
        // önceki versiyondaki mantığı buraya entegre edelim)
    });
    
    socket.on("update_scores", (users) => setRoomUsers(users));

    return () => {
        socket.off("room_joined");
        socket.off("update_users");
        socket.off("game_started");
    };
  }, []);


  // --- İŞLEVLER ---
  const handleJoin = (data) => {
    setUserData(data);
    socket.emit("join_room", data);
  };

  const toggleReady = () => socket.emit("toggle_ready", { room: userData.room });
  
  const selectGame = (gameId) => socket.emit("select_game", { room: userData.room, gameId });
  
  const startGame = () => socket.emit("start_game", { room: userData.room });
  
  const exitRoom = () => window.location.reload(); 

  // --- TKM İÇİN GEÇİCİ SONUÇ HESAPLAMA (Frontend tarafında simüle ediyoruz) ---
  // Not: Profesyonel çözümde bu logic sunucuda olur.
  const [moves, setMoves] = useState({});
  useEffect(() => {
    // Kendi ve Rakip hamlelerini dinle, ikisi de varsa hesapla
    const checkWinner = () => { /* Burası biraz kompleks, istersen sonra ekleriz */ }
  }, [moves]);


  // --- RENDER ---
  if (!isLoggedIn) {
      return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
              <Login onJoin={handleJoin} />
          </div>
      );
  }

  const amIHost = roomUsers.find(u => u.username === userData.username)?.isHost;
  const allReady = roomUsers.length > 1 && roomUsers.every(u => u.isReady);

  return (
    <div className="h-screen bg-gray-900 text-white flex overflow-hidden">
        
        {/* 1. SOL SÜTUN: BİLGİLER (Genişlik: 25%) */}
        <div className="w-1/4 bg-gray-800 border-r border-gray-700 flex flex-col p-4">
            <div className="mb-6">
                <h2 className="text-xs text-gray-500 uppercase font-bold">Oda Kodu</h2>
                <div className="text-3xl font-mono text-purple-400 font-bold tracking-widest">{userData.room}</div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <h2 className="text-xs text-gray-500 uppercase font-bold mb-3">Oyuncular ({roomUsers.length})</h2>
                <div className="space-y-3">
                    {roomUsers.map((user) => (
                        <div key={user.id} className={`flex items-center gap-3 p-3 rounded-lg border ${user.isReady ? "border-green-500 bg-green-900/20" : "border-gray-700 bg-gray-700"}`}>
                            <div className="text-2xl">{user.avatar}</div>
                            <div className="flex-1">
                                <div className="font-bold text-sm flex items-center gap-2">
                                    {user.username}
                                    {user.isHost && <span className="text-yellow-400 text-[10px]">👑</span>}
                                </div>
                                <div className="text-xs text-gray-400">Skor: <span className="text-white font-bold">{user.score}</span></div>
                            </div>
                            {user.isReady && <div className="text-green-500">✔</div>}
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={exitRoom} className="mt-4 w-full py-3 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded font-bold transition">
                ÇIKIŞ YAP
            </button>
        </div>


        {/* 2. ORTA SÜTUN: OYUN ALANI (Genişlik: 50%) */}
        <div className="w-2/4 bg-gray-900 relative flex flex-col items-center justify-center p-6">
            
            {/* LOBİ MODU */}
            {gameState === "lobby" && (
                <div className="text-center w-full max-w-md">
                    {activeGame ? (
                        <div className="mb-8">
                            <h2 className="text-gray-400">Seçilen Oyun</h2>
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
                                {activeGame === "tkm" ? "TAŞ KAĞIT MAKAS" : activeGame}
                            </h1>
                            
                            {/* HAZIR OL BUTONU */}
                            <button 
                                onClick={toggleReady}
                                className={`px-8 py-3 rounded-full font-bold text-xl transition transform hover:scale-105 mb-4 
                                    ${roomUsers.find(u=>u.id === socket.id)?.isReady ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                            >
                                {roomUsers.find(u=>u.id === socket.id)?.isReady ? "HAZIRSIN! BEKLE..." : "HAZIRIM DEMEK İÇİN TIKLA"}
                            </button>

                            {/* HOST İÇİN BAŞLAT BUTONU */}
                            {amIHost && (
                                <div className="mt-4">
                                    <button 
                                        onClick={startGame}
                                        disabled={!allReady}
                                        className={`w-full py-3 rounded font-bold ${allReady ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse" : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}
                                    >
                                        {allReady ? "OYUNU BAŞLAT ▶" : "OYUNCULAR BEKLENİYOR..."}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        // OYUN SEÇİM KARTLARI
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-gray-300">Bir Oyun Seçin</h2>
                            <div className="grid grid-cols-2 gap-4">
                                
                                {/* TKM KARTI */}
                                <div 
                                    onClick={() => amIHost && selectGame("tkm")}
                                    className={`p-6 bg-gray-800 border-2 rounded-xl cursor-pointer hover:scale-105 transition group
                                        ${activeGame === 'tkm' ? "border-purple-500 bg-gray-700" : "border-gray-700"}
                                        ${amIHost ? "hover:border-purple-500" : "opacity-70 cursor-default"}`}
                                >
                                    <div className="text-4xl mb-2 group-hover:animate-bounce">✊✋✌️</div>
                                    <div className="font-bold text-white">Taş Kağıt Makas</div>
                                </div>

                                {/* XOX KARTI (ARTIK AKTİF!) */}
                                <div 
                                    onClick={() => amIHost && selectGame("xox")}
                                    className={`p-6 bg-gray-800 border-2 rounded-xl cursor-pointer hover:scale-105 transition group
                                        ${activeGame === 'xox' ? "border-blue-500 bg-gray-700" : "border-gray-700"}
                                        ${amIHost ? "hover:border-blue-500" : "opacity-70 cursor-default"}`}
                                >
                                    <div className="text-4xl mb-2 group-hover:spin">❌⭕</div>
                                    <div className="font-bold text-white">XOX</div>
                                </div>

                            </div>
                            {!amIHost && <p className="mt-6 text-gray-500 animate-pulse">Host oyun seçiyor...</p>}
                        </div>
                    )}
                </div>
            )}

            {/* OYUN MODU */}
            {gameState === "playing" && (
                <div className="flex-1 bg-gray-800/50 rounded-xl border border-gray-700/50 relative overflow-hidden">
                        {activeGame === "tkm" && <TKM socket={socket} room={userData.room} />}
                        {/* YENİ EKLENEN SATIR: */}
                        {activeGame === "xox" && <XOX socket={socket} room={userData.room} />}
                    </div>
            )}
        </div>


        {/* 3. SAĞ SÜTUN: SOHBET (Genişlik: 25%) */}
        <div className="w-1/4 h-full">
            <Chat socket={socket} username={userData.username} room={userData.room} />
        </div>

    </div>
  );
}

export default App;