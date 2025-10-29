// Gerenciamento de estado de conversas do WhatsApp
// Armazena o estado da conversa de cada usuário

interface ConversationState {
  phoneNumber: string
  step: string
  data: Record<string, any>
  lastUpdate: Date
}

// Em produção, use Redis ou banco de dados
// Por enquanto, usamos memória (será perdido ao reiniciar)
const conversations = new Map<string, ConversationState>()

export async function getConversationState(phoneNumber: string): Promise<ConversationState | null> {
  const state = conversations.get(phoneNumber)

  if (!state) {
    return null
  }

  // Limpar conversas antigas (mais de 1 hora)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  if (state.lastUpdate < oneHourAgo) {
    conversations.delete(phoneNumber)
    return null
  }

  return state
}

export async function updateConversationState(
  phoneNumber: string,
  update: { step: string; data: Record<string, any> },
): Promise<void> {
  conversations.set(phoneNumber, {
    phoneNumber,
    step: update.step,
    data: update.data,
    lastUpdate: new Date(),
  })
}

export async function clearConversationState(phoneNumber: string): Promise<void> {
  conversations.delete(phoneNumber)
}

// Limpar conversas antigas a cada 30 minutos
setInterval(
  () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    for (const [phoneNumber, state] of conversations.entries()) {
      if (state.lastUpdate < oneHourAgo) {
        conversations.delete(phoneNumber)
      }
    }
  },
  30 * 60 * 1000,
)
