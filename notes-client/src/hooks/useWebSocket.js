// useWebSocket.js
import { useEffect, useRef, useState, useCallback } from "react";
import { encryptData } from "../middlewares/crypto";

const getWebSocketURL = (path) => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}${path}`;
};

const useWebSocket = (path, onMessage) => {
  const url = getWebSocketURL(path);
  const wsRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [queue, setQueue] = useState([]);

  // Reconnect function
  const reconnect = useCallback(() => {
    wsRef.current = new WebSocket(url);
    wsRef.current.onopen = () => {
      setReady(true);
      // Send all queued messages
      queue.forEach((message) => send(message));
      setQueue([]);
    };

    wsRef.current.onclose = () => {
      setReady(false);
      setTimeout(reconnect, 5000);
    };

    wsRef.current.onmessage = (event) => {
      if (onMessage) {
        onMessage(event.data);
      }
    };
  }, [url, queue, onMessage]);
  const reconnectRef = useRef(reconnect);
  useEffect(() => {
    reconnectRef.current = reconnect;
  }, [reconnect]);

  useEffect(() => {
    reconnectRef.current();

    const pingInterval = setInterval(() => {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 5000);

    return () => {
      clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const send = async (message, password) => {
    if (ready) {
      const encryptedMessage = {
        ...message,
        new: {
          ...message.new,
          title: await encryptData(message?.new?.title, password),
          content: await encryptData(message?.new?.content, password),
        },
      };
      wsRef.current.send(JSON.stringify(encryptedMessage));
    } else {
      // If not ready, add the message to the queue
      setQueue([...queue, message]);
    }
  };

  return { ready, send };
};

export default useWebSocket;
