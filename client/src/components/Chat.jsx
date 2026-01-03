import React, { useEffect, useState, useRef } from "react";

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const messagesEndRef = useRef(null);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'chat'
      };
      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  useEffect(() => {
    const handler = (data) => setMessageList((list) => [...list, data]);
    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  return (
    <div className="flex flex-col h-full bg-gray-800 border-l border-gray-700">
      <div className="p-3 bg-gray-900 border-b border-gray-700 font-bold text-gray-300 text-sm uppercase tracking-wide">
        Sohbet Odası
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messageList.map((msg, index) => {
          if (msg.type === 'info') {
             return <div key={index} className="text-center text-xs text-gray-500 italic">{msg.message}</div>
          }
          const isMe = msg.author === username;
          return (
            <div key={index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <span className="text-[10px] text-gray-400 px-1 mb-0.5">{msg.author}</span>
              <div className={`px-3 py-2 rounded-lg text-sm max-w-[90%] break-words ${isMe ? "bg-purple-600 text-white rounded-br-none" : "bg-gray-700 text-gray-200 rounded-bl-none"}`}>
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-gray-900 flex gap-2">
        <input
          type="text"
          value={currentMessage}
          placeholder="Mesaj..."
          className="flex-1 bg-gray-800 text-white text-sm rounded px-3 py-2 outline-none focus:ring-1 focus:ring-purple-500"
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} className="text-purple-400 hover:text-white transition">➤</button>
      </div>
    </div>
  );
}
export default Chat;