import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { generateUUID } from "@/lib/utils"

export async function GET(request: NextRequest, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params

    // CORREÇÃO: Usar DATE_FORMAT para retornar datas como strings puras
    const orcamentoQuery = `
      SELECT 
        o.*,
        DATE_FORMAT(o.data_orcamento, '%Y-%m-%d') as data_orcamento,
        DATE_FORMAT(o.data_inicio, '%Y-%m-%d') as data_inicio,
        DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        DATE_FORMAT(o.updated_at, '%Y-%m-%d %H:%i:%s') as updated_at,
        c.nome as cliente_nome,
        c.codigo as cliente_codigo,
        c.cnpj as cliente_cnpj,
        c.cpf as cliente_cpf,
        c.email as cliente_email,
        c.telefone as cliente_telefone,
        c.endereco as cliente_endereco,
        c.bairro as cliente_bairro,
        c.cidade as cliente_cidade,
        c.estado as cliente_estado,
        c.distancia_km,
        c.nome_adm,
        c.contato_adm,
        c.telefone_adm,
        c.email_adm
      FROM orcamentos o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      WHERE o.numero = ?
    `

    const orcamentos = await query(orcamentoQuery, [numero])

    if (!orcamentos || orcamentos.length === 0) {
      return NextResponse.json({ success: false, message: "Orçamento não encontrado" }, { status: 404 })
    }

    const orcamento = orcamentos[0]

    // Buscar itens do orçamento com informações dos produtos
    const itensQuery = `
      SELECT 
        oi.*,
        p.codigo as produto_codigo,
        p.descricao as produto_descricao,
        p.unidade as produto_unidade,
        p.ncm as produto_ncm,
        p.marca as marca_nome
      FROM orcamentos_itens oi
      LEFT JOIN produtos p ON oi.produto_id = p.id
      WHERE oi.orcamento_numero = ?
      ORDER BY oi.id
    `

    const itens = await query(itensQuery, [numero])

    // Montar resposta
    const response = {
      ...orcamento,
      itens: itens || [],
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error("Erro ao buscar orçamento:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

// Função para comparar se dois valores são diferentes (considerando precisão numérica)
function isDifferent(oldValue: any, newValue: any): boolean {
  if (oldValue === null && newValue === null) return false
  if (oldValue === null || newValue === null) return true

  // Para números, comparar com tolerância
  if (typeof oldValue === "number" && typeof newValue === "number") {
    return Math.abs(oldValue - newValue) > 0.001
  }

  // Para strings, comparar diretamente
  return String(oldValue).trim() !== String(newValue).trim()
}

// Função para verificar se um item foi modificado
function itemWasModified(existingItem: any, newItem: any): boolean {
  const fieldsToCompare = [
    "produto_id",
    "quantidade",
    "valor_unitario",
    "valor_mao_obra",
    "valor_total",
    "marca_nome",
    "produto_ncm",
    "valor_unitario_ajustado",
    "valor_total_ajustado",
  ]

  return fieldsToCompare.some((field) => isDifferent(existingItem[field], newItem[field]))
}

// CORREÇÃO: Função para converter data para formato DATE do MySQL (sem timezone)
function formatDateForMySQL(dateString: string | null | undefined): string | null {
  if (!dateString) return null

  try {
    // Se já está no formato YYYY-MM-DD, retorna como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }

    // Se está no formato ISO completo, extrai apenas a parte da data
    const dateOnly = dateString.split("T")[0]
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      return dateOnly
    }

    return null
  } catch {
    return null
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params
    const data = await request.json()

    // Verificar se o orçamento existe
    const orcamentoExistente = await query("SELECT * FROM orcamentos WHERE numero = ?", [numero])

    if (!orcamentoExistente || orcamentoExistente.length === 0) {
      return NextResponse.json({ success: false, message: "Orçamento não encontrado" }, { status: 404 })
    }

    const orcamentoAtual = orcamentoExistente[0]

    // Verificar se houve mudanças no orçamento principal
    const orcamentoFields = [
      "cliente_id",
      "tipo_servico",
      "detalhes_servico",
      "valor_material",
      "valor_mao_obra",
      "desconto",
      "valor_total",
      "validade",
      "observacoes",
      "situacao",
      "data_orcamento",
      "data_inicio",
      "distancia_km",
      "valor_boleto",
      "prazo_dias",
      "juros_am",
      "imposto_servico",
      "imposto_material",
      "desconto_mdo_percent",
      "desconto_mdo_valor",
      "parcelamento_mdo",
      "parcelamento_material",
      "custo_deslocamento",
      "valor_juros",
      "taxa_boleto_mdo",
      "taxa_boleto_material",
      "valor_imposto_servico",
      "valor_imposto_material",
      "subtotal_mdo",
      "subtotal_material",
    ]

    const orcamentoModificado = orcamentoFields.some((field) => isDifferent(orcamentoAtual[field], data[field]))

    // Atualizar dados do orçamento apenas se houve mudanças
    if (orcamentoModificado) {
      console.log("🔄 Atualizando dados do orçamento...")

      // CORREÇÃO: Converter datas para formato DATE do MySQL
      const dataOrcamentoFormatada = formatDateForMySQL(data.data_orcamento)
      const dataInicioFormatada = formatDateForMySQL(data.data_inicio)

      const updateQuery = `
        UPDATE orcamentos SET
          cliente_id = ?,
          tipo_servico = ?,
          detalhes_servico = ?,
          valor_material = ?,
          valor_mao_obra = ?,
          desconto = ?,
          valor_total = ?,
          validade_dias = ?,
          observacoes = ?,
          situacao = ?,
          data_orcamento = ?,
          data_inicio = ?,
          distancia_km = ?,
          valor_boleto = ?,
          prazo_dias = ?,
          juros_am = ?,
          imposto_servico = ?,
          imposto_material = ?,
          desconto_mdo_percent = ?,
          desconto_mdo_valor = ?,
          parcelamento_mdo = ?,
          parcelamento_material = ?,
          custo_deslocamento = ?,
          valor_juros = ?,
          taxa_boleto_mdo = ?,
          taxa_boleto_material = ?,
          valor_imposto_servico = ?,
          valor_imposto_material = ?,
          subtotal_mdo = ?,
          subtotal_material = ?,
          updated_at = NOW()
        WHERE numero = ?
      `

      await query(updateQuery, [
        data.cliente_id,
        data.tipo_servico,
        data.detalhes_servico || null,
        data.valor_material,
        data.valor_mao_obra,
        data.desconto || 0,
        data.valor_total,
        data.validade,
        data.observacoes || null,
        data.situacao,
        dataOrcamentoFormatada,
        dataInicioFormatada,
        data.distancia_km || 0,
        data.valor_boleto || 0,
        data.prazo_dias || 0,
        data.juros_am || 0,
        data.imposto_servico || 0,
        data.imposto_material || 0,
        data.desconto_mdo_percent || 0,
        data.desconto_mdo_valor || 0,
        data.parcelamento_mdo || 1,
        data.parcelamento_material || 1,
        data.custo_deslocamento || 0,
        data.valor_juros || 0,
        data.taxa_boleto_mdo || 0,
        data.taxa_boleto_material || 0,
        data.valor_imposto_servico || 0,
        data.valor_imposto_material || 0,
        data.subtotal_mdo || 0,
        data.subtotal_material || 0,
        numero,
      ])
    } else {
      console.log("ℹ️ Nenhuma alteração nos dados do orçamento")
    }

    // Buscar itens existentes com todos os dados
    const itensExistentes = await query(
      `
      SELECT * FROM orcamentos_itens 
      WHERE orcamento_numero = ? 
      ORDER BY id
    `,
      [numero],
    )

    const itensExistentesMap = new Map()
    itensExistentes.forEach((item: any) => {
      itensExistentesMap.set(item.id, item)
    })

    // Processar itens enviados
    const itensEnviados = data.itens || []
    const idsEnviados = new Set()
    let itensAtualizados = 0
    let itensInseridos = 0

    // Atualizar ou inserir itens
    for (let i = 0; i < itensEnviados.length; i++) {
      const item = itensEnviados[i]

      if (item.id && itensExistentesMap.has(item.id)) {
        // Item existe - verificar se precisa de UPDATE
        const itemExistente = itensExistentesMap.get(item.id)

        if (itemWasModified(itemExistente, item)) {
          const updateItemQuery = `
            UPDATE orcamentos_itens SET
              produto_id = ?,
              quantidade = ?,
              valor_unitario = ?,
              valor_mao_obra = ?,
              valor_total = ?,
              marca_nome = ?,
              produto_ncm = ?,
              valor_unitario_ajustado = ?,
              valor_total_ajustado = ?,
              updated_at = NOW()
            WHERE id = ? AND orcamento_numero = ?
          `

          await query(updateItemQuery, [
            item.produto_id,
            item.quantidade,
            item.valor_unitario,
            item.valor_mao_obra,
            item.valor_total,
            item.marca_nome || null,
            item.produto_ncm || null,
            item.valor_unitario_ajustado || null,
            item.valor_total_ajustado || null,
            item.id,
            numero,
          ])

          itensAtualizados++
        }

        idsEnviados.add(item.id)
      } else {
        // Item novo - fazer INSERT
        const itemId = item.id || generateUUID()

        const insertItemQuery = `
          INSERT INTO orcamentos_itens (
            id,
            orcamento_numero,
            produto_id,
            quantidade,
            valor_unitario,
            valor_mao_obra,
            valor_total,
            marca_nome,
            produto_ncm,
            valor_unitario_ajustado,
            valor_total_ajustado,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `

        await query(insertItemQuery, [
          itemId,
          numero,
          item.produto_id,
          item.quantidade,
          item.valor_unitario,
          item.valor_mao_obra,
          item.valor_total,
          item.marca_nome || null,
          item.produto_ncm || null,
          item.valor_unitario_ajustado || null,
          item.valor_total_ajustado || null,
        ])

        idsEnviados.add(itemId)
        itensInseridos++
      }
    }

    // Remover itens que não foram enviados (foram removidos do orçamento)
    const idsExistentes = new Set(itensExistentes.map((item: any) => item.id))
    const idsParaRemover = [...idsExistentes].filter((id) => !idsEnviados.has(id))
    let itensRemovidos = 0

    if (idsParaRemover.length > 0) {
      const placeholders = idsParaRemover.map(() => "?").join(",")
      await query(`DELETE FROM orcamentos_itens WHERE id IN (${placeholders}) AND orcamento_numero = ?`, [
        ...idsParaRemover,
        numero,
      ])
      itensRemovidos = idsParaRemover.length
    }

    // Log resumido das operações
    const operacoes = []
    if (orcamentoModificado) operacoes.push("orçamento atualizado")
    if (itensAtualizados > 0) operacoes.push(`${itensAtualizados} itens atualizados`)
    if (itensInseridos > 0) operacoes.push(`${itensInseridos} itens inseridos`)
    if (itensRemovidos > 0) operacoes.push(`${itensRemovidos} itens removidos`)

    if (operacoes.length > 0) {
      console.log(`✅ Orçamento ${numero}: ${operacoes.join(", ")}`)
    } else {
      console.log(`ℹ️ Orçamento ${numero}: nenhuma alteração detectada`)
    }

    return NextResponse.json({
      success: true,
      message: "Orçamento processado com sucesso",
      changes: {
        orcamento: orcamentoModificado,
        itens: {
          atualizados: itensAtualizados,
          inseridos: itensInseridos,
          removidos: itensRemovidos,
        },
      },
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar orçamento:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Erro interno do servidor: ${error.message}`,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params

    // Verificar se o orçamento existe
    const orcamentoExistente = await query("SELECT id FROM orcamentos WHERE numero = ?", [numero])

    if (!orcamentoExistente || orcamentoExistente.length === 0) {
      return NextResponse.json({ success: false, message: "Orçamento não encontrado" }, { status: 404 })
    }

    // Remover itens do orçamento
    await query("DELETE FROM orcamentos_itens WHERE orcamento_numero = ?", [numero])

    // Remover orçamento
    await query("DELETE FROM orcamentos WHERE numero = ?", [numero])

    console.log(`🗑️ Orçamento ${numero} removido com sucesso`)

    return NextResponse.json({
      success: true,
      message: "Orçamento removido com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro ao remover orçamento:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
