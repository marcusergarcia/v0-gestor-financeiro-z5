"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/types/usuario"
import { getFirstAvailableRoute } from "@/lib/redirect-helper"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, senha: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token")
      const userData = localStorage.getItem("user")

      if (!token || !userData) {
        setLoading(false)
        return
      }

      // Usar dados do localStorage diretamente
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error("Erro ao parsear dados do usuário:", error)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error)
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, senha: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, senha }),
      })

      const data = await response.json()

      if (data.success && data.user) {
        localStorage.setItem("token", data.user.email) // Usar email como token simples
        localStorage.setItem("user", JSON.stringify(data.user))
        setUser(data.user)

        // Pequeno delay para garantir que o estado foi atualizado
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Redirecionar para a primeira rota com permissão
        const firstRoute = getFirstAvailableRoute(data.user)
        console.log("Redirecionando para:", firstRoute)

        // Usar window.location para garantir um refresh completo
        window.location.href = firstRoute

        return { success: true }
      } else {
        return { success: false, message: data.message || "Erro ao fazer login" }
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error)
      return { success: false, message: "Erro ao conectar com o servidor" }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    window.location.href = "/login"
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}
