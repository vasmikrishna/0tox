import { CartProvider } from "@/components/store/cart-provider"
import { CartBar } from "@/components/store/cart-bar"

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <CartBar />
      {children}
    </CartProvider>
  )
}
