"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DollarSign,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Filter,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { NovoBoletoDialog } from "@/components/financeiro/novo-boleto-dialog"
import { EditarBoletoDialog } from "@/components/financeiro/editar-boleto-dialog"
import { VisualizarBoletosDialog } from "@/components/financeiro/visualizar-boletos-dialog"

interface Boleto {
  id: number
  numero: string
  cliente_id: number
  cliente_nome: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: "pendente" | "pago" | "vencido" | "cancelado"
  numero_parcela: number
  total_parcelas: number
  observacoes?: string
  created_at: string
}

interface Recibo {
  id: number
  numero: string
  cliente_id: number
  cliente_nome: string
  valor: number
  data_emissao: string
  descricao: string
  observacoes?: string
  created_at: string
}

export default function FinanceiroPage() {
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchBoletos, setSearchBoletos] = useState("")
  const [searchRecibos, setSearchRecibos] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [periodoFilter, setPeriodoFilter] = useState("todos")
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [showNovoBoleto, setShowNovoBoleto] = useState(false)
  const [showEditarBoleto, setShowEditarBoleto] = useState(false)
  const [showVisualizarBoletos, setShowVisualizarBoletos] = useState(false)
  const [boletoParaEditar, setBoletoParaEditar] = useState<Boleto | null>(null)
  const [boletoParaVisualizar, setBoletoParaVisualizar] = useState<string>("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [boletoParaExcluir, setBoletoParaExcluir] = useState<Boleto | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [valoresOcultos, setValoresOcultos] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
    loadLogoMenu()
    // Carregar preferência de valores ocultos do localStorage
    const savedPreference = localStorage.getItem("financeiro-valores-ocultos")
    if (savedPreference) {
      setValoresOcultos(savedPreference === "true")
    }
  }, [])

  const loadLogoMenu = async () => {
    try {
      const response = await fetch("/api/configuracoes/logos")
      const result = await response.json()
      if (result.success && result.data?.length > 0) {
        const menuLogo = result.data.find((logo: any) => logo.tipo === "menu")
        if (menuLogo?.arquivo_base64) {
          setLogoMenu(menuLogo.arquivo_base64)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar logo do menu:", error)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [boletosRes, recibosRes] = await Promise.all([fetch("/api/boletos"), fetch("/api/recibos")])

      const [boletosData, recibosData] = await Promise.all([boletosRes.json(), recibosRes.json()])

      if (boletosData.success) {
        const boletosProcessados = boletosData.data.map((boleto: any) => ({
          ...boleto,
          valor: typeof boleto.valor === "string" ? Number.parseFloat(boleto.valor) : boleto.valor,
          cliente_id: typeof boleto.cliente_id === "string" ? Number.parseInt(boleto.cliente_id) : boleto.cliente_id,
          numero_parcela:
            typeof boleto.numero_parcela === "string" ? Number.parseInt(boleto.numero_parcela) : boleto.numero_parcela,
          total_parcelas:
            typeof boleto.total_parcelas === "string" ? Number.parseInt(boleto.total_parcelas) : boleto.total_parcelas,
        }))
        setBoletos(boletosProcessados || [])
      }
      if (recibosData.success) {
        setRecibos(recibosData.data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados financeiros",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleValoresOcultos = () => {
    const novoEstado = !valoresOcultos
    setValoresOcultos(novoEstado)
    localStorage.setItem("financeiro-valores-ocultos", novoEstado.toString())
  }

  const formatarValor = (valor: number) => {
    if (valoresOcultos) {
      return "R$ ••••••"
    }
    return formatCurrency(valor)
  }

  const handleVisualizarBoleto = (boleto: Boleto) => {
    setBoletoParaVisualizar(boleto.numero)
    setShowVisualizarBoletos(true)
  }

  const handleEditarBoleto = (boleto: Boleto) => {
    setBoletoParaEditar(boleto)
    setShowEditarBoleto(true)
  }

  const handleExcluirBoleto = (boleto: Boleto) => {
    setBoletoParaExcluir(boleto)
    setShowDeleteDialog(true)
  }

  const confirmarExclusao = async () => {
    if (!boletoParaExcluir) return

    try {
      setDeletingId(boletoParaExcluir.id)

      const response = await fetch(`/api/boletos/${boletoParaExcluir.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Boleto excluído com sucesso!",
        })
        await loadData()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao excluir boleto",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir boleto",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
      setShowDeleteDialog(false)
      setBoletoParaExcluir(null)
    }
  }

  const getStatusBadge = (status: string, dataVencimento?: string) => {
    const hoje = new Date()
    const vencimento = dataVencimento ? new Date(dataVencimento) : null

    if (vencimento) {
      hoje.setHours(0, 0, 0, 0)
      vencimento.setHours(0, 0, 0, 0)
    }

    const isVencido = status === "pendente" && vencimento && vencimento < hoje

    if (status === "pago") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium px-3 py-1">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pago
        </Badge>
      )
    }

    if (status === "cancelado") {
      return (
        <Badge className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 font-medium px-3 py-1">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelado
        </Badge>
      )
    }

    if (isVencido || status === "vencido") {
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 font-medium px-3 py-1 animate-pulse">
          <AlertCircle className="w-3 h-3 mr-1" />
          Vencido
        </Badge>
      )
    }

    return (
      <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-medium px-3 py-1">
        <Clock className="w-3 h-3 mr-1" />
        Pendente
      </Badge>
    )
  }

  const formatMesEmissao = (createdAt: string) => {
    try {
      const date = new Date(createdAt)
      if (isNaN(date.getTime())) return "-"

      return date
        .toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        })
        .replace(/^\w/, (c) => c.toUpperCase())
    } catch {
      return "-"
    }
  }

  const filterByPeriod = (boleto: Boleto) => {
    if (periodoFilter === "todos") return true

    const hoje = new Date()
    const dataVencimento = new Date(boleto.data_vencimento)

    switch (periodoFilter) {
      case "mes-anterior": {
        const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
        const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
        return dataVencimento >= mesAnterior && dataVencimento <= fimMesAnterior
      }
      case "mes-atual": {
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        return dataVencimento >= inicioMes && dataVencimento <= fimMes
      }
      case "mes-posterior": {
        const mesPosterior = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
        const fimMesPosterior = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0)
        return dataVencimento >= mesPosterior && dataVencimento <= fimMesPosterior
      }
      case "trimestre": {
        const inicioTrimestre = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1)
        const fimTrimestre = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        return dataVencimento >= inicioTrimestre && dataVencimento <= fimTrimestre
      }
      case "semestre": {
        const inicioSemestre = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1)
        const fimSemestre = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        return dataVencimento >= inicioSemestre && dataVencimento <= fimSemestre
      }
      default:
        return true
    }
  }

  const filteredBoletos = boletos.filter((boleto) => {
    const matchesSearch =
      boleto.numero.toLowerCase().includes(searchBoletos.toLowerCase()) ||
      boleto.cliente_nome.toLowerCase().includes(searchBoletos.toLowerCase())

    let matchesStatus = true
    if (statusFilter !== "all") {
      if (statusFilter === "vencido") {
        const hoje = new Date()
        const vencimento = new Date(boleto.data_vencimento)
        hoje.setHours(0, 0, 0, 0)
        vencimento.setHours(0, 0, 0, 0)
        matchesStatus = (boleto.status === "pendente" && vencimento < hoje) || boleto.status === "vencido"
      } else {
        matchesStatus = boleto.status === statusFilter
      }
    }

    const matchesPeriod = filterByPeriod(boleto)

    return matchesSearch && matchesStatus && matchesPeriod
  })

  const filteredRecibos = recibos.filter(
    (recibo) =>
      recibo.numero.toLowerCase().includes(searchRecibos.toLowerCase()) ||
      recibo.cliente_nome.toLowerCase().includes(searchRecibos.toLowerCase()) ||
      recibo.descricao.toLowerCase().includes(searchRecibos.toLowerCase()),
  )

  const handleDeleteRecibo = async (recibo: Recibo) => {
    try {
      const response = await fetch(`/api/recibos/${recibo.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Recibo excluído com sucesso",
        })
        loadData()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao excluir recibo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir recibo:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const boletosStats = {
    total: filteredBoletos.length,
    pendentes: filteredBoletos.filter((b) => {
      const hoje = new Date()
      const vencimento = new Date(b.data_vencimento)
      hoje.setHours(0, 0, 0, 0)
      vencimento.setHours(0, 0, 0, 0)
      return b.status === "pendente" && vencimento >= hoje
    }).length,
    pagos: filteredBoletos.filter((b) => b.status === "pago").length,
    vencidos: filteredBoletos.filter((b) => {
      const hoje = new Date()
      const vencimento = new Date(b.data_vencimento)
      hoje.setHours(0, 0, 0, 0)
      vencimento.setHours(0, 0, 0, 0)
      return (b.status === "pendente" && vencimento < hoje) || b.status === "vencido"
    }).length,
    valorTotal: filteredBoletos.reduce((acc, b) => {
      const valor = typeof b.valor === "number" && !isNaN(b.valor) ? b.valor : 0
      return acc + valor
    }, 0),
    valorPago: filteredBoletos
      .filter((b) => b.status === "pago")
      .reduce((acc, b) => {
        const valor = typeof b.valor === "number" && !isNaN(b.valor) ? b.valor : 0
        return acc + valor
      }, 0),
  }

  const recibosStats = {
    total: recibos.length,
    valorTotal: recibos.reduce((acc, r) => acc + r.valor, 0),
  }

  // Calcular estatísticas totais (sem filtro)
  const boletosStatsTotais = {
    total: boletos.length,
    pendentes: boletos.filter((b) => {
      const hoje = new Date()
      const vencimento = new Date(b.data_vencimento)
      hoje.setHours(0, 0, 0, 0)
      vencimento.setHours(0, 0, 0, 0)
      return b.status === "pendente" && vencimento >= hoje
    }).length,
    pagos: boletos.filter((b) => b.status === "pago").length,
    vencidos: boletos.filter((b) => {
      const hoje = new Date()
      const vencimento = new Date(b.data_vencimento)
      hoje.setHours(0, 0, 0, 0)
      vencimento.setHours(0, 0, 0, 0)
      return (b.status === "pendente" && vencimento < hoje) || b.status === "vencido"
    }).length,
    valorTotal: boletos.reduce((acc, b) => {
      const valor = typeof b.valor === "number" && !isNaN(b.valor) ? b.valor : 0
      return acc + valor
    }, 0),
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados financeiros...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {logoMenu && (
            <img
              src={logoMenu || "/placeholder.svg"}
              alt="Logo"
              className="h-12 w-12 object-contain rounded-lg shadow-md bg-white p-1"
            />
          )}
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Gestão Financeira
            </h1>
            <p className="text-gray-600 mt-1">Controle de boletos e recibos</p>
          </div>
        </div>

        {/* Botão de Toggle de Valores */}
        <Button
          onClick={toggleValoresOcultos}
          variant="outline"
          className="flex items-center gap-2 border-2 hover:bg-gray-50 transition-all duration-200 bg-transparent"
        >
          {valoresOcultos ? (
            <>
              <EyeOff className="h-5 w-5 text-gray-600" />
              <span className="hidden sm:inline font-medium">Mostrar Valores</span>
            </>
          ) : (
            <>
              <Eye className="h-5 w-5 text-gray-600" />
              <span className="hidden sm:inline font-medium">Ocultar Valores</span>
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards - Agora clicáveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className={`border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
            statusFilter === "all" ? "ring-2 ring-blue-400 ring-offset-2" : ""
          }`}
          onClick={() => setStatusFilter("all")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total</CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">{boletosStatsTotais.total}</div>
            <p className="text-xs text-blue-600 mt-1">{formatarValor(boletosStatsTotais.valorTotal)}</p>
          </CardContent>
        </Card>

        <Card
          className={`border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
            statusFilter === "pago" ? "ring-2 ring-green-400 ring-offset-2" : ""
          }`}
          onClick={() => setStatusFilter("pago")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Boletos Pagos</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">{boletosStatsTotais.pagos}</div>
            <p className="text-xs text-green-600 mt-1">
              {formatarValor(
                boletos
                  .filter((b) => b.status === "pago")
                  .reduce((acc, b) => acc + (typeof b.valor === "number" ? b.valor : 0), 0),
              )}
            </p>
          </CardContent>
        </Card>

        <Card
          className={`border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
            statusFilter === "pendente" ? "ring-2 ring-yellow-400 ring-offset-2" : ""
          }`}
          onClick={() => setStatusFilter("pendente")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pendentes</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-800">{boletosStatsTotais.pendentes}</div>
            <p className="text-xs text-yellow-600 mt-1">Aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card
          className={`border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
            statusFilter === "vencido" ? "ring-2 ring-red-400 ring-offset-2" : ""
          }`}
          onClick={() => setStatusFilter("vencido")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Vencidos</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-800">{boletosStatsTotais.vencidos}</div>
            <p className="text-xs text-red-600 mt-1">Requer atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="border-0 shadow-lg bg-white">
        <Tabs defaultValue="boletos" className="w-full">
          <div className="border-b bg-gradient-to-r from-green-50 to-blue-50">
            <TabsList className="grid w-full grid-cols-2 h-auto p-2 bg-transparent">
              <TabsTrigger
                value="boletos"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white"
              >
                <FileText className="h-4 w-4" />
                Boletos ({boletosStatsTotais.total})
              </TabsTrigger>
              <TabsTrigger
                value="recibos"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
              >
                <DollarSign className="h-4 w-4" />
                Recibos ({recibosStats.total})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="boletos" className="p-6 space-y-6">
            {/* Boletos Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Boletos</h2>
                <p className="text-gray-600">Gerencie todos os boletos emitidos</p>
              </div>
              <Button
                onClick={() => setShowNovoBoleto(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Boleto
              </Button>
            </div>

            {/* Boletos Filters */}
            <Card className="bg-gradient-to-r from-white to-gray-50">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar boletos..."
                      value={searchBoletos}
                      onChange={(e) => setSearchBoletos(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="pendente">Pendentes</SelectItem>
                        <SelectItem value="pago">Pagos</SelectItem>
                        <SelectItem value="vencido">Vencidos</SelectItem>
                        <SelectItem value="cancelado">Cancelados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrar por período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os períodos</SelectItem>
                        <SelectItem value="mes-anterior">Mês anterior</SelectItem>
                        <SelectItem value="mes-atual">Mês atual</SelectItem>
                        <SelectItem value="mes-posterior">Mês posterior</SelectItem>
                        <SelectItem value="trimestre">Trimestre</SelectItem>
                        <SelectItem value="semestre">Semestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Boletos Table */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg p-4 lg:p-6">
                <CardTitle>Lista de Boletos</CardTitle>
                <CardDescription className="text-green-100">
                  {filteredBoletos.length} boleto{filteredBoletos.length !== 1 ? "s" : ""} encontrado
                  {filteredBoletos.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {filteredBoletos.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      {searchBoletos || statusFilter !== "all" || periodoFilter !== "todos"
                        ? "Nenhum boleto encontrado"
                        : "Nenhum boleto cadastrado"}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {searchBoletos || statusFilter !== "all" || periodoFilter !== "todos"
                        ? "Tente ajustar os filtros de busca"
                        : "Comece criando seu primeiro boleto"}
                    </p>
                    {!searchBoletos && statusFilter === "all" && periodoFilter === "todos" && (
                      <Button
                        onClick={() => setShowNovoBoleto(true)}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeiro Boleto
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Número</TableHead>
                          <TableHead className="font-semibold">Cliente</TableHead>
                          <TableHead className="font-semibold">Valor</TableHead>
                          <TableHead className="font-semibold">Vencimento</TableHead>
                          <TableHead className="font-semibold">Mês Emissão</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Parcela</TableHead>
                          <TableHead className="font-semibold">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBoletos.map((boleto) => (
                          <TableRow key={boleto.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium">
                              <Badge variant="outline" className="font-mono">
                                {boleto.numero}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-gray-900">{boleto.cliente_nome}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-green-600">{formatarValor(boleto.valor)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{formatDate(boleto.data_vencimento)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-400" />
                                <span className="text-blue-700 font-medium">{formatMesEmissao(boleto.created_at)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(boleto.status, boleto.data_vencimento)}</TableCell>
                            <TableCell className="text-gray-700 font-medium">
                              {boleto.numero_parcela}/{boleto.total_parcelas}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVisualizarBoleto(boleto)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 bg-transparent"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditarBoleto(boleto)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 bg-transparent"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleExcluirBoleto(boleto)}
                                  disabled={deletingId === boleto.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent"
                                >
                                  {deletingId === boleto.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recibos" className="p-6 space-y-6">
            {/* Recibos Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recibos</h2>
                <p className="text-gray-600">Gerencie todos os recibos emitidos</p>
              </div>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Novo Recibo
              </Button>
            </div>

            {/* Recibos Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Total de Recibos</CardTitle>
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-800">{recibosStats.total}</div>
                  <p className="text-xs text-blue-600 mt-1">Recibos emitidos</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Valor Total</CardTitle>
                  <DollarSign className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">{formatarValor(recibosStats.valorTotal)}</div>
                  <p className="text-xs text-green-600 mt-1">Valor total dos recibos</p>
                </CardContent>
              </Card>
            </div>

            {/* Recibos Search */}
            <Card className="bg-gradient-to-r from-white to-gray-50">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar recibos..."
                    value={searchRecibos}
                    onChange={(e) => setSearchRecibos(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recibos Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Recibos</CardTitle>
                <CardDescription>
                  {filteredRecibos.length} recibo{filteredRecibos.length !== 1 ? "s" : ""} encontrado
                  {filteredRecibos.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {filteredRecibos.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      {searchRecibos ? "Nenhum recibo encontrado" : "Nenhum recibo cadastrado"}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {searchRecibos ? "Tente ajustar os termos de busca" : "Comece criando seu primeiro recibo"}
                    </p>
                    {!searchRecibos && (
                      <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeiro Recibo
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Número</TableHead>
                          <TableHead className="font-semibold">Cliente</TableHead>
                          <TableHead className="font-semibold">Descrição</TableHead>
                          <TableHead className="font-semibold">Valor</TableHead>
                          <TableHead className="font-semibold">Data Emissão</TableHead>
                          <TableHead className="font-semibold">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecibos.map((recibo) => (
                          <TableRow key={recibo.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium">
                              <Badge variant="outline" className="font-mono">
                                {recibo.numero}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-gray-900">{recibo.cliente_nome}</div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate">{recibo.descricao}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-green-600">{formatarValor(recibo.valor)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{formatDate(recibo.data_emissao)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 bg-transparent"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 bg-transparent"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir o recibo "{recibo.numero}"? Esta ação não pode
                                        ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteRecibo(recibo)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Excluir Recibo
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Dialogs */}
      <NovoBoletoDialog open={showNovoBoleto} onOpenChange={setShowNovoBoleto} onSuccess={loadData} />

      {boletoParaEditar && (
        <EditarBoletoDialog
          open={showEditarBoleto}
          onOpenChange={setShowEditarBoleto}
          boleto={boletoParaEditar}
          onSuccess={loadData}
        />
      )}

      <VisualizarBoletosDialog
        open={showVisualizarBoletos}
        onOpenChange={setShowVisualizarBoletos}
        numeroBase={boletoParaVisualizar}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-base">
              Tem certeza que deseja excluir o boleto{" "}
              <strong className="text-gray-900">{boletoParaExcluir?.numero}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="border-gray-200 hover:bg-gray-50">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={deletingId !== null}
            >
              {deletingId !== null ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
