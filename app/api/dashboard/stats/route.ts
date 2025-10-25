import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    // Buscar estatísticas gerais
    const [totalOrcamentosResult] = await pool.execute("SELECT COUNT(*) as total FROM orcamentos")
    const totalOrcamentos = (totalOrcamentosResult as any[])[0]?.total || 0

    const [totalBoletosResult] = await pool.execute("SELECT COUNT(*) as total FROM boletos")
    const totalBoletos = (totalBoletosResult as any[])[0]?.total || 0

    const [totalClientesResult] = await pool.execute("SELECT COUNT(*) as total FROM clientes WHERE ativo = true")
    const totalClientes = (totalClientesResult as any[])[0]?.total || 0

    const [boletosVencidosResult] = await pool.execute("SELECT COUNT(*) as total FROM boletos WHERE status = 'vencido'")
    const boletosVencidos = (boletosVencidosResult as any[])[0]?.total || 0

    const [orcamentosAbertosResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM orcamentos WHERE status = 'pendente'",
    )
    const orcamentosAbertos = (orcamentosAbertosResult as any[])[0]?.total || 0

    const [receitaTotalResult] = await pool.execute(
      "SELECT COALESCE(SUM(valor), 0) as total FROM boletos WHERE status = 'pago'",
    )
    const receitaTotal = Number((receitaTotalResult as any[])[0]?.total || 0)

    // Buscar boletos por status
    const [boletosPorStatusResult] = await pool.execute(`
      SELECT 
        status,
        COUNT(*) as quantidade,
        COALESCE(SUM(valor), 0) as valor_total
      FROM boletos 
      GROUP BY status
    `)
    const boletosPorStatus = boletosPorStatusResult as any[]

    // Buscar orçamentos por status
    const [orcamentosPorStatusResult] = await pool.execute(`
      SELECT 
        status,
        COUNT(*) as quantidade,
        COALESCE(SUM(valor_total), 0) as valor_total
      FROM orcamentos 
      GROUP BY status
    `)
    const orcamentosPorStatus = orcamentosPorStatusResult as any[]

    // Buscar receita por mês (últimos 6 meses)
    const [receitaPorMesResult] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as mes,
        COALESCE(SUM(valor), 0) as receita
      FROM boletos 
      WHERE status = 'pago' 
        AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY mes DESC
    `)
    const receitaPorMes = receitaPorMesResult as any[]

    return NextResponse.json({
      success: true,
      data: {
        totais: {
          orcamentos: totalOrcamentos,
          boletos: totalBoletos,
          clientes: totalClientes,
          boletosVencidos: boletosVencidos,
          orcamentosAbertos: orcamentosAbertos,
          receita: receitaTotal,
        },
        boletosPorStatus,
        orcamentosPorStatus,
        receitaPorMes,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas do dashboard:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
