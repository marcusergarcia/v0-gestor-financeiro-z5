import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { notifyOrderCompleted } from "@/lib/whatsapp"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ordemId = params.id

    // Atualizar situação para concluída
    await query("UPDATE ordens_servico SET situacao = 'concluida', updated_at = NOW() WHERE id = ?", [ordemId])

    // Notificar cliente via WhatsApp
    await notifyOrderCompleted(Number.parseInt(ordemId))

    return NextResponse.json({
      success: true,
      message: "Ordem concluída e cliente notificado",
    })
  } catch (error) {
    console.error("[API] Erro ao concluir ordem:", error)
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 })
  }
}
