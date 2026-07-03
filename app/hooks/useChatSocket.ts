'use client';
import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket';

type MessageHandler = (message: unknown) => void;
type ConversationUpdateHandler = (update: { conversationId: string; lastMessage: unknown; lastActivity: string }) => void;
type ConversationMetaHandler = (update: { conversationId: string; conversation: unknown }) => void;
type ConversationRemovedHandler = (update: { conversationId: string }) => void;

interface UseChatSocketOptions {
  conversationId?: string | null;
  onMessage?: MessageHandler;
  onConversationUpdated?: ConversationUpdateHandler;
  onConversationMetaUpdated?: ConversationMetaHandler;
  onRemovedFromConversation?: ConversationRemovedHandler;
  onConversationDeleted?: ConversationRemovedHandler;
  onConversationCleared?: ConversationRemovedHandler;
}

export function useChatSocket({
  conversationId,
  onMessage,
  onConversationUpdated,
  onConversationMetaUpdated,
  onRemovedFromConversation,
  onConversationDeleted,
  onConversationCleared,
}: UseChatSocketOptions) {
  const msgRef = useRef(onMessage);
  const convRef = useRef(onConversationUpdated);
  const metaRef = useRef(onConversationMetaUpdated);
  const removedRef = useRef(onRemovedFromConversation);
  const deletedRef = useRef(onConversationDeleted);
  const clearedRef = useRef(onConversationCleared);
  msgRef.current = onMessage;
  convRef.current = onConversationUpdated;
  metaRef.current = onConversationMetaUpdated;
  removedRef.current = onRemovedFromConversation;
  deletedRef.current = onConversationDeleted;
  clearedRef.current = onConversationCleared;

  // Listen for global events (sidebar updates)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleConvUpdated = (update: { conversationId: string; lastMessage: unknown; lastActivity: string }) => {
      convRef.current?.(update);
    };
    const handleMetaUpdated = (update: { conversationId: string; conversation: unknown }) => {
      metaRef.current?.(update);
    };
    const handleRemoved = (update: { conversationId: string }) => {
      removedRef.current?.(update);
    };
    const handleDeleted = (update: { conversationId: string }) => {
      deletedRef.current?.(update);
    };
    const handleCleared = (update: { conversationId: string }) => {
      clearedRef.current?.(update);
    };

    socket.on('conversation_updated', handleConvUpdated);
    socket.on('conversation_meta_updated', handleMetaUpdated);
    socket.on('removed_from_conversation', handleRemoved);
    socket.on('conversation_deleted', handleDeleted);
    socket.on('conversation_cleared', handleCleared);

    return () => {
      socket.off('conversation_updated', handleConvUpdated);
      socket.off('conversation_meta_updated', handleMetaUpdated);
      socket.off('removed_from_conversation', handleRemoved);
      socket.off('conversation_deleted', handleDeleted);
      socket.off('conversation_cleared', handleCleared);
    };
  }, []);

  // Join specific conversation room
  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket) return;

    const join = () => socket.emit('join_conversation', conversationId);

    if (socket.connected) {
      join();
    } else {
      socket.once('connect', join);
    }

    const handleMessage = (message: unknown) => {
      msgRef.current?.(message);
    };
    socket.on('message_received', handleMessage);

    return () => {
      socket.off('message_received', handleMessage);
      socket.emit('leave_conversation', conversationId);
    };
  }, [conversationId]);
}
