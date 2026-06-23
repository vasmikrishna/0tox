"use client"

import { useEffect, useRef, useState } from "react"

interface FormHandlerProps {
  children: React.ReactNode
}

export function FormHandler({ children }: FormHandlerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function handleSubmit(e: SubmitEvent) {
      const form = e.target as HTMLFormElement
      if (!container!.contains(form)) return

      e.preventDefault()
      e.stopPropagation()

      const formData = new FormData(form)
      const data: Record<string, string> = {}
      formData.forEach((value, key) => {
        if (typeof value === "string") data[key] = value
      })

      // Map common field patterns to our expected fields
      const payload = {
        name: data.name || data.full_name || data.fullname || data.first_name || "",
        email: data.email || data.mail || "",
        phone: data.phone || data.tel || data.telephone || data.mobile || "",
        message: data.message || data.msg || data.comment || data.comments || data.inquiry || data.enquiry || "",
        source: "website_form",
      }

      if (!payload.name || !payload.email) {
        setToast({ type: "error", message: "Please fill in your name and email." })
        setTimeout(() => setToast(null), 4000)
        return
      }

      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"], button:not([type])') as HTMLButtonElement | null
      if (submitBtn) {
        submitBtn.disabled = true
        submitBtn.textContent = "Sending..."
      }

      fetch("/api/public/form-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed")
          setToast({ type: "success", message: "Thank you! We'll get back to you soon." })
          form.reset()
          setTimeout(() => setToast(null), 5000)
        })
        .catch(() => {
          setToast({ type: "error", message: "Something went wrong. Please try again." })
          setTimeout(() => setToast(null), 5000)
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.disabled = false
            submitBtn.textContent = "Send Message"
          }
        })
    }

    container.addEventListener("submit", handleSubmit as EventListener, true)
    return () => container.removeEventListener("submit", handleSubmit as EventListener, true)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {children}

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            animation: "s9FadeIn 0.3s ease",
          }}
          onClick={() => setToast(null)}
          data-testid="form-toast-overlay"
        >
          <div
            style={{
              background: toast.type === "success" ? "#059669" : "#dc2626",
              color: "#fff",
              padding: "32px 48px",
              borderRadius: "16px",
              textAlign: "center",
              maxWidth: "420px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
              animation: "s9SlideUp 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>
              {toast.type === "success" ? "✓" : "!"}
            </div>
            <p style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px" }}>
              {toast.type === "success" ? "Message Sent!" : "Oops!"}
            </p>
            <p style={{ fontSize: "14px", opacity: 0.9, margin: 0 }}>{toast.message}</p>
            {toast.type === "success" && (
              <p style={{ fontSize: "12px", opacity: 0.7, marginTop: "12px" }}>
                This will close automatically...
              </p>
            )}
          </div>
          <style>{`
            @keyframes s9FadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes s9SlideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
          `}</style>
        </div>
      )}
    </div>
  )
}
