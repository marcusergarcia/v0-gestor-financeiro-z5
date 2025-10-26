"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, Settings, ImageIcon, Layout, Wrench, Calendar, Car, FileText, Database } from "lucide-react"
import { LogosTab } from "@/components/configuracoes/logos-tab"
import { LayoutTab } from "@/components/configuracoes/layout-tab"
import { EquipamentosTab } from "@/components/configuracoes/equipamentos-tab"
import { FeriadosTab } from "@/components/configuracoes/feriados-tab"
import { VisitasTab } from "@/components/configuracoes/visitas-tab"
import { ValorKmTab } from "@/components/configuracoes/valor-km-tab"
import { TermosTab } from "@/components/configuracoes/termos-tab"
import { BackupTab } from "@/components/configuracoes/backup-tab"
import { useEffect } from "react"

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("logos")
  const [logoMenu, setLogoMenu] = useState<string>("")

  useEffect(() => {
    loadLogoMenu()
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

  const handleExportarConfiguracoes = () => {
    // Implementar exportação das configurações
    console.log("Exportar configurações")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logoMenu && (
              <img
                src={logoMenu || "/placeholder.svg"}
                alt="Logo"
                className="h-12 w-12 object-contain rounded-lg shadow-md bg-white p-1"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Configurações
              </h1>
              <p className="text-gray-600 mt-1">Configure as opções do sistema</p>
            </div>
          </div>
          <Button
            onClick={handleExportarConfiguracoes}
            variant="outline"
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 bg-transparent hidden md:flex"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Configurações
          </Button>
        </div>

        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b bg-gradient-to-r from-indigo-50 to-purple-50 overflow-x-auto">
                {/* Desktop: Grid 8 colunas */}
                <TabsList className="hidden md:grid w-full grid-cols-8 h-auto p-2 bg-transparent">
                  <TabsTrigger
                    value="logos"
                    className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Logos
                  </TabsTrigger>
                  <TabsTrigger
                    value="layout"
                    className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                  >
                    <Layout className="h-4 w-4" />
                    Layout
                  </TabsTrigger>
                  <TabsTrigger
                    value="equipamentos"
                    className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white"
                  >
                    <Wrench className="h-4 w-4" />
                    Equipamentos
                  </TabsTrigger>
                  <TabsTrigger
                    value="feriados"
                    className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white"
                  >
                    <Calendar className="h-4 w-4" />
                    Feriados
                  </TabsTrigger>
                  <TabsTrigger
                    value="visitas"
                    className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    <Settings className="h-4 w-4" />
                    Visitas
                  </TabsTrigger>
                  <TabsTrigger
                    value="valor-km"
                    className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white"
                  >
                    <Car className="h-4 w-4" />
                    Valor KM
                  </TabsTrigger>
                  <TabsTrigger
                    value="termos"
                    className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white"
                  >
                    <FileText className="h-4 w-4" />
                    Termos
                  </TabsTrigger>
                  <TabsTrigger
                    value="backup"
                    className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                  >
                    <Database className="h-4 w-4" />
                    Backup
                  </TabsTrigger>
                </TabsList>

                {/* Mobile: Grid 4x2 com scroll horizontal */}
                <div className="md:hidden">
                  <TabsList className="inline-flex w-max h-auto p-2 bg-transparent gap-2">
                    <TabsTrigger
                      value="logos"
                      className="flex flex-col items-center gap-1 px-3 py-2 text-[10px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white min-w-[70px]"
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span className="whitespace-nowrap">Logos</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="layout"
                      className="flex flex-col items-center gap-1 px-3 py-2 text-[10px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white min-w-[70px]"
                    >
                      <Layout className="h-4 w-4" />
                      <span className="whitespace-nowrap">Layout</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="equipamentos"
                      className="flex flex-col items-center gap-1 px-3 py-2 text-[10px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white min-w-[70px]"
                    >
                      <Wrench className="h-4 w-4" />
                      <span className="whitespace-nowrap">Equip.</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="feriados"
                      className="flex flex-col items-center gap-1 px-3 py-2 text-[10px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white min-w-[70px]"
                    >
                      <Calendar className="h-4 w-4" />
                      <span className="whitespace-nowrap">Feriados</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="visitas"
                      className="flex flex-col items-center gap-1 px-3 py-2 text-[10px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white min-w-[70px]"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="whitespace-nowrap">Visitas</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="valor-km"
                      className="flex flex-col items-center gap-1 px-3 py-2 text-[10px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white min-w-[70px]"
                    >
                      <Car className="h-4 w-4" />
                      <span className="whitespace-nowrap">KM</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="termos"
                      className="flex flex-col items-center gap-1 px-3 py-2 text-[10px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white min-w-[70px]"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="whitespace-nowrap">Termos</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="backup"
                      className="flex flex-col items-center gap-1 px-3 py-2 text-[10px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white min-w-[70px]"
                    >
                      <Database className="h-4 w-4" />
                      <span className="whitespace-nowrap">Backup</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <div className="p-6">
                <TabsContent value="logos" className="mt-0">
                  <LogosTab />
                </TabsContent>

                <TabsContent value="layout" className="mt-0">
                  <LayoutTab />
                </TabsContent>

                <TabsContent value="equipamentos" className="mt-0">
                  <EquipamentosTab />
                </TabsContent>

                <TabsContent value="feriados" className="mt-0">
                  <FeriadosTab />
                </TabsContent>

                <TabsContent value="visitas" className="mt-0">
                  <VisitasTab />
                </TabsContent>

                <TabsContent value="valor-km" className="mt-0">
                  <ValorKmTab />
                </TabsContent>

                <TabsContent value="termos" className="mt-0">
                  <TermosTab />
                </TabsContent>

                <TabsContent value="backup" className="mt-0">
                  <BackupTab />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
