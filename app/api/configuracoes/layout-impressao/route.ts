import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM layout_impressao_config ORDER BY updated_at DESC, created_at DESC")
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Erro ao buscar configurações de layout:", error)
    return NextResponse.json({ error: "Erro ao buscar configurações de layout" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const [result] = await pool.query(
      `INSERT INTO layout_impressao_config (
        nome, font_size, title_font_size, header_font_size, footer_font_size,
        signature_font_size, line_height, page_margin, margin_top, margin_bottom,
        content_margin_top, content_margin_bottom,
        show_logo, show_header, show_footer, logo_size, custom_page_breaks, ativo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nome,
        data.font_size,
        data.title_font_size,
        data.header_font_size,
        data.footer_font_size,
        data.signature_font_size,
        data.line_height,
        data.page_margin,
        data.margin_top,
        data.margin_bottom,
        data.content_margin_top || 8,
        data.content_margin_bottom || 8,
        data.show_logo,
        data.show_header,
        data.show_footer,
        data.logo_size,
        data.custom_page_breaks,
        true,
      ],
    )

    const insertResult = result as any
    const insertId = insertResult.insertId

    const [newConfig] = await pool.query("SELECT * FROM layout_impressao_config WHERE id = ?", [insertId])
    const configs = newConfig as any[]

    return NextResponse.json({ success: true, data: configs[0] })
  } catch (error) {
    console.error("Erro ao salvar configuração de layout:", error)
    return NextResponse.json({ error: "Erro ao salvar configuração de layout" }, { status: 500 })
  }
}
