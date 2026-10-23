import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Chat } from '@/stores/ChatStore'
import { ChatListItem } from './ChatListItem'

const meta: Meta<typeof ChatListItem> = {
  title: 'Components/ChatListItem',
  component: ChatListItem,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof ChatListItem>

const now = Date.now()

const chatWithUnread: Chat = {
  chatId: '1',
  phone: '79991234567',
  name: '@username',
  unread: 3,
  messages: [
    {
      id: 'm1',
      chatId: '1',
      text: 'Привет, как прошла встреча?',
      direction: 'in',
      timestamp: now,
      status: 'sent',
    },
  ],
}

const chatNoName: Chat = {
  chatId: '2',
  phone: '',
  unread: 0,
  messages: [
    {
      id: 'm2',
      chatId: '2',
      text: 'Сообщение от неизвестного контакта',
      direction: 'in',
      timestamp: now,
      status: 'sent',
    },
  ],
}

export const Default: Story = {
  args: { chat: chatWithUnread, active: false, onClick: () => {} },
}

export const Active: Story = {
  args: { chat: chatWithUnread, active: true, onClick: () => {} },
}

export const UnknownContact: Story = {
  args: { chat: chatNoName, active: false, onClick: () => {} },
}
