import type { Meta, StoryObj } from '@storybook/react-vite'
import { RootStore, StoresContext } from '@/stores/RootStore'
import { MessageInput } from './MessageInput'

const meta: Meta<typeof MessageInput> = {
  title: 'Components/MessageInput',
  component: MessageInput,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <StoresContext.Provider value={new RootStore()}>
        <Story />
      </StoresContext.Provider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof MessageInput>

export const Default: Story = {
  args: { chatId: 'chat-1' },
}
