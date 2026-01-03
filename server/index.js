// server/index.js (DÜZELTİLMİŞ - HAKEM EKLENDİ)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

// server/index.js içindeki io tanımı (ESKİSİNİ SİL BUNU YAPIŞTIR)

const io = new Server(server, {
    cors: {
        origin: "*",            // Herkese izin ver (Vercel, localhost vs.)
        methods: ["GET", "POST"] 
        // DİKKAT: 'credentials: true' satırını bilerek SİLDİK.
        // Yıldız (*) ile credentials yan yana gelince hata verir.
    }
});

let rooms = {}; 

io.on('connection', (socket) => {
    console.log(`🔌 Bağlantı: ${socket.id}`);

    // --- 1. ODAYA GİRİŞ ---
    socket.on("join_room", ({ username, room, password, avatar }) => {
        if (rooms[room]) {
            if (rooms[room].password && rooms[room].password !== password) {
                socket.emit("error_message", "Hatalı şifre!");
                return;
            }
        } else {
            rooms[room] = {
                password: password || null,
                users: [],
                gameState: "lobby",
                activeGame: null,
                gameMoves: {} // --- YENİ: Hamleleri burada tutacağız
            };
        }

        socket.join(room);

        const newUser = {
            id: socket.id,
            username,
            avatar,
            room,
            isHost: rooms[room].users.length === 0,
            isReady: false,
            score: 0
        };
        rooms[room].users.push(newUser);

        socket.emit("room_joined", { 
            room, 
            isHost: newUser.isHost,
            gameStatus: rooms[room].gameState,
            activeGame: rooms[room].activeGame
        });

        io.to(room).emit("update_users", rooms[room].users);
    });

    // --- 2. HAZIR OLMA ---
    socket.on("toggle_ready", ({ room }) => {
        if (!rooms[room]) return;
        const user = rooms[room].users.find(u => u.id === socket.id);
        if (user) {
            user.isReady = !user.isReady;
            io.to(room).emit("update_users", rooms[room].users);
        }
    });

    // --- 3. OYUN YÖNETİMİ ---
    socket.on("select_game", ({ room, gameId }) => {
        if (!rooms[room]) return;
        rooms[room].activeGame = gameId;
        io.to(room).emit("game_selected", gameId);
    });

    // server/index.js içinde "start_game" bölümünü bul ve bununla değiştir:
    socket.on("start_game", ({ room }) => {
        if (!rooms[room]) return;
        
        rooms[room].gameState = "playing";
        
        // TKM için temizlik
        rooms[room].gameMoves = {}; 

        // XOX için başlangıç ayarları
        if (rooms[room].activeGame === 'xox') {
            rooms[room].board = Array(9).fill(null); // 9 boş kare
            rooms[room].turn = rooms[room].users[0].id; // İlk sıra Host'un
        }

        io.to(room).emit("game_started", { 
            turn: rooms[room].turn // İlk sıranın kimde olduğunu bildir
        });
    });

    // server/index.js içine ekle (start_game'in altına uygun bir yere)

    // --- YENİ: OYUN DURUMUNU SENKRONİZE ET ---
    // XOX bileşeni ilk açıldığında bunu çağıracak
    socket.on("sync_game_state", ({ room }) => {
        if (!rooms[room]) return;

        // Eğer aktif oyun XOX ise
        if (rooms[room].activeGame === 'xox') {
            // Sadece soran kişiye güncel durumu yolla
            socket.emit("xox_update", { 
                board: rooms[room].board, 
                turn: rooms[room].turn 
            });
        }
    });

    socket.on("return_lobby", ({ room }) => {
         if (!rooms[room]) return;
         rooms[room].gameState = "lobby";
         rooms[room].activeGame = null;
         rooms[room].gameMoves = {};
         rooms[room].users.forEach(u => u.isReady = false);
         io.to(room).emit("return_lobby");
         io.to(room).emit("update_users", rooms[room].users);
    });

    // --- 4. OYUN HAMLELERİ VE HESAPLAMA (ÖNEMLİ KISIM) ---
    // server/index.js içindeki game_move kısmı

    // server/index.js içinde "game_move" olayını TAMAMEN bununla değiştir:
    socket.on("game_move", ({ room, move, gameType }) => {
        if (!rooms[room]) return;

        // --- SENARYO A: TAŞ KAĞIT MAKAS ---
        if (gameType === 'tkm') {
            rooms[room].gameMoves[socket.id] = move;
            socket.to(room).emit("opponent_moved_signal");

            const moves = rooms[room].gameMoves;
            const playerIDs = Object.keys(moves);

            if (playerIDs.length === 2) {
                const p1 = playerIDs[0]; const p2 = playerIDs[1];
                const m1 = moves[p1]; const m2 = moves[p2];
                let winnerId = "draw";

                if (m1 !== m2) {
                    if ((m1 === "Tas" && m2 === "Makas") || (m1 === "Kagit" && m2 === "Tas") || (m1 === "Makas" && m2 === "Kagit")) {
                        winnerId = p1;
                    } else {
                        winnerId = p2;
                    }
                }

                if (winnerId !== "draw") {
                    const winnerUser = rooms[room].users.find(u => u.id === winnerId);
                    if (winnerUser) winnerUser.score += 1;
                }

                io.to(room).emit("round_result", { winnerId, moves });
                io.to(room).emit("update_users", rooms[room].users);
                rooms[room].gameMoves = {};
            }
        }

        // --- SENARYO B: XOX (YENİ) ---
        // --- SENARYO B: XOX (GÜNCELLENMİŞ) ---
        else if (gameType === 'xox') {
            // 1. Odayı ve sırayı kontrol et
            if (!rooms[room] || rooms[room].turn !== socket.id) return;

            // 2. Hamle yapılacak kare dolu mu?
            const index = move;
            if (rooms[room].board[index] !== null) return;

            // 3. Hamleyi Tahtaya İşle
            // Host her zaman 'X', Misafir 'O' olsun
            const isHost = rooms[room].users[0].id === socket.id;
            const symbol = isHost ? 'X' : 'O';
            rooms[room].board[index] = symbol;

            console.log(`❌⭕ XOX Hamlesi: ${socket.id} (${symbol}) -> Kare ${index}`);

            // 4. Kazanma Kontrolü
            const b = rooms[room].board;
            const winConditions = [
                [0,1,2], [3,4,5], [6,7,8], // Yataylar
                [0,3,6], [1,4,7], [2,5,8], // Dikeyler
                [0,4,8], [2,4,6]           // Çaprazlar
            ];

            let winnerId = null;
            let winningLine = null; // --- YENİ: Kazanan çizgiyi tutacak ---
            
            for (let condition of winConditions) {
                const [x, y, z] = condition;
                if (b[x] && b[x] === b[y] && b[x] === b[z]) {
                    winnerId = socket.id;
                    winningLine = condition; // --- YENİ: [0, 1, 2] gibi kaydet ---
                    break;
                }
            }

            if (!winnerId && !b.includes(null)) {
                winnerId = "draw";
            }

            // 5. Durumu Güncelle
            if (winnerId) {
                // Skor artır
                if (winnerId !== "draw") {
                    const wUser = rooms[room].users.find(u => u.id === winnerId);
                    if (wUser) wUser.score += 1;
                }

                io.to(room).emit("xox_update", { board: rooms[room].board, turn: null });
                
                // --- GÜNCELLEME: winningLine'ı da gönderiyoruz ---
                io.to(room).emit("round_result", { winnerId, winningLine });
                // ------------------------------------------------
                
                io.to(room).emit("update_users", rooms[room].users);

                setTimeout(() => {
                    if(rooms[room]) {
                        rooms[room].board = Array(9).fill(null);
                        rooms[room].turn = rooms[room].users[0].id; 
                        io.to(room).emit("xox_restart", { turn: rooms[room].turn });
                    }
                }, 3000);

            } else {
                // --- OYUN DEVAM EDİYOR (SIRA DEĞİŞTİR) ---
                
                // Odadaki diğer oyuncuyu bul (Sırayı ona ver)
                const otherPlayer = rooms[room].users.find(u => u.id !== socket.id);
                
                if (otherPlayer) {
                    rooms[room].turn = otherPlayer.id; // Sırayı güncelle
                    
                    console.log(`🔄 Sıra geçti: ${otherPlayer.username}`);

                    io.to(room).emit("xox_update", { 
                        board: rooms[room].board, 
                        turn: otherPlayer.id // İstemciye yeni sırayı bildir
                    });
                } else {
                    console.log("⚠️ Hata: Odada diğer oyuncu bulunamadı!");
                }
                const nextPlayerId = rooms[room].users.find(u => u.id !== socket.id).id;
                rooms[room].turn = nextPlayerId;
                io.to(room).emit("xox_update", { board: rooms[room].board, turn: nextPlayerId });
            }
        }
    });
    // --- 5. AYRILMA ---
    socket.on("disconnect", () => {
        for (const roomCode in rooms) {
            const index = rooms[roomCode].users.findIndex(u => u.id === socket.id);
            if (index !== -1) {
                const user = rooms[roomCode].users[index];
                rooms[roomCode].users.splice(index, 1);

                if (rooms[roomCode].users.length === 0) {
                    delete rooms[roomCode];
                } else {
                    if (user.isHost && rooms[roomCode].users.length > 0) {
                        rooms[roomCode].users[0].isHost = true;
                    }
                    io.to(roomCode).emit("update_users", rooms[roomCode].users);
                    io.to(roomCode).emit("receive_message", {
                        type: "info",
                        message: `${user.username} ayrıldı.`
                    });
                }
                break;
            }
        }
    });

    socket.on("send_message", (data) => socket.to(data.room).emit("receive_message", data));
});

// server/index.js EN ALT SATIR

// Render bize bir PORT verirse onu kullan, vermezse (yereldeysek) 3001 kullan.
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`🚀 Sunucu ${PORT} portunda çalışıyor!`);
});
