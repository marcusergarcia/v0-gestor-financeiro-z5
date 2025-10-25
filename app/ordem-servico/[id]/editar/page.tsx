"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Save, FileText, Package, Camera, PenTool, ArrowLeft, Plus, Trash2, FileSignature } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { CameraCapture } from "@/components/ordem-servico/camera-capture"
import { SignaturePad } from "@/components/ordem-servico/signature-pad"
import { toast } from "@/hooks/use-toast"
import type { OrdemServico, OrdemServicoItem, OrdemServicoFoto, OrdemServicoAssinatura } from "@/types/ordem-servico"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditarOrdemServicoPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ordemServico, setOrdemServico] = useState<OrdemServico | null>(null)
  const [clientes, setClientes] = useState<any[]>([])
  const [tecnicos, setTecnicos] = useState<any[]>([])
  const [itens, setItens] = useState<OrdemServicoItem[]>([])
  const [fotos, setFotos] = useState<OrdemServicoFoto[]>([])
  const [assinaturas, setAssinaturas] = useState<OrdemServicoAssinatura[]>([])
  const [activeTab, setActiveTab] = useState("dados")

  useEffect(() => {
    carregarDados()
  }, [resolvedParams.id])

  const carregarDados = async () => {
    try {
      setLoading(true)

      // Carregar ordem de serviço
      const osResponse = await fetch(`/api/ordens-servico/${resolvedParams.id}`)
      const osData = await osResponse.json()

      if (osData.success) {
        setOrdemServico(osData.data)
      }

      // Carregar clientes
      const clientesResponse = await fetch("/api/clientes")
      const clientesData = await clientesResponse.json()
      if (clientesData.success) {
        setClientes(clientesData.data)
      }

      // Carregar técnicos
      const tecnicosResponse = await fetch("/api/usuarios")
      const tecnicosData = await tecnicosResponse.json()
      if (tecnicosData.success) {
        setTecnicos(tecnicosData.data.filter((u: any) => u.tipo === "tecnico"))
      }

      // Carregar itens
      const itensResponse = await fetch(`/api/ordens-servico/${resolvedParams.id}/itens`)
      const itensData = await itensResponse.json()
      if (itensData.success) {
        setItens(itensData.data)
      }

      // Carregar fotos
      const fotosResponse = await fetch(`/api/ordens-servico/${resolvedParams.id}/fotos`)
      const fotosData = await fotosResponse.json()
      if (fotosData.success) {
        setFotos(fotosData.data)
      }

      // Carregar assinaturas
      const assinaturasResponse = await fetch(`/api/ordens-servico/${resolvedParams.id}/assinaturas`)
      const assinaturasData = await assinaturasResponse.json()
      if (assinaturasData.success) {
        setAssinaturas(assinaturasData.data)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da ordem de serviço",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!ordemServico) return

    try {
      setSaving(true)

      const response = await fetch(`/api/ordens-servico/${resolvedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ordemServico),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Ordem de serviço atualizada com sucesso",
        })
        router.push(`/ordem-servico/${resolvedParams.id}`)
      } else {
        throw new Error(data.error || "Erro ao salvar")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar ordem de serviço",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddItem = async () => {
    const novoItem: Partial<OrdemServicoItem> = {
      ordem_servico_id: Number(resolvedParams.id),
      descricao: "",
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
    }

    try {
      const response = await fetch(`/api/ordens-servico/${resolvedParams.id}/itens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(novoItem),
      })

      const data = await response.json()

      if (data.success) {
        setItens([...itens, data.data])
        toast({
          title: "Sucesso",
          description: "Item adicionado com sucesso",
        })
      }
    } catch (error) {
      console.error("Erro ao adicionar item:", error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar item",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return

    try {
      const response = await fetch(`/api/ordens-servico/${resolvedParams.id}/itens/${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setItens(itens.filter((item) => item.id !== itemId))
        toast({
          title: "Sucesso",
          description: "Item excluído com sucesso",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir item:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir item",
        variant: "destructive",
      })
    }
  }

  const handleAddFoto = async (fotoBase64: string) => {
    try {
      const response = await fetch(`/api/ordens-servico/${resolvedParams.id}/fotos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ordem_servico_id: Number(resolvedParams.id),
          caminho: fotoBase64,
          descricao: "",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setFotos([...fotos, data.data])
        toast({
          title: "Sucesso",
          description: "Foto adicionada com sucesso",
        })
      }
    } catch (error) {
      console.error("Erro ao adicionar foto:", error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar foto",
        variant: "destructive",
      })
    }
  }

  const handleDeleteFoto = async (fotoId: number) => {
    if (!confirm("Tem certeza que deseja excluir esta foto?")) return

    try {
      const response = await fetch(`/api/ordens-servico/${resolvedParams.id}/fotos/${fotoId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setFotos(fotos.filter((foto) => foto.id !== fotoId))
        toast({
          title: "Sucesso",
          description: "Foto excluída com sucesso",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir foto:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir foto",
        variant: "destructive",
      })
    }
  }

  const handleAddAssinatura = async (tipo: "tecnico" | "cliente", assinaturaBase64: string) => {
    try {
      const response = await fetch(`/api/ordens-servico/${resolvedParams.id}/assinaturas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ordem_servico_id: Number(resolvedParams.id),
          tipo,
          assinatura: assinaturaBase64,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAssinaturas([...assinaturas, data.data])
        toast({
          title: "Sucesso",
          description: "Assinatura adicionada com sucesso",
        })
      }
    } catch (error) {
      console.error("Erro ao adicionar assinatura:", error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar assinatura",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!ordemServico) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Ordem de serviço não encontrada</p>
          <Link href="/ordem-servico">
            <Button className="mt-4">Voltar para listagem</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ordem-servico">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Editar Ordem de Serviço</h2>
            <p className="text-sm text-muted-foreground">OS #{ordemServico.numero}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto md:h-10">
          <TabsTrigger value="dados" className="text-xs md:text-sm flex flex-col md:flex-row items-center gap-1 py-2">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Dados</span>
          </TabsTrigger>
          <TabsTrigger value="itens" className="text-xs md:text-sm flex flex-col md:flex-row items-center gap-1 py-2">
            <Package className="h-4 w-4" />
            <span className="hidden md:inline">Itens</span>
          </TabsTrigger>
          <TabsTrigger value="fotos" className="text-xs md:text-sm flex flex-col md:flex-row items-center gap-1 py-2">
            <Camera className="h-4 w-4" />
            <span className="hidden md:inline">Fotos</span>
          </TabsTrigger>
          <TabsTrigger
            value="assinaturas"
            className="text-xs md:text-sm flex flex-col md:flex-row items-center gap-1 py-2"
          >
            <PenTool className="h-4 w-4" />
            <span className="hidden md:inline">Assinaturas</span>
          </TabsTrigger>
          <TabsTrigger
            value="observacoes"
            className="text-xs md:text-sm flex flex-col md:flex-row items-center gap-1 py-2"
          >
            <FileSignature className="h-4 w-4" />
            <span className="hidden md:inline">Obs</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Dados */}
        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg">Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cliente_id" className="text-sm">
                    Cliente *
                  </Label>
                  <Select
                    value={ordemServico.cliente_id?.toString()}
                    onValueChange={(value) => setOrdemServico({ ...ordemServico, cliente_id: Number(value) })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id.toString()}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_atual" className="text-sm">
                    Data *
                  </Label>
                  <Input
                    id="data_atual"
                    type="date"
                    value={ordemServico.data_atual}
                    onChange={(e) => setOrdemServico({ ...ordemServico, data_atual: e.target.value })}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_servico" className="text-sm">
                    Tipo de Serviço *
                  </Label>
                  <Select
                    value={ordemServico.tipo_servico}
                    onValueChange={(value) => setOrdemServico({ ...ordemServico, tipo_servico: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                      <SelectItem value="orcamento">Orçamento</SelectItem>
                      <SelectItem value="vistoria_contrato">Vistoria para Contrato</SelectItem>
                      <SelectItem value="preventiva">Preventiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tecnico_id" className="text-sm">
                    Técnico
                  </Label>
                  <Select
                    value={ordemServico.tecnico_id?.toString()}
                    onValueChange={(value) => setOrdemServico({ ...ordemServico, tecnico_id: Number(value) })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione o técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      {tecnicos.map((tecnico) => (
                        <SelectItem key={tecnico.id} value={tecnico.id.toString()}>
                          {tecnico.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="situacao" className="text-sm">
                    Situação *
                  </Label>
                  <Select
                    value={ordemServico.situacao}
                    onValueChange={(value) => setOrdemServico({ ...ordemServico, situacao: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="aberta">Aberta</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Itens */}
        <TabsContent value="itens" className="space-y-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Itens do Serviço</CardTitle>
                <Button onClick={handleAddItem} size="sm" className="h-8">
                  <Plus className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Adicionar</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {itens.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">Nenhum item adicionado</div>
              ) : (
                <div className="space-y-3">
                  {itens.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border-2 border-slate-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.descricao || "Sem descrição"}</div>
                        <div className="text-xs text-gray-500">
                          Qtd: {item.quantidade} | R$ {item.valor_unitario.toFixed(2)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Fotos */}
        <TabsContent value="fotos" className="space-y-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg">Fotos do Serviço</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <CameraCapture onCapture={handleAddFoto} />

              {fotos.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">Nenhuma foto adicionada</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {fotos.map((foto) => (
                    <div key={foto.id} className="relative group border-2 border-slate-200 rounded-lg overflow-hidden">
                      <img
                        src={foto.caminho || "/placeholder.svg"}
                        alt="Foto OS"
                        className="w-full h-32 object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteFoto(foto.id)}
                        className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Assinaturas */}
        <TabsContent value="assinaturas" className="space-y-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg">Assinaturas</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Assinatura do Técnico</Label>
                <SignaturePad onSave={(signature) => handleAddAssinatura("tecnico", signature)} />
                {assinaturas.find((a) => a.tipo === "tecnico") && (
                  <div className="border-2 border-green-200 rounded-lg p-2">
                    <img
                      src={assinaturas.find((a) => a.tipo === "tecnico")?.assinatura || "/placeholder.svg"}
                      alt="Assinatura Técnico"
                      className="max-h-24 mx-auto"
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium">Assinatura do Cliente</Label>
                <SignaturePad onSave={(signature) => handleAddAssinatura("cliente", signature)} />
                {assinaturas.find((a) => a.tipo === "cliente") && (
                  <div className="border-2 border-blue-200 rounded-lg p-2">
                    <img
                      src={assinaturas.find((a) => a.tipo === "cliente")?.assinatura || "/placeholder.svg"}
                      alt="Assinatura Cliente"
                      className="max-h-24 mx-auto"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Observações */}
        <TabsContent value="observacoes" className="space-y-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg">Observações</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <Textarea
                placeholder="Digite observações sobre o serviço..."
                value={ordemServico.observacoes || ""}
                onChange={(e) => setOrdemServico({ ...ordemServico, observacoes: e.target.value })}
                className="min-h-[200px]"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botões de ação fixos no mobile */}
      <div className="fixed md:relative bottom-0 left-0 right-0 bg-white border-t md:border-0 p-3 md:p-0 flex gap-2 z-10">
        <Link href="/ordem-servico" className="flex-1 md:flex-none">
          <Button variant="outline" className="w-full md:w-auto h-10 md:h-10 bg-transparent" disabled={saving}>
            Cancelar
          </Button>
        </Link>
        <Button onClick={handleSave} disabled={saving} className="flex-1 md:flex-none h-10 md:h-10">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  )
}
