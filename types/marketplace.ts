export interface MarketplaceItem {
  id: string
  name: string
  description: string
  image: string
  price: number // Price in SOL
  currency: string
  amount: number // Amount of currency received
}

export interface PurchaseHistory {
  id: string
  itemId: string
  name: string
  amount: number
  price: number
  date: Date
  transactionSignature?: string
}
