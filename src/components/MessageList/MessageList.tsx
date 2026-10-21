import { format, isSameDay } from 'date-fns'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { MessageBubble } from '@/components/MessageBubble'
import type { Chat } from '@/stores/ChatStore'
import { useStores } from '@/stores/RootStore'
import styles from './MessageList.module.scss'

interface MessageListProps {
  chat: Chat
}

export const MessageList = observer(function MessageList({ chat }: MessageListProps) {
  const { chatStore } = useStores()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [chat.messages.length, chat.chatId])

  return (
    <div className={styles.list}>
      {chat.messages.map((message, index) => {
        const prev = chat.messages[index - 1]
        const showDaySeparator = !prev || !isSameDay(prev.timestamp, message.timestamp)
        return (
          <div key={message.id}>
            {showDaySeparator && (
              <div className={styles.daySeparator}>
                <span>{format(message.timestamp, 'd MMMM')}</span>
              </div>
            )}
            <MessageBubble
              message={message}
              onRetry={
                message.status === 'error'
                  ? () => chatStore.retry(chat.chatId, message.id)
                  : undefined
              }
            />
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
})
