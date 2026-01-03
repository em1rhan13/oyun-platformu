// client/src/components/Login.jsx
import React, { useState } from 'react';

// Kullanılabilecek 16 Avatar
const AVATARS = [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
    "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐙", "🦄"
];

function Login({ onJoin }) {
    const [username, setUsername] = useState("");
    const [room, setRoom] = useState("");
    const [password, setPassword] = useState(""); // Opsiyonel
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const [error, setError] = useState("");

    const handleJoin = () => {
        if (!username || !room) {
            setError("Lütfen isim ve oda kodu giriniz.");
            return;
        }
        onJoin({ username, room, password, avatar: selectedAvatar });
    };

    return (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 relative overflow-hidden">
            {/* Arka Plan Süsü */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>

            <div className="text-center mb-8">
                <h1 className="text-4xl font-black text-white tracking-tighter">GAME <span className="text-purple-500">HUB</span></h1>
                <p className="text-gray-400 text-sm mt-2">Oyun dünyasına giriş yap</p>
            </div>

            {/* Avatar Seçimi */}
            <div className="mb-6">
                <p className="text-gray-400 text-sm mb-2 text-center">Avatarını Seç</p>
                <div className="grid grid-cols-8 gap-2">
                    {AVATARS.map((av) => (
                        <button
                            key={av}
                            onClick={() => setSelectedAvatar(av)}
                            className={`text-2xl p-1 rounded hover:bg-gray-700 transition ${selectedAvatar === av ? "bg-purple-600 ring-2 ring-purple-400 scale-110" : ""}`}
                        >
                            {av}
                        </button>
                    ))}
                </div>
            </div>

            {/* Form Alanları */}
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Kullanıcı Adı"
                    className="w-full p-4 bg-gray-900 text-white rounded-lg outline-none focus:ring-2 focus:ring-purple-500 transition border border-gray-700"
                    onChange={(e) => setUsername(e.target.value)}
                />
                
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Oda Kodu"
                        className="w-1/2 p-4 bg-gray-900 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition border border-gray-700"
                        onChange={(e) => setRoom(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Şifre (İsteğe Bağlı)"
                        className="w-1/2 p-4 bg-gray-900 text-white rounded-lg outline-none focus:ring-2 focus:ring-pink-500 transition border border-gray-700"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <button
                    onClick={handleJoin}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-lg transform active:scale-95 transition-all"
                >
                    BAŞLA 🚀
                </button>
            </div>
        </div>
    );
}

export default Login;