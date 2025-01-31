import { useCallback, useState } from 'react'
import AppView from './AppView'

const BASE_URL = import.meta.env.BASE_URL ? import.meta.env.BASE_URL : '/'

function App() {
    const [loggedIn, setLoggedIn] = useState<string | undefined>(undefined)

    const handleLogout = useCallback(() => {
      setLoggedIn(undefined)
    }, [])
    

    const handleSignIn = async () => {
        if (window.ethereum && window.ethereum.enable) {
          try {
            const wallet = await window.ethereum.enable()
            if (wallet.length > 0) {
                setLoggedIn(wallet[0])
            }
          } catch (error) {
              alert('Error during sign in')
          }
        } else {
            alert('Dapper wallet not found.')
        }
    }

    const handleSignOut = async () => handleLogout()

    return <AppView {...{ handleSignIn, handleSignOut, loggedIn, BASE_URL }} />
}

export default App

