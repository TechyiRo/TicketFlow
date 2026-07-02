import { useChat } from '../context/ChatContext';

export function useSocket() {
  const { socket } = useChat();
  return socket;
}

export default useSocket;
