// Funções para enviar mensagens via WhatsApp Business API

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0"
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

export async function sendWhatsAppMessage(to: string, message: string) {
  try {
    if (!WHATSAPP_PHONE_ID || !WHATSAPP_TOKEN) {
      console.error("[WhatsApp] Credenciais não configuradas")
      return false
    }

    const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          body: message,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[WhatsApp] Erro ao enviar mensagem:", data)
      return false
    }

    console.log("[WhatsApp] Mensagem enviada com sucesso para:", to)
    return true
  } catch (error) {
    console.error("[WhatsApp] Erro ao enviar mensagem:", error)
    return false
  }
}

export async function sendWhatsAppTemplate(to: string, templateName: string, parameters: string[]) {
  try {
    if (!WHATSAPP_PHONE_ID || !WHATSAPP_TOKEN) {
      console.error("[WhatsApp] Credenciais não configuradas")
      return false
    }

    const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "pt_BR",
          },
          components: [
            {
              type: "body",
              parameters: parameters.map((param) => ({
                type: "text",
                text: param,
              })),
            },
          ],
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[WhatsApp] Erro ao enviar template:", data)
      return false
    }

    console.log("[WhatsApp] Template enviado com sucesso para:", to)
    return true
  } catch (error) {
    console.error("[WhatsApp] Erro ao enviar template:", error)
    return false
  }
}

// Notificar cliente quando ordem for concluída
export async function notifyOrderCompleted(ordemId: number) {
  try {
    const result = (await query(
      `SELECT os.numero, os.tipo_servico, c.telefone, c.nome 
       FROM ordens_servico os 
       LEFT JOIN clientes c ON os.cliente_id = c.id 
       WHERE os.id = ?`,
      [ordemId],
    )) as any[]

    if (result.length === 0 || !result[0].telefone) {
      console.log("[WhatsApp] Cliente sem telefone cadastrado")
      return false
    }

    const ordem = result[0]
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://seu-app.vercel.app"

    await sendWhatsAppMessage(
      ordem.telefone,
      `✅ *Ordem de Serviço Concluída!*\n\n` +
        `📋 Número: *${ordem.numero}*\n` +
        `🔧 Tipo: ${getTipoServicoLabel(ordem.tipo_servico)}\n\n` +
        `O serviço foi finalizado com sucesso.\n\n` +
        `🔗 Ver detalhes: ${appUrl}/ordem-servico/${ordem.numero}\n\n` +
        `Obrigado por confiar na Macintel! 🙏`,
    )

    return true
  } catch (error) {
    console.error("[WhatsApp] Erro ao notificar conclusão:", error)
    return false
  }
}

function getTipoServicoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    manutencao: "Manutenção",
    orcamento: "Orçamento",
    vistoria_contrato: "Vistoria para Contrato",
    preventiva: "Preventiva",
  }
  return labels[tipo] || tipo
}

// Importar query do db
import { query } from "@/lib/db"
