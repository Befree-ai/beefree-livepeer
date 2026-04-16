'use client'

import { PrivyProvider } from '@privy-io/react-auth'

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#10b981',
        },
        loginMethods: [
          'email',
          'sms',   
          'google',
          'wallet',
        ],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}