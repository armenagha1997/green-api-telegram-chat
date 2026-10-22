import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageBubble } from './MessageBubble'

const meta: Meta<typeof MessageBubble> = {
  title: 'Components/MessageBubble',
  component: MessageBubble,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof MessageBubble>

const base = {
  id: '1',
  chatId: 'chat-1',
  timestamp: Date.now(),
}

export const Incoming: Story = {
  args: {
    message: { ...base, text: 'Привет! Как дела?', direction: 'in', status: 'sent' },
  },
}

export const Outgoing: Story = {
  args: {
    message: { ...base, text: 'Отлично, спасибо!', direction: 'out', status: 'sent' },
  },
}

export const Sending: Story = {
  args: {
    message: { ...base, text: 'Отправляется…', direction: 'out', status: 'sending' },
  },
}

export const SendError: Story = {
  args: {
    message: {
      ...base,
      text: 'Не получилось отправить',
      direction: 'out',
      status: 'error',
      errorMessage: 'GREEN-API вернул ошибку 401',
    },
  },
}
