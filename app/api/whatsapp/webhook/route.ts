import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendWhatsAppMessage } from "@/lib/whatsapp"
import { getConversationState, updateConversationState, clearConversationState } from "@/lib/whatsapp-conversation"

// Verificação do webhook (Meta exige isso)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "seu_token_de_verificacao"

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WhatsApp] Webhook verificado com sucesso")
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Verificação falhou" }, { status: 403 })
}

// Receber mensagens do WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[WhatsApp] Webhook recebido:", JSON.stringify(body, null, 2))

    // Verificar se é uma mensagem
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (!value?.messages) {
      return NextResponse.json({ success: true, message: "Sem mensagens" })
    }

    const message = value.messages[0]
    const from = message.from // Número do WhatsApp do cliente
    const messageText = message.text?.body?.toLowerCase() || ""
    const messageType = message.type

    console.log("[WhatsApp] Mensagem recebida de:", from, "Texto:", messageText)

    // Ignorar mensagens que não são texto
    if (messageType !== "text") {
      return NextResponse.json({ success: true, message: "Tipo de mensagem não suportado" })
    }

    // Buscar estado da conversa
    const conversationState = await getConversationState(from)

    // Processar mensagem baseado no estado da conversa
    await processMessage(from, messageText, conversationState)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[WhatsApp] Erro ao processar webhook:", error)
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 })
  }
}

async function processMessage(phoneNumber: string, message: string, state: any) {
  // Se não há estado, iniciar nova conversa
  if (!state || !state.step) {
    if (message.includes("ordem") || message.includes("serviço") || message.includes("ajuda")) {
      await startNewOrder(phoneNumber)
    } else {
      await sendWhatsAppMessage(
        phoneNumber,
        "Olá! 👋 Sou o assistente virtual da *Macintel*.\n\n" +
          "Para abrir uma ordem de serviço, digite:\n*ordem* ou *serviço*\n\n" +
          "Como posso ajudar?",
      )
    }
    return
  }

  // Processar baseado no passo atual
  switch (state.step) {
    case "awaiting_client_info":
      await handleClientInfo(phoneNumber, message, state)
      break

    case "awaiting_service_type":
      await handleServiceType(phoneNumber, message, state)
      break

    case "awaiting_description":
      await handleDescription(phoneNumber, message, state)
      break

    case "awaiting_confirmation":
      await handleConfirmation(phoneNumber, message, state)
      break

    default:
      await startNewOrder(phoneNumber)
  }
}

async function startNewOrder(phoneNumber: string) {
  await updateConversationState(phoneNumber, {
    step: "awaiting_client_info",
    data: {},
  })

  await sendWhatsAppMessage(
    phoneNumber,
    "🔧 *Nova Ordem de Serviço*\n\n" +
      "Vou precisar de algumas informações.\n\n" +
      "Por favor, me informe:\n" +
      "1️⃣ Nome do condomínio ou empresa\n" +
      "2️⃣ Endereço completo\n" +
      "3️⃣ Nome do responsável\n" +
      "4️⃣ Telefone de contato\n\n" +
      "_Você pode enviar tudo de uma vez ou separado._",
  )
}

async function handleClientInfo(phoneNumber: string, message: string, state: any) {
  // Tentar extrair informações do cliente
  const data = state.data || {}

  // Salvar a mensagem como informação do cliente
  data.clientInfo = (data.clientInfo || "") + " " + message

  // Verificar se temos informações suficientes (nome e endereço)
  const hasName = data.clientInfo.length > 10
  const hasAddress = message.includes("rua") || message.includes("av") || message.includes("avenida")

  if (hasName) {
    // Buscar cliente no banco de dados
    const searchTerms = message.split(" ").slice(0, 3).join(" ")
    const clientes = (await query(
      "SELECT id, nome, telefone, endereco FROM clientes WHERE nome LIKE ? OR telefone LIKE ? LIMIT 5",
      [`%${searchTerms}%`, `%${phoneNumber}%`],
    )) as any[]

    if (clientes.length > 0) {
      // Cliente encontrado
      data.cliente_id = clientes[0].id
      data.cliente_nome = clientes[0].nome

      await updateConversationState(phoneNumber, {
        step: "awaiting_service_type",
        data,
      })

      await sendWhatsAppMessage(
        phoneNumber,
        `✅ Cliente identificado: *${clientes[0].nome}*\n\n` +
          "Agora, qual o tipo de serviço?\n\n" +
          "1️⃣ Manutenção\n" +
          "2️⃣ Orçamento\n" +
          "3️⃣ Vistoria para Contrato\n" +
          "4️⃣ Preventiva\n\n" +
          "_Digite o número ou nome do serviço_",
      )
    } else {
      // Cliente não encontrado, criar novo
      await updateConversationState(phoneNumber, {
        step: "awaiting_service_type",
        data: { ...data, new_client: true },
      })

      await sendWhatsAppMessage(
        phoneNumber,
        "📝 Vou cadastrar um novo cliente com essas informações.\n\n" +
          "Qual o tipo de serviço?\n\n" +
          "1️⃣ Manutenção\n" +
          "2️⃣ Orçamento\n" +
          "3️⃣ Vistoria para Contrato\n" +
          "4️⃣ Preventiva\n\n" +
          "_Digite o número ou nome do serviço_",
      )
    }
  } else {
    await sendWhatsAppMessage(
      phoneNumber,
      "Por favor, me informe mais detalhes:\n" + "- Nome do local\n" + "- Endereço\n" + "- Responsável",
    )
  }
}

async function handleServiceType(phoneNumber: string, message: string, state: any) {
  const data = state.data || {}

  // Mapear tipo de serviço
  let tipoServico = ""
  if (message.includes("1") || message.includes("manutenção") || message.includes("manutencao")) {
    tipoServico = "manutencao"
  } else if (message.includes("2") || message.includes("orçamento") || message.includes("orcamento")) {
    tipoServico = "orcamento"
  } else if (message.includes("3") || message.includes("vistoria")) {
    tipoServico = "vistoria_contrato"
  } else if (message.includes("4") || message.includes("preventiva")) {
    tipoServico = "preventiva"
  }

  if (!tipoServico) {
    await sendWhatsAppMessage(
      phoneNumber,
      "❌ Opção inválida.\n\n" +
        "Por favor, escolha:\n" +
        "1️⃣ Manutenção\n" +
        "2️⃣ Orçamento\n" +
        "3️⃣ Vistoria para Contrato\n" +
        "4️⃣ Preventiva",
    )
    return
  }

  data.tipo_servico = tipoServico

  await updateConversationState(phoneNumber, {
    step: "awaiting_description",
    data,
  })

  await sendWhatsAppMessage(
    phoneNumber,
    `✅ Tipo de serviço: *${getTipoServicoLabel(tipoServico)}*\n\n` +
      "Agora, descreva o problema ou serviço necessário:\n\n" +
      "_Exemplo: Elevador social parado no 5º andar_",
  )
}

async function handleDescription(phoneNumber: string, message: string, state: any) {
  const data = state.data || {}
  data.descricao = message

  await updateConversationState(phoneNumber, {
    step: "awaiting_confirmation",
    data,
  })

  const resumo =
    `📋 *Resumo da Ordem de Serviço*\n\n` +
    `👤 Cliente: ${data.cliente_nome || "Novo cliente"}\n` +
    `🔧 Tipo: ${getTipoServicoLabel(data.tipo_servico)}\n` +
    `📝 Descrição: ${data.descricao}\n\n` +
    `Confirma a criação da ordem?\n\n` +
    `✅ Digite *SIM* para confirmar\n` +
    `❌ Digite *NÃO* para cancelar`

  await sendWhatsAppMessage(phoneNumber, resumo)
}

async function handleConfirmation(phoneNumber: string, message: string, state: any) {
  if (message.includes("sim") || message.includes("confirmar") || message.includes("ok")) {
    await createOrderFromWhatsApp(phoneNumber, state.data)
  } else {
    await clearConversationState(phoneNumber)
    await sendWhatsAppMessage(
      phoneNumber,
      "❌ Ordem de serviço cancelada.\n\n" + "Digite *ordem* quando quiser abrir uma nova solicitação.",
    )
  }
}

async function createOrderFromWhatsApp(phoneNumber: string, data: any) {
  try {
    // Se é novo cliente, criar primeiro
    let clienteId = data.cliente_id

    if (data.new_client) {
      const clienteData = {
        nome: data.clientInfo.substring(0, 100),
        telefone: phoneNumber,
        status: "ativo",
      }

      const result = (await query("INSERT INTO clientes (nome, telefone, status, created_at) VALUES (?, ?, ?, NOW())", [
        clienteData.nome,
        clienteData.telefone,
        clienteData.status,
      ])) as any

      clienteId = result.insertId
      console.log("[WhatsApp] Novo cliente criado:", clienteId)
    }

    // Gerar número da ordem
    const numeroResult = (await query(
      "SELECT COALESCE(MAX(CAST(SUBSTRING(numero, 1, 6) AS UNSIGNED)), 0) + 1 as proximo FROM ordens_servico",
    )) as any[]
    const proximoNumero = numeroResult[0]?.proximo || 1
    const numero = proximoNumero.toString().padStart(6, "0")

    // Criar ordem de serviço
    const ordemData = {
      numero,
      cliente_id: clienteId,
      tecnico_name: "A definir",
      tipo_servico: data.tipo_servico,
      descricao_defeito: data.descricao,
      data_atual: new Date().toISOString().split("T")[0],
      situacao: "aberta",
      solicitado_por: "WhatsApp",
      observacoes: `Ordem criada via WhatsApp do número ${phoneNumber}`,
    }

    await query(
      `INSERT INTO ordens_servico 
       (numero, cliente_id, tecnico_name, tipo_servico, descricao_defeito, 
        data_atual, situacao, solicitado_por, observacoes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ordemData.numero,
        ordemData.cliente_id,
        ordemData.tecnico_name,
        ordemData.tipo_servico,
        ordemData.descricao_defeito,
        ordemData.data_atual,
        ordemData.situacao,
        ordemData.solicitado_por,
        ordemData.observacoes,
      ],
    )

    console.log("[WhatsApp] Ordem criada:", numero)

    // Limpar estado da conversa
    await clearConversationState(phoneNumber)

    // Enviar confirmação
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://seu-app.vercel.app"
    await sendWhatsAppMessage(
      phoneNumber,
      `✅ *Ordem de Serviço Criada!*\n\n` +
        `📋 Número: *${numero}*\n` +
        `🔧 Tipo: ${getTipoServicoLabel(data.tipo_servico)}\n\n` +
        `Um técnico será designado em breve.\n` +
        `Você receberá atualizações por aqui.\n\n` +
        `🔗 Acompanhe em: ${appUrl}/ordem-servico/${numero}`,
    )
  } catch (error) {
    console.error("[WhatsApp] Erro ao criar ordem:", error)
    await sendWhatsAppMessage(
      phoneNumber,
      "❌ Erro ao criar ordem de serviço.\n\n" +
        "Por favor, entre em contato pelo telefone ou tente novamente mais tarde.",
    )
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
